import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PLANS = {
  studio: { amount: 2400, currency: 'INR', name: 'OneAtlas Studio' },
  scale: { amount: 4800, currency: 'INR', name: 'OneAtlas Scale' },
  orbit: { amount: 9900, currency: 'INR', name: 'OneAtlas Orbit' },
};

export async function POST(req) {
  try {
    const { planId } = await req.json();
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        demo: true,
        message: 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env for live checkout. Demo order created.',
        order: {
          id: `demo_order_${Date.now()}`,
          amount: plan.amount,
          currency: plan.currency,
          planId,
          planName: plan.name,
        },
        keyId: null,
      });
    }

    const receipt = `oa_${planId}_${Date.now()}`;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt,
        notes: { planId, product: plan.name },
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: order.error?.description || 'Razorpay error' }, { status: 502 });
    }

    return NextResponse.json({
      demo: false,
      order: { id: order.id, amount: order.amount, currency: order.currency, planId, planName: plan.name },
      keyId,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { orderId, paymentId, signature, planId } = await req.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: true, demo: true, planId });
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }
    return NextResponse.json({ success: true, planId, paymentId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
