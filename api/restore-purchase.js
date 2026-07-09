// api/restore-purchase.js
//
// Lets someone who already paid unlock the app on a new browser/device
// without paying again. They enter the email they used at Stripe checkout;
// this scans recent Checkout Sessions for a completed payment matching
// that email. Uses the same STRIPE_SECRET_KEY env var as verify-payment.js.

const Stripe = require('stripe');

module.exports = async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();

  if (!email) {
    res.status(400).json({ error: 'Missing email' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Server is not configured with a Stripe secret key yet.' });
    return;
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    let found = false;

    for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
      const sessionEmail = session.customer_details && session.customer_details.email;
      if (sessionEmail && sessionEmail.toLowerCase() === email && session.payment_status === 'paid') {
        found = true;
        break;
      }
    }

    res.status(200).json({ paid: found });
  } catch (err) {
    console.error('Restore-purchase lookup error:', err.message);
    res.status(500).json({ error: 'Could not check for a previous payment.' });
  }
};
