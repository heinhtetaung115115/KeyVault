import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { verifyAdmin } from '../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversation_id');
  const status = searchParams.get('status');

  if (conversationId) {
    const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).eq('sender', 'customer').eq('is_read', false);
    return NextResponse.json({ conversation: conv, messages: msgs || [] });
  }

  let query = supabase.from('conversations').select('*').order('updated_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = [];
  for (const conv of (data || [])) {
    const { data: msgs } = await supabase.from('messages').select('body, sender, created_at').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('sender', 'customer');
    enriched.push({ ...conv, last_message: msgs?.[0] || null, message_count: count || 0 });
  }
  return NextResponse.json(enriched);
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { conversation_id, body } = await request.json();
  if (!conversation_id || !body) return NextResponse.json({ error: 'conversation_id and body required' }, { status: 400 });

  const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversation_id).single();
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const { error: msgErr } = await supabase.from('messages').insert({ conversation_id, sender: 'admin', body: body.trim() });
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  await supabase.from('conversations').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', conversation_id);

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'KeyVault Support <support@keyvaultstore.com>',
        to: conv.email,
        subject: `Re: ${conv.subject}`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;"><h2 style="font-size:18px;color:#0f172a;margin:0 0 16px;">Reply from KeyVault Support</h2><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:20px;"><p style="color:#475569;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${body.trim()}</p></div><p style="color:#94a3b8;font-size:13px;">Visit <a href="${process.env.NEXT_PUBLIC_STORE_URL}/support" style="color:#6366f1;">Support</a> to continue.</p></div>`,
      });
    }
  } catch(_e) { console.error('Reply email failed:', _e); }

  return NextResponse.json({ success: true });
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { conversation_id, status } = await request.json();
  if (!conversation_id || !status) return NextResponse.json({ error: 'conversation_id and status required' }, { status: 400 });
  const { error } = await supabase.from('conversations').update({ status, updated_at: new Date().toISOString() }).eq('id', conversation_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
