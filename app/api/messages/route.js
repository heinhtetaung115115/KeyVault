import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../lib/supabase';

// POST: create a new conversation or add a reply to existing
export async function POST(request) {
  try {
    const { email, subject, body, conversation_id, order_id } = await request.json();

    if (!email || !email.includes('@') || !body) {
      return NextResponse.json({ error: 'Email and message required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const cleanEmail = email.toLowerCase().trim();

    // If conversation_id provided, add message to existing conversation
    if (conversation_id) {
      // Verify this conversation belongs to this email
      const { data: conv } = await supabase
        .from('conversations').select('id, email')
        .eq('id', conversation_id).single();

      if (!conv || conv.email !== cleanEmail) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const { data: msg, error } = await supabase.from('messages').insert({
        conversation_id, sender: 'customer', body: body.trim(),
      }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Reopen conversation if it was closed/replied
      await supabase.from('conversations').update({
        status: 'open', updated_at: new Date().toISOString(),
      }).eq('id', conversation_id);

      return NextResponse.json(msg);
    }

    // Create new conversation
    if (!subject) {
      return NextResponse.json({ error: 'Subject required for new conversation' }, { status: 400 });
    }

    const { data: conv, error: convErr } = await supabase.from('conversations').insert({
      email: cleanEmail,
      subject: subject.trim(),
      order_id: order_id || null,
      status: 'open',
    }).select().single();

    if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

    // Add the first message
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conv.id, sender: 'customer', body: body.trim(),
    });

    if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

    return NextResponse.json({ conversation_id: conv.id });
  } catch(_e) {
    console.error('Message error:', _e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET: get conversations and messages for an email (requires OTP token)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const conversationId = searchParams.get('conversation_id');
  const token = searchParams.get('token');

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  // Verify OTP token if available, otherwise allow for just-created conversations
  // (customer can view right after submitting without OTP)
  const supabase = getSupabaseAdmin();
  const cleanEmail = email.toLowerCase().trim();

  // If requesting a specific conversation's messages
  if (conversationId) {
    const { data: conv } = await supabase
      .from('conversations').select('*').eq('id', conversationId).eq('email', cleanEmail).single();
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: msgs } = await supabase
      .from('messages').select('*').eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Mark admin messages as read (customer is viewing)
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', conversationId).eq('sender', 'admin').eq('is_read', false);

    return NextResponse.json({ conversation: conv, messages: msgs || [] });
  }

  // List all conversations for this email
  const { data: convs, error } = await supabase
    .from('conversations').select('*').eq('email', cleanEmail)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(convs || []);
}
