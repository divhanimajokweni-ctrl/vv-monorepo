# Recommendations: Centralized Billing Integration

## Billing System Architecture

Ubuntu Pools requires a robust, scalable billing system supporting multiple payment methods, subscription management, and financial reporting for 1M+ users.

## Payment Processor Selection

### Primary Recommendation: Stripe
**Justification**:
- **Global Reach**: Supports 135+ currencies and 50+ countries
- **Security**: PCI DSS Level 1 compliance, SCA support
- **Developer Experience**: Comprehensive API and documentation
- **Advanced Features**: Subscriptions, invoices, tax calculation
- **Reliability**: 99.9% uptime with enterprise support

**Cost Structure**:
- **Transaction Fees**: 2.9% + $0.30 per domestic transaction
- **International**: 3.4% + $0.30 per cross-border transaction
- **Subscription Fees**: No additional fees for recurring billing
- **Platform Fees**: Custom pricing for volume

### Integration Architecture
```typescript
// Stripe integration setup
const stripeConfig = {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'Ubuntu Pools',
    version: '1.0.0',
    url: 'https://ubuntu-pools.com'
  }
};

// Subscription management
const subscriptionManager = {
  createSubscription: async (userId: string, priceId: string) => {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId }
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    return subscription;
  },

  handleWebhook: async (event: Stripe.Event) => {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await updateUserSubscription(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await cancelUserSubscription(event.data.object);
        break;
    }
  }
};
```

## Subscription Tier Structure

### Freemium Model
```typescript
const subscriptionTiers = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      gamesPerMonth: 5,
      tournamentsPerMonth: 1,
      sessionsPerDay: 3,
      storageGB: 1
    },
    features: [
      'Basic game access',
      'Progress tracking',
      'Community forums'
    ]
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    stripePriceId: 'price_premium_monthly',
    limits: {
      gamesPerMonth: -1, // unlimited
      tournamentsPerMonth: 10,
      sessionsPerDay: -1,
      storageGB: 10
    },
    features: [
      'Unlimited games',
      'Tournament access',
      'AI insights',
      'Priority support',
      'Advanced analytics'
    ]
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    stripePriceId: 'price_pro_monthly',
    limits: {
      gamesPerMonth: -1,
      tournamentsPerMonth: -1,
      sessionsPerDay: -1,
      storageGB: 100,
      familyMembers: 5
    },
    features: [
      'All Premium features',
      'Family accounts',
      'Custom tournaments',
      'API access',
      'White-label options'
    ]
  }
};
```

## Billing Database Schema

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'incomplete',
  tier VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL DEFAULT 'month',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  invoice_pdf_url VARCHAR(500),
  hosted_invoice_url VARCHAR(500),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Payment Methods Table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- card, bank_account, etc.
  last4 VARCHAR(4),
  brand VARCHAR(50), -- visa, mastercard, etc.
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Billing API Endpoints

### Subscription Management
```typescript
// POST /api/billing/subscriptions
export async function createSubscription(req: Request, res: Response) {
  const { tier, paymentMethodId } = req.body;
  const userId = req.user.id;

  try {
    // Validate tier exists
    const tierConfig = subscriptionTiers[tier];
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Create or retrieve Stripe customer
    let customer = await stripe.customers.list({ email: req.user.email });
    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId }
      });
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: tierConfig.stripePriceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });

    // Save to database
    await db.subscriptions.create({
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customer.id,
      tier,
      amount: tierConfig.price,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });

  } catch (error) {
    console.error('Subscription creation failed:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

// PUT /api/billing/subscriptions/:subscriptionId
export async function updateSubscription(req: Request, res: Response) {
  const { subscriptionId } = req.params;
  const { tier } = req.body;
  const userId = req.user.id;

  try {
    // Verify ownership
    const subscription = await db.subscriptions.findFirst({
      where: { id: subscriptionId, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          id: subscription.stripeSubscriptionItemId,
          price: subscriptionTiers[tier].stripePriceId
        }],
        proration_behavior: 'create_prorations'
      }
    );

    // Update database
    await db.subscriptions.update({
      where: { id: subscriptionId },
      data: {
        tier,
        amount: subscriptionTiers[tier].price,
        updatedAt: new Date()
      }
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Subscription update failed:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
}

// DELETE /api/billing/subscriptions/:subscriptionId
export async function cancelSubscription(req: Request, res: Response) {
  const { subscriptionId } = req.params;
  const userId = req.user.id;

  try {
    const subscription = await db.subscriptions.findFirst({
      where: { id: subscriptionId, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update database
    await db.subscriptions.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
```

### Billing Analytics
```typescript
// GET /api/billing/analytics
export async function getBillingAnalytics(req: Request, res: Response) {
  const userId = req.user.id;
  const { period = 'current_month' } = req.query;

  try {
    const analytics = await calculateBillingAnalytics(userId, period);
    
    res.json({
      period,
      subscription: analytics.subscription,
      usage: analytics.usage,
      costs: analytics.costs,
      nextBilling: analytics.nextBilling
    });

  } catch (error) {
    console.error('Analytics retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve billing analytics' });
  }
}
```

## Webhook Handling

### Stripe Webhook Implementation
```typescript
// POST /api/billing/webhooks
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handling failed:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
}
```

## Tax & Compliance

### Tax Calculation
- **Stripe Tax**: Automatic tax calculation and collection
- **Regional Compliance**: Support for VAT, GST, and sales tax
- **Tax Reporting**: Automated tax filing and reporting

### Financial Reporting
- **Revenue Analytics**: Monthly recurring revenue (MRR) tracking
- **Churn Analysis**: Subscription cancellation and retention metrics
- **Customer Lifetime Value**: CLV calculation and optimization
- **Payment Failure Recovery**: Automated dunning management

## Cost Optimization

### Billing Costs
- **Volume Discounts**: Negotiated rates for high transaction volumes
- **Failed Payment Fees**: Minimize with improved payment methods
- **International Fees**: Optimize currency conversion and processing

### Operational Efficiency
- **Automated Billing**: Reduce manual intervention and errors
- **Self-Service Portal**: Customer-managed subscription changes
- **Proactive Communication**: Payment reminder and renewal notifications

This centralized billing integration provides a scalable, secure, and user-friendly monetization system supporting Ubuntu Pools' growth to 1M+ users while ensuring financial compliance and operational efficiency.</content>
<parameter name="filePath">ubuntu-pools-research-breakdown/recommendations/centralized-billing.md