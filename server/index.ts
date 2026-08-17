import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

// Initialize Stripe Client with latest API Version
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key';
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
});

const app = express();

// Webhook endpoint requires raw body for signature verification
app.post('/api/webhooks', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      event = JSON.parse(req.body.toString());
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle essential subscription & payment lifecycle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout completed for Customer: ${session.customer}`);
      
      if (session.mode === 'subscription') {
        console.log(`Activating subscription entitlement: ${session.subscription}`);
      } else if (session.mode === 'payment') {
        const amountTotal = (session.amount_total || 0) / 100;
        console.log(`Adding top-up credit balance of $${amountTotal} to customer account.`);
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoice.id} for Amount: $${invoice.amount_paid / 100}`);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe Webhook] Invoice payment failed for Customer: ${invoice.customer}`);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription status updated: ${subscription.id} -> ${subscription.status}`);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// JSON Middleware for standard API routes
app.use(express.json());
app.use(cors());

// Serve built static frontend assets
app.use(express.static(distPath));

/**
 * 1. Create Subscription Checkout Session (Starter / Pro Plans)
 */
app.post('/api/create-subscription-checkout', async (req: Request, res: Response) => {
  try {
    const { priceId, customerEmail, customerId } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId || undefined,
      customer_email: !customerId ? customerEmail : undefined,
      line_items: [
        {
          price: priceId || 'price_1U5VUcDy28wjEXYsN7AwEJMb',
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.ENABLE_AUTOMATIC_TAX === 'true' },
      integration_identifier: 'keepseed_sub_checkout_a1b2c3d4',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/pricing`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Create One-Time Top-Up Checkout Session (Prepaid API Credits)
 */
app.post('/api/create-topup-checkout', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd', customerEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'NexusAI API Credit Top-Up',
              description: 'Prepaid credit balance for AI chat & API endpoint consumption',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.ENABLE_AUTOMATIC_TAX === 'true' },
      integration_identifier: 'keepseed_topup_checkout_x9y8z7w6',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/top-up?success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/top-up`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating top-up checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Programmatic API Top-Up Endpoint (/api/v1/topup)
 * Allows SDKs, agents, and external applications to initiate or top up balance programmatically.
 */
app.post('/api/v1/topup', async (req: Request, res: Response) => {
  try {
    const { amount = 20, currency = 'usd', success_url, cancel_url } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Programmatic API Credit Top-Up',
              description: 'API-driven automated account balance top-up',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.ENABLE_AUTOMATIC_TAX === 'true' },
      integration_identifier: 'keepseed_programmatic_topup_v1',
      success_url: success_url || `${req.headers.origin || 'http://localhost:5173'}/top-up?success=true`,
      cancel_url: cancel_url || `${req.headers.origin || 'http://localhost:5173'}/top-up`,
    });

    res.json({
      status: 'success',
      checkout_url: session.url,
      session_id: session.id,
      amount: amount,
      currency: currency,
    });
  } catch (error: any) {
    console.error('Error creating programmatic API top-up:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

/**
 * 4. Create Self-Service Customer Portal Session (Invoices & Subscription Mgmt)
 */
app.post('/api/create-portal-session', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId || 'cus_demo_id',
      return_url: `${req.headers.origin || 'http://localhost:5173'}/billing`,
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Single page app fallback
app.get('*splat', (req: Request, res: Response) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Stripe Backend Server] Running on http://localhost:${PORT}`);
});
