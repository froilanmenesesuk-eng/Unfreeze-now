// api/verify-payment.js
//
// This is a Vercel Serverless Function (not a Netlify Function -- the two
// use different signatures and different folders, which is why the
// Netlify version didn't work here). This one lives at the URL
// /api/verify-payment automatically because it's inside the /api folder.
//
// It runs on Vercel's servers, so it's safe to use your Stripe SECRET key
// here. Set it as an environment variable in Vercel:
// Project -> Settings -> Environment Variables -> STRIPE_SECRET_KEY = sk_live_xxx (or sk_test_xxx while testing)

const Stripe = require('stripe');

module.exports = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    res.status(400).json({ error: 'Missing session_id' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Server is not configured with a Stripe secret key yet.' });
    return;
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';

    res.status(200).json({
      paid,
      email: session.customer_details ? session.customer_details.email : null,
    });
  } catch (err) {
    console.error('Stripe verification error:', err.message);
    res.status(500).json({ error: 'Could not verify this payment.' });
  }
};
