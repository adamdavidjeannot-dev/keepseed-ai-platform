import Stripe from 'stripe';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY || 'rkcs_test_51U5BHnDy28wjEXYs99FuscdW7fyTtpzaMBHQnEJxHUjaCeUB07Rszckk7QXJMCdhaNHAtv7InQ6VWn77dhuk8E00Re3j5CjO';

const stripe = new Stripe(secretKey, {
  apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
});

async function main() {
  console.log('Provisioning Stripe Products & Prices for keepseed.io...');

  // 1. Create Starter Plan Product
  const starterProduct = await stripe.products.create({
    name: 'Starter Plan',
    description: 'Entry tier for AI chat interface access and standard query rates.',
  });
  console.log(`Created Product: ${starterProduct.name} (${starterProduct.id})`);

  // Create Starter Monthly Price ($19/mo)
  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 1900, // $19.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });
  console.log(`Created Price: $19/mo (${starterPrice.id})`);

  // 2. Create Pro Plan Product
  const proProduct = await stripe.products.create({
    name: 'Pro Plan',
    description: 'High-throughput tier for advanced AI chat, fast inference & API access.',
  });
  console.log(`Created Product: ${proProduct.name} (${proProduct.id})`);

  // Create Pro Monthly Price ($49/mo)
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });
  console.log(`Created Price: $49/mo (${proPrice.id})`);

  // Update .env configuration
  const envContent = `STRIPE_SECRET_KEY=${secretKey}
STRIPE_PUBLISHABLE_KEY=pk_test_51U5BHnDy28wjEXYsRv267DsmURyzjbfqGI3Auu1clY5QgbLHRLg8zQoALdB1mT8YR3bnDgtfKzwaldQ8yMOUlhyl00TzSLiHQW
STRIPE_ACCOUNT_ID=acct_1U5BHnDy28wjEXYs
PRICE_STARTER_MONTHLY=${starterPrice.id}
PRICE_PRO_MONTHLY=${proPrice.id}
PORT=3001
`;

  fs.writeFileSync('.env', envContent);
  console.log('Successfully saved Stripe credentials & provisioned Price IDs to .env!');
}

main().catch((err) => {
  console.error('Error provisioning Stripe catalog:', err);
  process.exit(1);
});
