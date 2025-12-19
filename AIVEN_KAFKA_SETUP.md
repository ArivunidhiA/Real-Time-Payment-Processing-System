# Aiven Kafka Setup Guide

This guide will help you set up Aiven Kafka (free trial) for your Real-Time Payment Processing System.

## 🎯 Why Aiven Kafka?

- ✅ **Free trial** - No credit card required
- ✅ **Fully managed** - No need to deploy/manage Kafka yourself
- ✅ **Production-ready** - Reliable and scalable
- ✅ **SSL security** - Built-in encryption
- ✅ **Easy setup** - Simple connection process

## 📋 Prerequisites

- Aiven account (sign up at https://aiven.io)
- Basic understanding of Kafka concepts

## 🚀 Step-by-Step Setup

### Step 1: Create Aiven Account (2 minutes)

1. Go to https://aiven.io
2. Click "Start Free Trial" or "Sign Up"
3. Sign up with email or GitHub
4. Verify your email
5. You'll be taken to the Aiven Console

---

### Step 2: Create Kafka Service (5 minutes)

1. In Aiven Console, click **"+ New service"**
2. Select **"Apache Kafka"**
3. Configure:
   - **Service name**: `kafka-payments` (or any name you like)
   - **Cloud provider**: Choose closest region
   - **Plan**: **Startup-1** (free tier)
   - **Kafka version**: Latest (default)
4. Click **"Create service"**
5. Wait 2-3 minutes for service to be created

---

### Step 3: Get Connection Details (5 minutes)

1. Click on your Kafka service in the dashboard
2. Click **"Quick connect →"** (or go to Overview tab)
3. In the modal:
   - **Language**: Any (just for examples)
   - **Authentication**: Select **"Client certificate"**
4. Download the 3 certificate files:
   - **"Download CA certificate"** → Save as `ca.pem`
   - **"Download access certificate"** → Save as `service.cert`
   - **"Download access key"** → Save as `service.key`
5. Note the **Bootstrap Server** from the code example:
   - Format: `kafka-xxxxx-xxxxx.c.aivencloud.com:12345`
6. Close the modal

---

### Step 4: Create Transactions Topic (2 minutes)

1. In your Kafka service, click **"Topics"** in the left sidebar
2. Click **"Create topic"** or **"+ Add topic"**
3. Configure:
   - **Topic name**: `transactions`
   - **Partitions**: `1` (default)
   - **Replication factor**: `1` (default)
   - Leave other settings as default
4. Click **"Create topic"**
5. Wait a few seconds for topic to be created

---

### Step 5: Get Certificate Contents (3 minutes)

1. Open each certificate file in a text editor:
   - `ca.pem`
   - `service.cert`
   - `service.key`
2. Copy the **entire contents** of each file (including `-----BEGIN` and `-----END` lines)
3. Keep them ready to paste into Render environment variables

**Example format:**
```
-----BEGIN CERTIFICATE-----
MIIE... (long encoded string)
...
-----END CERTIFICATE-----
```

---

### Step 6: Configure Backend Environment Variables

When deploying your backend to Render, add these environment variables:

```env
# Aiven Kafka Configuration
KAFKA_BROKER=kafka-xxxxx-xxxxx.c.aivencloud.com:12345
KAFKA_TOPIC=transactions
KAFKA_USE_SSL=true

# SSL Certificates (paste FULL contents including BEGIN/END lines)
KAFKA_CA_CERT=-----BEGIN CERTIFICATE-----\nMIIE...\n-----END CERTIFICATE-----
KAFKA_CLIENT_CERT=-----BEGIN CERTIFICATE-----\nMIIE...\n-----END CERTIFICATE-----
KAFKA_CLIENT_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----
```

**Important Notes:**
- Replace `kafka-xxxxx-xxxxx.c.aivencloud.com:12345` with your actual Bootstrap Server
- Paste the **entire certificate content** (including BEGIN/END lines)
- For multi-line certificates in Render, paste them as-is (Render handles newlines)

---

## ✅ Verification Checklist

- [ ] Aiven account created
- [ ] Kafka service created and running
- [ ] Bootstrap Server URL noted
- [ ] 3 certificate files downloaded
- [ ] `transactions` topic created
- [ ] Certificate contents copied
- [ ] Backend environment variables configured

---

## 🔧 Backend Configuration

Your backend code has been updated to support Aiven's SSL certificates. The code automatically detects `KAFKA_USE_SSL=true` and uses the certificates for authentication.

**Files updated:**
- `backend/kafka/producer.js` - Supports SSL certificates
- `backend/kafka/consumer.js` - Supports SSL certificates

---

## 🧪 Testing Connection

After deploying your backend:

1. Check backend logs for:
   - `Kafka producer connected`
   - `Kafka consumer connected and subscribed`
2. If you see connection errors, verify:
   - Bootstrap Server URL is correct
   - All 3 certificates are pasted correctly
   - `KAFKA_USE_SSL=true` is set
   - Topic `transactions` exists in Aiven

---

## 🆘 Troubleshooting

### Connection Failed
- Verify Bootstrap Server URL is correct
- Check all 3 certificates are pasted completely
- Ensure `KAFKA_USE_SSL=true` is set
- Check Aiven service is running

### Certificate Errors
- Make sure certificates include BEGIN/END lines
- Verify no extra spaces or characters
- Check certificate files are not corrupted

### Topic Not Found
- Verify topic `transactions` exists in Aiven
- Check topic name matches `KAFKA_TOPIC` environment variable

---

## 📝 Your Aiven Kafka Details

After setup, you'll have:

- **Bootstrap Server**: `kafka-xxxxx-xxxxx.c.aivencloud.com:12345`
- **Topic**: `transactions`
- **Authentication**: SSL with certificates
- **Service Status**: Running

---

## 🎉 Next Steps

1. ✅ Aiven Kafka is set up
2. ✅ Backend code supports SSL certificates
3. ✅ Create `transactions` topic
4. ✅ Deploy backend to Render with environment variables
5. ✅ Test the connection

Your Kafka setup is complete! 🚀

