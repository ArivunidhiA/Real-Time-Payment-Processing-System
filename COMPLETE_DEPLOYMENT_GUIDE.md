# Complete Deployment Guide - Render + Netlify (Never Stops!)

This is your **complete step-by-step guide** to deploy everything to production with services that never spin down.

## 🎯 What We're Deploying

- **Frontend**: Netlify (Next.js)
- **Backend**: Render (Node.js)
- **Database**: Render PostgreSQL
- **Kafka**: Render (Docker)
- **Keep-Alive**: Multiple methods to prevent spin-down

## ⏱️ Time Required: 45-60 minutes

---

## 📋 Pre-Deployment Checklist

Before starting:
- [ ] Code pushed to GitHub
- [ ] GitHub account ready
- [ ] Email for account signups

---

## Step 1: Set Up Render PostgreSQL (5 minutes)

### 1.1 Create Account
1. Go to https://render.com
2. Sign up with **GitHub** (easiest)
3. Authorize Render access

### 1.2 Create Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `payment-db`
   - **Database**: `real_time_payments`
   - **User**: `postgres` (default)
   - **Region**: Choose closest
   - **Plan**: **Free**
3. Click **"Create Database"**
4. Wait 2-3 minutes

### 1.3 Get Connection String
1. Click on your database
2. Find **"Connections"** section
3. Copy **"Internal Database URL"**
   - Format: `postgresql://user:password@host:port/database`
4. **Save this!** You'll need it.

### 1.4 Run Schema
1. In Render, go to your database
2. Click **"Connect"** tab
3. Use **"psql"** or **SQL Editor**
4. Copy contents of `backend/db/schema.sql`
5. Run it in the SQL editor

**✅ You now have:**
```
DATABASE_URL=postgresql://...
```

---

## Step 2: Deploy Kafka on Render (15 minutes)

### 2.1 Deploy Zookeeper
1. Render Dashboard → **"New +"** → **"Web Service"**
2. Select **"Docker"**
3. Configure:
   - **Name**: `kafka-zookeeper`
   - **Repository**: Your GitHub repo
   - **Docker Image**: `confluentinc/cp-zookeeper:7.4.0`
   - **Environment Variables**:
     ```
     ZOOKEEPER_CLIENT_PORT=2181
     ZOOKEEPER_TICK_TIME=2000
     ```
   - **Plan**: **Free**
4. Click **"Create Web Service"**
5. **Note the URL**: `kafka-zookeeper.onrender.com`

### 2.2 Deploy Kafka Broker
1. Render Dashboard → **"New +"** → **"Web Service"**
2. Select **"Docker"**
3. Configure:
   - **Name**: `kafka-broker`
   - **Repository**: Your GitHub repo
   - **Docker Image**: `confluentinc/cp-kafka:7.4.0`
   - **Environment Variables**:
     ```
     KAFKA_BROKER_ID=1
     KAFKA_ZOOKEEPER_CONNECT=kafka-zookeeper.onrender.com:2181
     KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
     KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka-broker:29092,PLAINTEXT_HOST://kafka-broker.onrender.com:9092
     KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
     KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1
     KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1
     KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0
     KAFKA_AUTO_CREATE_TOPICS_ENABLE=true
     ```
   - **Plan**: **Free**
4. Click **"Create Web Service"**
5. **Note the URL**: `kafka-broker.onrender.com:9092`

**✅ You now have:**
```
KAFKA_BROKER=kafka-broker.onrender.com:9092
```

**Note**: Topic `transactions` will be auto-created when first used (enabled with `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`)

---

## Step 3: Deploy Backend to Render (10 minutes)

### 3.1 Create Web Service
1. Render Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `payment-backend`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT!**
   - **Branch**: `main` (or your default)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### 3.2 Set Environment Variables
Go to **Environment** tab and add:

```env
# Database
DATABASE_URL=<from Step 1.3>

# Kafka
KAFKA_BROKER=kafka-broker.onrender.com:9092
KAFKA_TOPIC=transactions
KAFKA_USERNAME=
KAFKA_PASSWORD=

# Server
PORT=10000
NODE_ENV=production

# Security
JWT_SECRET=<run: openssl rand -base64 32>
JWT_EXPIRES_IN=24h

# CORS (update after frontend deploy)
ALLOWED_ORIGINS=https://your-site.netlify.app

# Keep-Alive (CRITICAL - prevents spin-down!)
ENABLE_KEEP_ALIVE=true
SERVICE_URL=https://payment-backend.onrender.com
KEEP_ALIVE_INTERVAL=5

# Payment Gateway
PAYMENT_GATEWAY=mock

# Optional
REDIS_URL=
SENTRY_DSN=
```

### 3.3 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. **Note your backend URL**: `https://payment-backend.onrender.com`

### 3.4 Verify
1. Test: `https://payment-backend.onrender.com/api/health`
2. Should return: `{"success":true,"status":"ok"}`

**✅ You now have:**
```
Backend URL: https://payment-backend.onrender.com
```

---

## Step 4: Set Up Keep-Alive (CRITICAL - 5 minutes)

### 4.1 UptimeRobot Setup (Recommended)
1. Go to https://uptimerobot.com
2. Sign up (free)
3. Click **"+ Add New Monitor"**
4. Configure:
   - **Type**: HTTP(s)
   - **Name**: `Payment Backend Keep-Alive`
   - **URL**: `https://payment-backend.onrender.com/api/keep-alive`
   - **Interval**: 5 minutes
   - **Alert Contacts**: Add your email
5. Click **"Create Monitor"**

### 4.2 Verify Keep-Alive
1. Wait 5 minutes
2. Check UptimeRobot dashboard - should show "Up"
3. Test backend - should respond quickly (no cold start)

**✅ Keep-alive is now active!**

**Detailed guide**: See `RENDER_KEEP_ALIVE_SETUP.md`

---

## Step 5: Deploy Frontend to Netlify (10 minutes)

### 5.1 Create Account
1. Go to https://netlify.com
2. Sign up with **GitHub**
3. Authorize Netlify access

### 5.2 Deploy Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Select your GitHub repository
3. Configure:
   - **Base directory**: `frontend` ⚠️ **IMPORTANT!**
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`

### 5.3 Set Environment Variable
1. Go to **Site Settings** → **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://payment-backend.onrender.com
   ```
   ⚠️ Replace with your actual Render backend URL!

### 5.4 Deploy
1. Click **"Deploy site"**
2. Wait for build (2-5 minutes)
3. **Note your frontend URL**: `https://your-site.netlify.app`

**✅ You now have:**
```
Frontend URL: https://your-site.netlify.app
```

---

## Step 6: Final Configuration (5 minutes)

### 6.1 Update Backend CORS
1. Go back to Render → Your Backend Service
2. **Environment** tab
3. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-site.netlify.app
   ```
4. Save (auto-redeploys)

### 6.2 Add Frontend to UptimeRobot (Optional)
1. UptimeRobot → **"+ Add New Monitor"**
2. **URL**: `https://your-site.netlify.app`
3. **Interval**: 5 minutes

---

## ✅ Final Verification

### Test Everything:
- [ ] Frontend loads: `https://your-site.netlify.app`
- [ ] Backend health: `https://payment-backend.onrender.com/api/health`
- [ ] Backend keep-alive: `https://payment-backend.onrender.com/api/keep-alive`
- [ ] Frontend can fetch data from backend
- [ ] Transactions can be generated
- [ ] Real-time updates work
- [ ] UptimeRobot shows "Up" status

### Wait 20 Minutes, Then Test:
- [ ] Backend still responds quickly (no cold start)
- [ ] Services are still active
- [ ] No errors in logs

---

## 🎉 Success!

Your system is now:
- ✅ **Deployed to production**
- ✅ **Never spins down** (keep-alive active)
- ✅ **Fully functional**
- ✅ **Free tier compatible**

---

## 📝 Your Live URLs

```
Frontend: https://your-site.netlify.app
Backend:  https://payment-backend.onrender.com
Kafka:    kafka-broker.onrender.com:9092
Database: (internal to Render)
```

---

## 🆘 Troubleshooting

### Services Spinning Down
- Check UptimeRobot is pinging
- Verify keep-alive endpoint works
- Check Render environment variables

### Connection Issues
- Verify all URLs are correct
- Check CORS settings
- Review Render logs

### Kafka Connection Fails
- Check Kafka service is running
- Verify broker URL is correct
- Check environment variables

---

## 📚 Reference Guides

- **Kafka Setup**: `RENDER_KAFKA_DEPLOYMENT.md`
- **Keep-Alive Setup**: `RENDER_KEEP_ALIVE_SETUP.md`
- **Netlify Deployment**: `NETLIFY_DEPLOYMENT.md`
- **Complete Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

**Your production system is ready! 🚀**

