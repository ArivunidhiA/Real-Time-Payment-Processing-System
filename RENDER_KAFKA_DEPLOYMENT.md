# Deploy Kafka on Render with Docker (Never Stops!)

This guide will help you deploy Kafka as a Docker service on Render and ensure it never spins down.

## 🎯 Why This Setup?

- ✅ **Kafka runs on Render** - No external service needed
- ✅ **Never spins down** - Multiple keep-alive mechanisms
- ✅ **Free tier compatible** - Works with Render free tier
- ✅ **Production ready** - Reliable and scalable

## 📋 Prerequisites

- Render account (free tier is fine)
- GitHub repository with your code
- Basic understanding of Docker

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Kafka Docker Setup

The project includes:
- `render-kafka/Dockerfile` - Kafka Docker image
- `render-kafka/docker-compose.render.yml` - Docker Compose config

### Step 2: Deploy Zookeeper Service

1. Go to **Render Dashboard** → **New +** → **Web Service**
2. Select **"Docker"** option
3. Configure:
   - **Name**: `kafka-zookeeper`
   - **Repository**: Your GitHub repo
   - **Dockerfile Path**: `render-kafka/Dockerfile` (or use image directly)
   - **Docker Image**: `confluentinc/cp-zookeeper:7.4.0`
   - **Docker Command**: (leave default or use custom)
   - **Environment Variables**:
     ```
     ZOOKEEPER_CLIENT_PORT=2181
     ZOOKEEPER_TICK_TIME=2000
     ```
   - **Plan**: **Free**
4. Click **"Create Web Service"**
5. **Note the internal URL** (e.g., `kafka-zookeeper.onrender.com`)

### Step 3: Deploy Kafka Service

1. Go to **Render Dashboard** → **New +** → **Web Service**
2. Select **"Docker"** option
3. Configure:
   - **Name**: `kafka-broker`
   - **Repository**: Your GitHub repo
   - **Docker Image**: `confluentinc/cp-kafka:7.4.0`
   - **Docker Command**: (custom - see below)
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

### Step 4: Create Transactions Topic

After Kafka is running, create the topic:

1. SSH into your Kafka service (or use Render shell)
2. Run:
   ```bash
   kafka-topics.sh --create \
     --bootstrap-server localhost:9092 \
     --replication-factor 1 \
     --partitions 1 \
     --topic transactions
   ```

**OR** use the auto-create feature (already enabled with `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`)

### Step 5: Update Backend Configuration

In your **backend Web Service** on Render, update environment variables:

```env
KAFKA_BROKER=kafka-broker.onrender.com:9092
KAFKA_TOPIC=transactions
KAFKA_USERNAME=
KAFKA_PASSWORD=
```

## 🔄 Keep Services Alive (CRITICAL!)

Render free tier spins down after **15 minutes of inactivity**. Here's how to prevent it:

### Method 1: External Uptime Monitoring (Recommended)

Use a free uptime monitoring service to ping your services:

#### Option A: UptimeRobot (Free - 50 monitors)
1. Sign up at https://uptimerobot.com (free)
2. Add monitor for your backend:
   - **URL**: `https://your-backend.onrender.com/api/keep-alive`
   - **Interval**: 5 minutes
   - **Type**: HTTP(s)
3. Add monitor for Kafka health (if you add a health endpoint)

#### Option B: Cron-Job.org (Free)
1. Sign up at https://cron-job.org (free)
2. Create cron job:
   - **URL**: `https://your-backend.onrender.com/api/keep-alive`
   - **Schedule**: Every 5 minutes
   - **Method**: GET

#### Option C: Pingdom (Free tier)
1. Sign up at https://www.pingdom.com
2. Create uptime check for your backend URL

### Method 2: Self-Ping (Backend pings itself)

The backend includes a keep-alive mechanism. To enable it:

1. Add to backend environment variables:
   ```env
   ENABLE_KEEP_ALIVE=true
   SERVICE_URL=https://your-backend.onrender.com
   KEEP_ALIVE_INTERVAL=5
   ```

2. The backend will ping itself every 5 minutes

### Method 3: Multiple Instances (Paid)

If you upgrade to paid plan:
- Scale to 2+ instances
- Render keeps at least one instance running

## 🛡️ Additional Keep-Alive Strategies

### 1. Health Check Endpoint

Your backend already has:
- `/api/health` - Health check
- `/api/keep-alive` - Lightweight keep-alive endpoint

### 2. Continuous Activity

- Keep Kafka producer running (sends transactions regularly)
- Keep WebSocket connections active
- Regular API calls from frontend

### 3. Render Health Checks

Configure in Render:
- **Health Check Path**: `/api/health`
- **Health Check Interval**: 60 seconds

## 📝 Environment Variables Summary

### Backend Service
```env
# Kafka (from Render Kafka service)
KAFKA_BROKER=kafka-broker.onrender.com:9092
KAFKA_TOPIC=transactions
KAFKA_USERNAME=
KAFKA_PASSWORD=

# Keep-Alive (optional but recommended)
ENABLE_KEEP_ALIVE=true
SERVICE_URL=https://your-backend.onrender.com
KEEP_ALIVE_INTERVAL=5

# Other variables...
DATABASE_URL=...
JWT_SECRET=...
```

### Kafka Service
```env
KAFKA_BROKER_ID=1
KAFKA_ZOOKEEPER_CONNECT=kafka-zookeeper.onrender.com:2181
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka-broker.onrender.com:9092
KAFKA_AUTO_CREATE_TOPICS_ENABLE=true
```

## ✅ Verification Checklist

- [ ] Zookeeper service deployed and running
- [ ] Kafka service deployed and running
- [ ] Transactions topic created
- [ ] Backend can connect to Kafka
- [ ] Uptime monitoring service configured
- [ ] Health checks working
- [ ] Services stay active (check after 20 minutes)

## 🐛 Troubleshooting

### Kafka Connection Fails
- Check Kafka service is running
- Verify `KAFKA_BROKER` URL is correct
- Check internal network connectivity on Render

### Services Keep Spinning Down
- Set up UptimeRobot or similar service
- Enable self-ping in backend
- Check health check endpoint is accessible

### Topic Not Found
- Enable `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`
- Or manually create topic via Kafka CLI

## 🎯 Best Practices

1. **Always use uptime monitoring** - UptimeRobot is free and reliable
2. **Enable health checks** - Helps Render monitor service health
3. **Keep producer running** - Continuous activity prevents spin-down
4. **Monitor logs** - Check Render logs regularly
5. **Set up alerts** - Get notified if services go down

## 🚀 Alternative: Simplified Single Service

If you want to simplify, you can run Kafka and Zookeeper in one service using Docker Compose, but Render's free tier may have limitations. The two-service approach is more reliable.

---

**Your Kafka is now running on Render and will stay active!** 🎉

