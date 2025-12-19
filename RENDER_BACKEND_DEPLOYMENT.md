# Render Backend Deployment Guide

This guide will help you deploy your backend to Render (free tier, no credit card required).

## 🎯 Prerequisites

Before starting, make sure you have:
- ✅ GitHub account
- ✅ Code pushed to GitHub repository
- ✅ Upstash Kafka credentials (see `UPSTASH_KAFKA_SETUP.md`)
- ✅ Render account (we'll create this)

## 📋 Step-by-Step Deployment

### Step 1: Sign Up for Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended - easiest)
4. Authorize Render to access your GitHub repositories

### Step 2: Create PostgreSQL Database

1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Fill in the details:
   - **Name**: `payment-db` (or any name)
   - **Database**: `real_time_payments`
   - **User**: `postgres` (default)
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: `15` (or latest)
   - **Plan**: **Free** (select this)
4. Click **"Create Database"**
5. Wait 2-3 minutes for provisioning

### Step 3: Get Database Connection String

1. Once created, click on your database
2. Find **"Connections"** section
3. Copy the **"Internal Database URL"** or **"External Database URL"**
   - Format: `postgresql://user:password@host:port/database`
   - **Save this** - you'll need it!

### Step 4: Run Database Schema

1. Go to your database in Render dashboard
2. Click **"Connect"** tab
3. Use **"psql"** or **"pgAdmin"** connection
4. Or use the SQL Editor in Render
5. Copy the contents of `backend/db/schema.sql`
6. Run it in the SQL editor to create tables

**Alternative**: The schema will be created automatically on first connection if you set it up in your code.

### Step 5: Deploy Backend Web Service

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your repository:
   - If not connected, click **"Connect account"** and authorize
   - Select your repository
   - Click **"Connect"**

4. Configure the service:
   - **Name**: `payment-backend` (or any name)
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend` (important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (select this)

5. Click **"Create Web Service"**

### Step 6: Configure Environment Variables

1. In your Web Service dashboard, go to **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Add each of these variables:

```env
# Database
DATABASE_URL=<paste your PostgreSQL connection string from Step 3>

# Kafka (from Upstash)
KAFKA_BROKER=<your Upstash bootstrap server>
KAFKA_USERNAME=<your Upstash username>
KAFKA_PASSWORD=<your Upstash password>
KAFKA_TOPIC=transactions

# Server
PORT=10000
NODE_ENV=production

# Security
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=24h

# CORS (your Netlify frontend URL - update after deploying frontend)
ALLOWED_ORIGINS=https://your-site.netlify.app

# Optional - Payment Gateway
PAYMENT_GATEWAY=mock

# Optional - Redis (if you set it up)
REDIS_URL=

# Optional - Sentry (if you set it up)
SENTRY_DSN=
```

4. Click **"Save Changes"**

### Step 7: Deploy

1. Render will automatically start building
2. Watch the build logs
3. Wait for deployment to complete (2-5 minutes)
4. Once deployed, you'll get a URL like: `https://payment-backend.onrender.com`

### Step 8: Verify Deployment

1. Check the logs in Render dashboard
2. Look for:
   - ✅ "Server running on port 10000"
   - ✅ "Kafka producer connected"
   - ✅ "Kafka consumer connected"
   - ✅ "Connected to PostgreSQL database"

3. Test the health endpoint:
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"success":true,"status":"ok"}`

## 🔧 Important Configuration Notes

### Root Directory
Make sure **Root Directory** is set to `backend` in Render settings!

### Port
Render uses port `10000` by default. Your code should use `process.env.PORT` which Render sets automatically.

### Build Command
If you have any build steps, add them:
```bash
npm install
```

### Start Command
```bash
npm start
```

## 🆓 Free Tier Limits

Render free tier includes:
- **750 hours/month** (enough for 24/7 operation)
- **512 MB RAM**
- **Spins down after 15 minutes of inactivity** (wakes up on first request)

**Note**: First request after spin-down may take 30-60 seconds.

## 🔄 Updating Your Deployment

1. Push changes to your GitHub repository
2. Render will automatically detect and redeploy
3. Or manually trigger from Render dashboard

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Render
- Verify `package.json` has correct scripts
- Ensure all dependencies are listed

### Database Connection Fails
- Check `DATABASE_URL` is correct
- Verify database is running
- Check if you need to whitelist Render IPs (usually not needed)

### Kafka Connection Fails
- Verify Upstash credentials are correct
- Check Kafka cluster is active
- Ensure topic `transactions` exists

### Service Keeps Crashing
- Check logs for errors
- Verify all environment variables are set
- Check if port is set correctly

## 📝 Environment Variables Checklist

Before deploying, make sure you have:
- [ ] `DATABASE_URL` (from Render PostgreSQL)
- [ ] `KAFKA_BROKER` (from Upstash)
- [ ] `KAFKA_USERNAME` (from Upstash)
- [ ] `KAFKA_PASSWORD` (from Upstash)
- [ ] `KAFKA_TOPIC=transactions`
- [ ] `PORT=10000`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (generated)
- [ ] `ALLOWED_ORIGINS` (your Netlify URL - update after frontend deploy)

## ✅ Success Checklist

- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Database schema run
- [ ] Web Service created
- [ ] Environment variables configured
- [ ] Service deployed successfully
- [ ] Health check endpoint works
- [ ] Backend URL saved (for frontend configuration)

## 🚀 Next Steps

After backend is deployed:
1. **Note your backend URL**: `https://your-backend.onrender.com`
2. **Deploy frontend to Netlify** (see `NETLIFY_DEPLOYMENT.md`)
3. **Update `ALLOWED_ORIGINS`** in Render with your Netlify URL
4. **Update `NEXT_PUBLIC_BACKEND_URL`** in Netlify with your Render URL

---

**Your backend is now live!** 🎉

