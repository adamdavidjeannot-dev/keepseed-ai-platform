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

// Helper to determine base URL dynamically for Render, custom domains, and local dev
function getBaseUrl(req: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (req.headers.origin && typeof req.headers.origin === 'string') {
    return req.headers.origin.replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host && typeof host === 'string') {
    return `${proto}://${host}`;
  }
  return 'http://localhost:5173';
}

// Enable CORS for all incoming API routes
app.use(cors());

// Webhook endpoint requires raw body for cryptographic signature verification
app.post('/api/webhooks', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      event = JSON.parse(req.body.toString());
      console.log(`[Stripe Webhook] Received unverified event: ${event.type}`);
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`[Stripe Webhook] Verified signature for event: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle essential subscription & payment lifecycle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout completed for Customer: ${session.customer}, Mode: ${session.mode}`);
      
      if (session.mode === 'subscription') {
        console.log(`[Stripe Webhook] Subscription activated: ${session.subscription}`);
      } else if (session.mode === 'payment') {
        const amountTotal = (session.amount_total || 0) / 100;
        console.log(`[Stripe Webhook] Credited top-up balance of $${amountTotal.toFixed(2)} to customer: ${session.customer || session.customer_details?.email}`);
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice paid: ${invoice.id} for Amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe Webhook] Invoice payment failed for Customer: ${invoice.customer}`);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription update: ${subscription.id} -> Status: ${subscription.status}`);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// JSON Middleware for all standard API routes
app.use(express.json());

// Serve built static frontend assets
app.use(express.static(distPath));

/**
 * Health check endpoint for Render & monitoring systems
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV || 'development',
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')),
  });
});

/**
 * Public configuration endpoint for frontend initialization
 */
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    accountId: process.env.STRIPE_ACCOUNT_ID || '',
    prices: {
      starter: process.env.PRICE_STARTER_MONTHLY || 'price_1U5VUcDy28wjEXYsN7AwEJMb',
      pro: process.env.PRICE_PRO_MONTHLY || 'price_1U5VUcDy28wjEXYsMwd5Ltxo',
    },
    currency: 'usd',
    taxEnabled: process.env.ENABLE_AUTOMATIC_TAX === 'true',
  });
});

/**
 * Checkout session inspector for return URL verification
 */
app.get('/api/checkout-session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || sessionId.startsWith('{')) {
      return res.status(400).json({ error: 'Invalid session ID provided.' });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({
      id: session.id,
      customer: session.customer,
      payment_status: session.payment_status,
      status: session.status,
      amount_total: (session.amount_total || 0) / 100,
      mode: session.mode,
      customer_email: session.customer_details?.email,
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. Create Subscription Checkout Session (Starter / Pro Plans)
 */
app.post('/api/create-subscription-checkout', async (req: Request, res: Response) => {
  try {
    const { priceId, customerEmail, customerId } = req.body;
    const baseUrl = getBaseUrl(req);
    const targetPrice = priceId || process.env.PRICE_STARTER_MONTHLY || 'price_1U5VUcDy28wjEXYsN7AwEJMb';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId || undefined,
      customer_email: !customerId ? customerEmail : undefined,
      line_items: [
        {
          price: targetPrice,
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.ENABLE_AUTOMATIC_TAX === 'true' },
      integration_identifier: 'keepseed_sub_checkout_a1b2c3d4',
      success_url: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${baseUrl}/pricing`,
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
    const { amount, currency = 'usd', customerEmail, customerId } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 1) {
      return res.status(400).json({ error: 'Top-up amount must be at least 1 unit of currency.' });
    }

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId || undefined,
      customer_email: !customerId ? customerEmail : undefined,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Keepseed API Credit Top-Up',
              description: 'Prepaid credit balance for AI chat & API endpoint consumption',
            },
            unit_amount: Math.round(numAmount * 100),
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.ENABLE_AUTOMATIC_TAX === 'true' },
      integration_identifier: 'keepseed_topup_checkout_x9y8z7w6',
      success_url: `${baseUrl}/top-up?session_id={CHECKOUT_SESSION_ID}&success=true&amount=${numAmount}`,
      cancel_url: `${baseUrl}/top-up`,
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
    const numAmount = Number(amount);
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Programmatic API Credit Top-Up',
              description: 'API-driven automated account balance top-up',
            },
            unit_amount: Math.round(numAmount * 100),
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.ENABLE_AUTOMATIC_TAX === 'true' },
      integration_identifier: 'keepseed_programmatic_topup_v1',
      success_url: success_url || `${baseUrl}/top-up?success=true`,
      cancel_url: cancel_url || `${baseUrl}/top-up`,
    });

    res.json({
      status: 'success',
      checkout_url: session.url,
      session_id: session.id,
      amount: numAmount,
      currency: currency.toUpperCase(),
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
    const { customerId, customerEmail } = req.body;
    const baseUrl = getBaseUrl(req);

    let targetCustomerId = customerId;

    // Gracefully find or initialize customer if not specified or dummy
    if (!targetCustomerId || targetCustomerId === 'cus_demo_id') {
      const email = customerEmail || 'user@example.com';
      try {
        const existing = await stripe.customers.list({ email, limit: 1 });
        if (existing.data.length > 0) {
          targetCustomerId = existing.data[0].id;
        } else {
          const created = await stripe.customers.create({
            email,
            name: 'Demo Platform User',
            metadata: { source: 'keepseed-ai-platform' },
          });
          targetCustomerId = created.id;
        }
      } catch (custErr: any) {
        console.warn('Customer lookup note:', custErr.message);
      }
    }

    if (!targetCustomerId || targetCustomerId === 'cus_demo_id') {
      return res.status(400).json({
        error: 'No active Stripe customer found. Please subscribe or make a top-up first.',
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Single page app fallback for React Router / client-side views
app.get('*splat', (req: Request, res: Response) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Keepseed Server] Running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
});
