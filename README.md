# Keepseed AI Platform

A modern, production-grade AI platform template featuring integrated **Stripe Billing** (Subscriptions & Dynamic Checkout Top-Ups), **API Key Management**, **Interactive AI Chat & Reasoning Modes**, **GitHub Actions CI**, and zero-downtime **Render Deployment** configuration.

---

## Features

- ⚡ **Multi-Model Interface**: Toggle between *Instant* (4o-class), *Expert* (o3-class reasoning with DeepThink), and *Vision* (multimodal analysis).
- 💳 **Stripe Billing & Top-Ups**:
  - **Subscriptions**: Starter ($19/mo) & Pro Platform ($49/mo) plans with automatic checkout session routing.
  - **Prepaid Credit Top-Ups**: Dynamic amount presets ($5 - $500) and custom input with instant tax calculation.
  - **Self-Service Customer Portal**: Invoices, receipt downloads, and payment method management.
  - **Cryptographic Webhooks**: Secure signature verification handling subscriptions, invoice payments, and credit balance top-ups.
- 🔑 **API Key Management**: Interactive secret key generation with one-time copy modal, permission scoping, revoking, and deletion.
- 📊 **Usage Analytics**: Breakdown charts of token consumption by model and rate limit tracking (RPM/TPM).
- 📚 **Developer Quickstart**: Multi-language SDK integration snippets (cURL, Python, TypeScript, Go) and interactive API tester.
- 🚀 **Production-Ready Deployment**:
  - `render.yaml` with zero-downtime healthcheck monitoring (`/api/health`).
  - GitHub Actions CI workflow for linting, typechecking, and build validation.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- Stripe Account (Test mode keys)

### 2. Installation
```bash
git clone https://github.com/adamdavidjeannot-dev/keepseed-ai-platform.git
cd keepseed-ai-platform
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and populate your Stripe credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ACCOUNT_ID=acct_...
PORT=3001
NODE_ENV=development
```

### 4. (Optional) Provision Stripe Product Catalog
If you need to automatically generate the Starter and Pro recurring products & prices in your Stripe account:
```bash
npm run setup:stripe
```

### 5. Running Locally

#### Run Backend Server:
```bash
npm run dev:server
```

#### Run Frontend Dev Server (Vite with API Proxy):
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### Health Check
```http
GET /api/health
```
Returns system uptime, environment, and Stripe configuration status.

### Public Client Configuration
```http
GET /api/config
```
Returns public publishable keys and active price IDs.

### Create Subscription Checkout Session
```http
POST /api/create-subscription-checkout
Content-Type: application/json

{
  "priceId": "price_1U5VUcDy28wjEXYsN7AwEJMb",
  "customerEmail": "user@example.com"
}
```

### Create Top-Up Checkout Session
```http
POST /api/create-topup-checkout
Content-Type: application/json

{
  "amount": 20,
  "currency": "usd",
  "customerEmail": "user@example.com"
}
```

### Programmatic API Credit Top-Up
```http
POST /api/v1/topup
Content-Type: application/json

{
  "amount": 20,
  "currency": "usd"
}
```

### Customer Portal Session
```http
POST /api/create-portal-session
Content-Type: application/json

{
  "customerId": "cus_...",
  "customerEmail": "user@example.com"
}
```

---

## Deployment on Render

This repository includes a `render.yaml` Blueprint.

1. Connect your GitHub repository to Render.
2. Create a new **Blueprint Instance** from `render.yaml`.
3. Fill in the required environment variables in the Render Dashboard:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PRICE_STARTER_MONTHLY`
   - `PRICE_PRO_MONTHLY`
4. Deploy with zero-downtime healthcheck verification at `/api/health`.

---

## Scripts

- `npm run dev`: Starts Vite frontend development server.
- `npm run dev:server`: Starts Express backend with hot-reload via `tsx`.
- `npm run build`: Typechecks, builds Vite bundle, and compiles Node backend into `dist-server/index.js`.
- `npm run start`: Runs compiled production server.
- `npm run lint`: Runs fast Oxlint checks.
- `npm run setup:stripe`: Provisions products & prices on Stripe.
