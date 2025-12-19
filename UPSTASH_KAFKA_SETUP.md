# Upstash Kafka Setup Guide (Free, No Credit Card)

This guide will help you set up Upstash Kafka for your payment processing system - completely free and no credit card required!

## 🎯 Why Upstash Kafka?

- ✅ **100% Free** - No credit card required
- ✅ **Serverless** - No infrastructure to manage
- ✅ **Easy Setup** - Get started in 5 minutes
- ✅ **Production Ready** - Reliable and scalable

## 📋 Step-by-Step Setup

### Step 1: Sign Up for Upstash

1. Go to **https://upstash.com**
2. Click **"Sign Up"** or **"Get Started"**
3. Choose one of these sign-up methods:
   - **GitHub** (Recommended - fastest)
   - **Google**
   - **Email** (create account)

### Step 2: Create Kafka Database

1. After logging in, you'll see the dashboard
2. Click **"Create Database"** button (usually top right)
3. Select **"Kafka"** from the options
4. Fill in the details:
   - **Name**: `payment-kafka` (or any name you like)
   - **Region**: Choose closest to you (e.g., `us-east-1`, `eu-west-1`)
   - **Type**: Select **"Regional"** (free tier)
5. Click **"Create"**
6. Wait 1-2 minutes for provisioning

### Step 3: Get Your Credentials

Once created, you'll see your Kafka cluster details:

1. **Bootstrap Server** (Broker URL):
   - Looks like: `your-cluster-name-kafka.upstash.io:9092`
   - Or: `pkc-xxxxx.region.provider.upstash.io:9092`
   - **Copy this entire URL**

2. **Username**:
   - Usually shown as "Username" or "SASL Username"
   - **Copy this**

3. **Password**:
   - Usually shown as "Password" or "SASL Password"
   - **Copy this** (you can reveal it if hidden)

### Step 4: Create Topic

1. In your Kafka cluster dashboard, look for **"Topics"** tab
2. Click **"Create Topic"** or **"Add Topic"**
3. Fill in:
   - **Topic Name**: `transactions` (exactly this name)
   - **Partitions**: `1` (default is fine)
   - **Replication Factor**: `1` (default is fine)
4. Click **"Create"**

### Step 5: Verify Setup

You should now have:
- ✅ Kafka cluster created
- ✅ Topic `transactions` created
- ✅ Bootstrap Server URL
- ✅ Username
- ✅ Password

## 🔑 Your Credentials Summary

After setup, you'll have these values:

```
Bootstrap Server: pkc-xxxxx.region.provider.upstash.io:9092
Username: your-username-here
Password: your-password-here
Topic: transactions
```

## 📝 Next Steps

1. **Save these credentials** - You'll need them for:
   - Backend environment variables (Render)
   - Testing locally

2. **Add to your backend `.env` file**:
   ```env
   KAFKA_BROKER=pkc-xxxxx.region.provider.upstash.io:9092
   KAFKA_USERNAME=your-username-here
   KAFKA_PASSWORD=your-password-here
   KAFKA_TOPIC=transactions
   ```

3. **Add to Render environment variables** (when deploying)

## 🧪 Test Your Connection

You can test the connection locally:

1. Update `backend/.env` with your Upstash credentials
2. Start your backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. Look for these messages in logs:
   - ✅ "Kafka producer connected"
   - ✅ "Kafka consumer connected"

## 🆓 Free Tier Limits

Upstash Kafka free tier includes:
- **10,000 commands per day**
- **256 MB storage**
- **Regional clusters**

This is more than enough for development and small production use!

## 🐛 Troubleshooting

### Can't find Bootstrap Server?
- Look in the cluster details page
- It might be labeled as "Endpoint" or "Broker URL"
- Format: `something.upstash.io:9092`

### Connection fails?
- Check that you copied the full URL including `:9092`
- Verify username and password are correct
- Make sure the topic `transactions` exists

### Topic not found?
- Go to Topics tab
- Create topic named exactly `transactions`
- Wait a few seconds after creation

## ✅ Success Checklist

- [ ] Upstash account created
- [ ] Kafka cluster created
- [ ] Topic `transactions` created
- [ ] Bootstrap Server URL copied
- [ ] Username copied
- [ ] Password copied
- [ ] Credentials saved securely

## 🚀 Ready for Deployment!

Once you have these credentials, you're ready to:
1. Deploy backend to Render
2. Add credentials to Render environment variables
3. Start processing transactions!

---

**Need Help?** Check the main deployment guide or contact Upstash support at support@upstash.com

