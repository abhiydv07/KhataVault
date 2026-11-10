// Supabase Edge Function: Razorpay Webhook Handler
// Listens to Razorpay subscription events and updates user subscription status with HMAC SHA-256 signature verification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// HMAC SHA-256 Signature Verification
async function verifySignature(bodyText: string, receivedSignature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const hexToUint8Array = (hexString: string) => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
  };

  const signatureBytes = hexToUint8Array(receivedSignature);
  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(bodyText)
  );
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature && RAZORPAY_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Missing webhook signature' }), { status: 400 });
  }

  const bodyText = await req.text();

  // Verify HMAC signature
  if (RAZORPAY_WEBHOOK_SECRET) {
    const isValid = await verifySignature(bodyText, signature!, RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const subscriptionEntity = payload.payload?.subscription?.entity;

    if (!subscriptionEntity) {
      return new Response(JSON.stringify({ message: 'No subscription entity found in event' }), { status: 200 });
    }

    const subscriptionId = subscriptionEntity.id;
    const customerId = subscriptionEntity.customer_id;
    const currentEndUnix = subscriptionEntity.current_end; // timestamp seconds
    const currentPeriodEnd = currentEndUnix ? new Date(currentEndUnix * 1000).toISOString() : null;

    if (event === 'subscription.charged' || event === 'subscription.activated') {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: currentPeriodEnd,
          razorpay_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', subscriptionId);
    } else if (event === 'subscription.paused' || event === 'subscription.pending') {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', subscriptionId);
    } else if (event === 'subscription.cancelled') {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    return new Response(JSON.stringify({ status: 'success', event }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

