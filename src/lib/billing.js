const PLAN_AMOUNTS = { studio: 24, scale: 48, orbit: 99 };

async function parseApiJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
      throw new Error(
        'Billing API is not reachable. Start the full dev stack with: npm run dev (needs API on port 3000, not Vite alone).',
      );
    }
    throw new Error(text.slice(0, 120) || `Invalid server response (${res.status})`);
  }
}

export async function startPlanCheckout(planId, { onSuccess, onError } = {}) {
  let res;
  try {
    res = await fetch('/api/billing/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
  } catch (e) {
    throw new Error('Cannot reach billing API. Run npm run dev so Next.js serves /api on port 3000.');
  }
  const data = await parseApiJson(res);
  if (!res.ok) throw new Error(data.error || 'Billing failed');

  if (data.demo || !data.keyId) {
    const ok = window.confirm(
      `Demo billing mode (no Razorpay keys in .env).\n\nSimulate payment for ${data.order?.planName || planId} — $${PLAN_AMOUNTS[planId] || '?'}/mo?`,
    );
    if (ok) onSuccess?.({ demo: true, planId });
    return { demo: true };
  }

  return new Promise((resolve, reject) => {
    const scriptId = 'razorpay-checkout-js';
    const open = () => {
      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        reject(new Error('Razorpay SDK failed to load'));
        return;
      }
      const rzp = new Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'OneAtlas',
        description: data.order.planName,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verify = await fetch('/api/billing/razorpay/create-order', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId,
              }),
            });
            const v = await parseApiJson(verify);
            if (!verify.ok) throw new Error(v.error);
            onSuccess?.(v);
            resolve(v);
          } catch (e) {
            onError?.(e);
            reject(e);
          }
        },
        theme: { color: '#FF6600' },
      });
      rzp.open();
    };

    if (document.getElementById(scriptId)) {
      open();
      return;
    }
    const s = document.createElement('script');
    s.id = scriptId;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = open;
    s.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(s);
  });
}
