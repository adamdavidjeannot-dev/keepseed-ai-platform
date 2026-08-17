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

// In-Memory Stateful Engine
interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  model: string;
  status: number;
  latencyMs: number;
  tokens: { prompt: number; completion: number; total: number };
  cost: number;
  apiKeyPrefix: string;
  ip: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  creditBalance: number;
  currency: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  planName: string;
  planStatus: 'active' | 'past_due' | 'canceled';
  monthlyQuota: number;
  monthlyUsage: number;
  renewalDate: string;
}

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  fullKey?: string;
  created: string;
  lastUsed: string;
  permissions: 'Full Access' | 'Read Only';
  rateLimitRpm: number;
  status: 'Active' | 'Revoked';
}

const db = {
  user: {
    id: 'usr_live_8912',
    email: 'user@example.com',
    name: 'Platform Developer',
    creditBalance: 124.50,
    currency: 'USD',
    plan: 'pro' as const,
    planName: 'Pro Platform Plan',
    planStatus: 'active' as const,
    monthlyQuota: 10000000,
    monthlyUsage: 4821900,
    renewalDate: '2026-09-01T00:00:00Z',
  } as UserProfile,

  apiKeys: [
    {
      id: 'key_1',
      name: 'Production Server Backend',
      prefix: 'kp_live_9f81...4d2e',
      created: '2026-08-01',
      lastUsed: 'Just now',
      permissions: 'Full Access' as const,
      rateLimitRpm: 10000,
      status: 'Active' as const,
    },
    {
      id: 'key_2',
      name: 'Dev Agent Local',
      prefix: 'kp_test_3a12...89bc',
      created: '2026-08-10',
      lastUsed: '3 hours ago',
      permissions: 'Full Access' as const,
      rateLimitRpm: 2000,
      status: 'Active' as const,
    },
    {
      id: 'key_3',
      name: 'Analytics Read-Only',
      prefix: 'kp_live_0b77...11a9',
      created: '2026-07-20',
      lastUsed: '2 days ago',
      permissions: 'Read Only' as const,
      rateLimitRpm: 500,
      status: 'Revoked' as const,
    },
  ] as ApiKeyRecord[],

  logs: [
    {
      id: 'req_8f12a9',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      method: 'POST',
      endpoint: '/v1/chat/completions',
      model: 'keepseed-v4-pro',
      status: 200,
      latencyMs: 382,
      tokens: { prompt: 142, completion: 289, total: 431 },
      cost: 0.00172,
      apiKeyPrefix: 'kp_live_9f81',
      ip: '127.0.0.1',
    },
    {
      id: 'req_7a34bc',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      method: 'POST',
      endpoint: '/v1/chat/completions',
      model: 'keepseed-v4-instant',
      status: 200,
      latencyMs: 94,
      tokens: { prompt: 58, completion: 112, total: 170 },
      cost: 0.00017,
      apiKeyPrefix: 'kp_live_9f81',
      ip: '127.0.0.1',
    },
    {
      id: 'req_6c99ef',
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      method: 'POST',
      endpoint: '/v1/chat/completions',
      model: 'keepseed-v4-vision',
      status: 200,
      latencyMs: 610,
      tokens: { prompt: 840, completion: 195, total: 1035 },
      cost: 0.00517,
      apiKeyPrefix: 'kp_test_3a12',
      ip: '192.168.1.100',
    },
  ] as ApiLogEntry[],

  invoices: [
    {
      id: 'in_1Q89bXDy28',
      date: '2026-08-01',
      description: 'Pro Plan Monthly Subscription',
      amount: 49.00,
      currency: 'USD',
      status: 'Paid',
      pdfUrl: '#',
    },
    {
      id: 'ch_3P50aQDy28',
      date: '2026-07-28',
      description: 'Prepaid Credit Top-Up ($100.00 + tax)',
      amount: 106.00,
      currency: 'USD',
      status: 'Paid',
      pdfUrl: '#',
    },
    {
      id: 'in_1P12zLDy28',
      date: '2026-07-01',
      description: 'Pro Plan Monthly Subscription',
      amount: 49.00,
      currency: 'USD',
      status: 'Paid',
      pdfUrl: '#',
    },
  ],
};

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

  // Handle essential subscription & payment lifecycle events and update state
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout completed for Customer: ${session.customer}, Mode: ${session.mode}`);
      
      if (session.mode === 'subscription') {
        db.user.plan = 'pro';
        db.user.planName = 'Pro Platform Plan';
        db.user.planStatus = 'active';
        db.user.monthlyQuota = 10000000;
        console.log(`[Stripe Webhook] Subscription activated: ${session.subscription}`);
      } else if (session.mode === 'payment') {
        const amountTotal = (session.amount_total || 0) / 100;
        db.user.creditBalance += amountTotal;
        db.invoices.unshift({
          id: session.id || `ch_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `Prepaid Credit Top-Up ($${amountTotal.toFixed(2)})`,
          amount: amountTotal,
          currency: 'USD',
          status: 'Paid',
          pdfUrl: '#',
        });
        console.log(`[Stripe Webhook] Credited top-up balance of $${amountTotal.toFixed(2)} to customer.`);
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const amountPaid = (invoice.amount_paid || 0) / 100;
      db.invoices.unshift({
        id: invoice.id || `in_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: invoice.description || 'Subscription Recurring Invoice',
        amount: amountPaid,
        currency: 'USD',
        status: 'Paid',
        pdfUrl: invoice.hosted_invoice_url || '#',
      });
      console.log(`[Stripe Webhook] Invoice paid: ${invoice.id} for Amount: $${amountPaid.toFixed(2)}`);
      break;
    }
    case 'customer.subscription.deleted': {
      db.user.plan = 'free';
      db.user.planName = 'Free Tier';
      db.user.planStatus = 'canceled';
      db.user.monthlyQuota = 50000;
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// JSON Middleware for all standard API routes
app.use(express.json({ limit: '10mb' }));

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
    activeKeysCount: db.apiKeys.filter((k) => k.status === 'Active').length,
    userBalance: db.user.creditBalance,
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
 * User Profile & State Endpoint
 */
app.get('/api/user/profile', (_req: Request, res: Response) => {
  res.json(db.user);
});

/**
 * API Keys CRUD Endpoints
 */
app.get('/api/user/keys', (_req: Request, res: Response) => {
  res.json(db.apiKeys);
});

app.post('/api/user/keys', (req: Request, res: Response) => {
  const { name, permissions = 'Full Access', rateLimitRpm = 5000 } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const fullKey = `kp_live_${randomSuffix}${Math.random().toString(36).substring(2, 18)}`;
  const prefix = `${fullKey.substring(0, 11)}...${fullKey.substring(fullKey.length - 4)}`;

  const newKeyRecord: ApiKeyRecord = {
    id: `key_${Date.now()}`,
    name: name.trim(),
    prefix,
    fullKey,
    created: new Date().toISOString().split('T')[0],
    lastUsed: 'Never',
    permissions,
    rateLimitRpm,
    status: 'Active',
  };

  db.apiKeys.unshift(newKeyRecord);
  res.json(newKeyRecord);
});

app.patch('/api/user/keys/:id/revoke', (req: Request, res: Response) => {
  const { id } = req.params;
  const key = db.apiKeys.find((k) => k.id === id);
  if (!key) return res.status(404).json({ error: 'API Key not found' });

  key.status = 'Revoked';
  res.json(key);
});

app.delete('/api/user/keys/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = db.apiKeys.length;
  db.apiKeys = db.apiKeys.filter((k) => k.id !== id);
  if (db.apiKeys.length === initialLen) {
    return res.status(404).json({ error: 'API Key not found' });
  }
  res.json({ success: true, id });
});

/**
 * Live Request Logs Endpoint
 */
app.get('/api/logs', (_req: Request, res: Response) => {
  res.json(db.logs);
});

/**
 * Invoices Endpoint
 */
app.get('/api/invoices', (_req: Request, res: Response) => {
  res.json(db.invoices);
});

/**
 * Models List (OpenAI Protocol Compliant)
 */
app.get(['/v1/models', '/api/models'], (_req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'keepseed-v4-instant',
        object: 'model',
        created: 1723000000,
        owned_by: 'keepseed',
        permission: [],
        root: 'keepseed-v4-instant',
        description: 'Ultra-low latency model optimized for interactive chat, translation, and high throughput.',
      },
      {
        id: 'keepseed-v4-pro',
        object: 'model',
        created: 1723000000,
        owned_by: 'keepseed',
        permission: [],
        root: 'keepseed-v4-pro',
        description: 'Advanced reasoning engine with deep cognitive chain-of-thought and coding capabilities.',
      },
      {
        id: 'keepseed-v4-vision',
        object: 'model',
        created: 1723000000,
        owned_by: 'keepseed',
        permission: [],
        root: 'keepseed-v4-vision',
        description: 'High-resolution multimodal reasoning model for images, diagrams, and video analysis.',
      },
    ],
  });
});

/**
 * OpenAI Standard & Streaming Chat Completions Endpoint
 * Route: POST /v1/chat/completions and POST /api/chat/completions
 */
app.post(['/v1/chat/completions', '/api/chat/completions'], async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    model = 'keepseed-v4-instant',
    messages = [],
    stream = false,
    _temperature = 0.7,
    _tools,
    thinking,
  } = req.body;

  const lastUserMessage = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || 'Hello!';
  const promptTokens = Math.max(20, Math.round(JSON.stringify(messages).length / 4));
  const completionTokens = Math.max(35, Math.round(lastUserMessage.length * 1.8));
  const totalTokens = promptTokens + completionTokens;
  const cost = Number(((totalTokens / 1000) * 0.002).toFixed(5));

  // Deduct usage and update statistics
  db.user.monthlyUsage += totalTokens;
  db.user.creditBalance = Math.max(0, Number((db.user.creditBalance - cost).toFixed(4)));

  const logEntry: ApiLogEntry = {
    id: `req_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    method: 'POST',
    endpoint: '/v1/chat/completions',
    model,
    status: 200,
    latencyMs: Math.round(Date.now() - startTime + (model.includes('pro') ? 350 : 80)),
    tokens: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
    cost,
    apiKeyPrefix: 'kp_live_9f81',
    ip: req.ip || '127.0.0.1',
  };
  db.logs.unshift(logEntry);
  if (db.logs.length > 50) db.logs.pop();

  // Generate realistic smart contextual response
  let responseContent = '';
  if (model.includes('pro') || thinking?.type === 'enabled') {
    responseContent = `Here is the comprehensive technical analysis for your query:\n\n1. **Architecture Overview**: The Keepseed distributed cluster handles request validation with deterministic token caching and sub-100ms response times.\n2. **Implementation Strategy**: Ensure proper authentication headers using \`Bearer \${KEEPSEED_API_KEY}\` and maintain connection pools when invoking batch completions.\n3. **Validation**: All payload specifications conform to standard JSON schema validation with 99.99% availability.`;
  } else if (model.includes('vision')) {
    responseContent = `Keepseed Vision analysis complete: Visual parameters processed with high structural fidelity. Context embeddings generated across 128k context window.`;
  } else {
    responseContent = `Keepseed Instant: Request processed efficiently for: "${typeof lastUserMessage === 'string' ? lastUserMessage : 'Multimodal content'}". Infrastructure status: Optimal.`;
  }

  // Handle Real Streaming Response (Server-Sent Events)
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chunks = responseContent.split(' ');
    let index = 0;

    const interval = setInterval(() => {
      if (index < chunks.length) {
        const chunk = chunks[index] + (index < chunks.length - 1 ? ' ' : '');
        const payload = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [
            {
              index: 0,
              delta: { content: chunk },
              finish_reason: null,
            },
          ],
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        index++;
      } else {
        res.write('data: [DONE]\n\n');
        clearInterval(interval);
        res.end();
      }
    }, 25);

    return;
  }

  // Standard Non-Streaming JSON Response
  res.json({
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
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
  if (!req.path.startsWith('/api') && !req.path.startsWith('/v1')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Keepseed Engine] Running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
});
