import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { verifyAdmin } from '../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET: list all conversations or messages for a specific conversation
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversation_id');
  const status = searchParams.get('status');

  // Get messages for a specific conversation
  if (conversationId) {
    const { data: conv } = await supabase
      .from('conversations').select('*').eq('id', conversationId).single();
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: msgs } = await supabase
      .from('messages').select('*').eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return NextResponse.json({ conversation: conv, messages: msgs || [] });
  }

  // List all conversations
  let query = supabase.from('conversations').select('*').order('updated_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get last message preview and unread count for each conversation
  const enriched = [];
  for (const conv of (data || [])) {
    const { data: msgs } = await supabase
      .from('messages').select('body, sender, created_at')
      .eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);

    const { count } = await supabase
      .from('messages').select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id).eq('sender', 'customer');

    enriched.push({
      ...conv,
      last_message: msgs?.[0] || null,
      message_count: count || 0,
    });
  }

  return NextResponse.json(enriched);
}

// POST: admin reply to a conversation
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { conversation_id, body } = await request.json();

  if (!conversation_id || !body) {
    return NextResponse.json({ error: 'conversation_id and body required' }, { status: 400 });
  }

  const { data: conv } = await supabase
    .from('conversations').select('*').eq('id', conversation_id).single();
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  // Insert admin reply
  const { error: msgErr } = await supabase.from('messages').insert({
    conversation_id, sender: 'admin', body: body.trim(),
  });
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  // Update conversation status
  await supabase.from('conversations').update({
    status: 'replied', updated_at: new Date().toISOString(),
  }).eq('id', conversation_id);

  // Send email notification to customer via Resend
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'KeyVault Support <support@keyvaultstore.com>',
        to: conv.email,
        subject: `Re: ${conv.subject}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #6366f1; color: white; width: 40px; height: 40px; border-radius: 10px; line-height: 40px; font-size: 18px; font-weight: 700;">K</div>
            </div>
            <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 16px;">You have a reply from KeyVault Support</h2>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${body.trim()}</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">To continue this conversation, visit our <a href="${process.env.NEXT_PUBLIC_STORE_URL}/support" style="color: #6366f1;">Support page</a>.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">keyvaultstore.com</p>
          </div>
        `,
      });
    }
  } catch(_e) {
    console.error('Failed to send reply email:', _e);
    // Don't fail the request if email fails
  }

  return NextResponse.json({ success: true });
}

// PUT: update conversation status (close/reopen)
export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { conversation_id, status } = await request.json();

  if (!conversation_id || !status) {
    return NextResponse.json({ error: 'conversation_id and status required' }, { status: 400 });
  }

  const { error } = await supabase.from('conversations').update({
    status, updated_at: new Date().toISOString(),
  }).eq('id', conversation_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
