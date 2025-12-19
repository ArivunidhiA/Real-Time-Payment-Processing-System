# API Keys and Credentials Required

This document lists all the API keys and credentials you need to provide for the production-ready Real-Time Payment Processing System.

## 🔐 Required API Keys

### 1. **Database (PostgreSQL)**
- **Required**: ✅ Yes
- **Provider Options**:
  - **Supabase** (Recommended for free tier): https://supabase.com
  - **Neon** (Serverless PostgreSQL): https://neon.tech
  - **Render PostgreSQL**: https://render.com
  - **AWS RDS**: https://aws.amazon.com/rds
- **Format**: `postgresql://username:password@host:port/database`
- **Environment Variable**: `DATABASE_URL`

### 2. **Kafka (Message Queue)**
- **Required**: ✅ Yes
- **Provider Options**:
  - **Confluent Cloud** (Free tier available): https://www.confluent.io/confluent-cloud/
  - **Upstash Kafka** (Serverless): https://upstash.com
  - **Aiven Kafka**: https://aiven.io
- **Credentials Needed**:
  - Broker URL
  - Username
  - Password
- **Environment Variables**:
  - `KAFKA_BROKER`
  - `KAFKA_USERNAME`
  - `KAFKA_PASSWORD`
  - `KAFKA_TOPIC` (default: `transactions`)

### 3. **Redis (Caching & Rate Limiting)**
- **Required**: ⚠️ Optional but Highly Recommended
- **Provider Options**:
  - **Upstash Redis** (Serverless, free tier): https://upstash.com
  - **Redis Cloud** (Free tier): https://redis.com/try-free/
  - **AWS ElastiCache**: https://aws.amazon.com/elasticache
- **Format**: `redis://username:password@host:port`
- **Environment Variable**: `REDIS_URL`
- **Note**: System will work without Redis but with reduced performance

### 4. **Payment Gateway**
Choose ONE of the following:

#### Option A: Stripe (Recommended)
- **Required**: ⚠️ Optional (can use mock for testing)
- **Provider**: https://stripe.com
- **Credentials Needed**:
  - Secret Key (starts with `sk_test_` or `sk_live_`)
  - Publishable Key (starts with `pk_test_` or `pk_live_`)
- **Environment Variables**:
  - `PAYMENT_GATEWAY=stripe`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY` (for frontend)

#### Option B: Square
- **Required**: ⚠️ Optional
- **Provider**: https://squareup.com
- **Credentials Needed**:
  - Access Token
  - Location ID
  - Application ID
- **Environment Variables**:
  - `PAYMENT_GATEWAY=square`
  - `SQUARE_ACCESS_TOKEN`
  - `SQUARE_LOCATION_ID`
  - `SQUARE_APPLICATION_ID`

#### Option C: PayPal
- **Required**: ⚠️ Optional
- **Provider**: https://developer.paypal.com
- **Credentials Needed**:
  - Client ID
  - Client Secret
- **Environment Variables**:
  - `PAYMENT_GATEWAY=paypal`
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_ENVIRONMENT` (sandbox or production)

#### Option D: Mock (Testing Only)
- **Required**: ❌ No
- **Use**: `PAYMENT_GATEWAY=mock`
- **Note**: For development/testing only, not for production

### 5. **Error Monitoring (Sentry)**
- **Required**: ⚠️ Optional but Recommended
- **Provider**: https://sentry.io (Free tier available)
- **Credentials Needed**:
  - DSN (Data Source Name)
- **Environment Variable**: `SENTRY_DSN`
- **Note**: Helps track errors in production

### 6. **JWT Secret Key**
- **Required**: ✅ Yes (for authentication)
- **Generate**: Run `openssl rand -base64 32` or use any secure random string generator
- **Minimum Length**: 32 characters
- **Environment Variable**: `JWT_SECRET`
- **⚠️ IMPORTANT**: Change the default value in production!

## 📋 Quick Setup Checklist

### Minimum Required (System will run):
- [ ] PostgreSQL Database URL
- [ ] Kafka Broker URL and credentials
- [ ] JWT Secret Key

### Recommended (For Production):
- [ ] Redis URL (for caching)
- [ ] Payment Gateway credentials (Stripe/Square/PayPal)
- [ ] Sentry DSN (for error tracking)

## 🔧 How to Get API Keys

### 1. PostgreSQL (Supabase - Free)
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project
4. Go to Settings → Database
5. Copy the connection string
6. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 2. Kafka (Confluent Cloud - Free Tier)
1. Go to https://www.confluent.io/confluent-cloud/
2. Sign up for free account
3. Create a cluster
4. Create a topic named `transactions`
5. Go to API Keys section
6. Create new API key
7. Copy broker URL, username, and password

### 3. Redis (Upstash - Free Tier)
1. Go to https://upstash.com
2. Sign up for free account
3. Create a Redis database
4. Copy the REST URL or Redis URL
5. Format: `redis://default:[PASSWORD]@[HOST]:[PORT]`

### 4. Stripe (Free to Start)
1. Go to https://stripe.com
2. Sign up for account
3. Go to Developers → API Keys
4. Copy Test keys (for development)
5. Copy Live keys (for production)

### 5. Sentry (Free Tier)
1. Go to https://sentry.io
2. Sign up for free account
3. Create a new project (Node.js)
4. Copy the DSN

## 🚀 Setting Environment Variables

### For Local Development:
1. Copy `backend/env.example` to `backend/.env`
2. Fill in all required values
3. Copy `frontend/env.example` to `frontend/.env.local`
4. Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`

### For Netlify Deployment:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all required environment variables
3. Make sure to set:
   - `NEXT_PUBLIC_BACKEND_URL` (your Netlify site URL)
   - All backend environment variables

### For Other Platforms:
- **Render**: Add in Environment tab
- **Heroku**: Use `heroku config:set KEY=value`
- **Vercel**: Add in Environment Variables section

## ⚠️ Security Notes

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate secrets** regularly
4. **Use strong passwords** for all services
5. **Enable 2FA** on all service accounts
6. **Review access logs** regularly

## 📞 Support

If you need help obtaining any API keys or have questions about setup, please refer to:
- Database setup: Check `backend/db/schema.sql` for schema
- Kafka setup: Check `backend/kafka/` for configuration
- Payment gateway: Check `backend/services/paymentGateway.js` for integration details

---

**Once you have all the API keys, update the `.env` files and the system will be ready for production!**

