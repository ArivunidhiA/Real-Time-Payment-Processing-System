# Render Keep-Alive Setup - Prevent Services from Spinning Down

Render free tier services **spin down after 15 minutes of inactivity**. This guide shows you how to prevent that.

## ⚠️ The Problem

- Free tier services sleep after 15 minutes of no requests
- First request after sleep takes 30-60 seconds (cold start)
- This breaks real-time functionality

## ✅ The Solution: Multiple Keep-Alive Methods

Use **at least 2 of these methods** for maximum reliability:

---

## Method 1: UptimeRobot (Recommended - Easiest)

**Free**: 50 monitors, checks every 5 minutes

### Setup Steps:

1. **Sign Up**
   - Go to https://uptimerobot.com
   - Click "Sign Up" (free account)
   - Verify email

2. **Add Monitor for Backend**
   - Click **"+ Add New Monitor"**
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Payment Backend Keep-Alive`
   - **URL**: `https://your-backend.onrender.com/api/keep-alive`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Add your email
   - Click **"Create Monitor"**

3. **Add Monitor for Frontend** (optional but recommended)
   - **URL**: `https://your-site.netlify.app`
   - **Interval**: 5 minutes

4. **Done!** UptimeRobot will ping your services every 5 minutes

### Why This Works:
- External service pings your backend
- Keeps it active 24/7
- Free and reliable
- Sends alerts if service goes down

---

## Method 2: Cron-Job.org (Free Alternative)

**Free**: Unlimited cron jobs

### Setup Steps:

1. **Sign Up**
   - Go to https://cron-job.org
   - Click "Sign Up" (free)
   - Verify email

2. **Create Cron Job**
   - Click **"Create cronjob"**
   - **Title**: `Backend Keep-Alive`
   - **Address**: `https://your-backend.onrender.com/api/keep-alive`
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)
   - **Request Method**: GET
   - Click **"Create cronjob"**

3. **Done!** Service will ping every 5 minutes

---

## Method 3: Backend Self-Ping (Built-in)

Your backend has a built-in keep-alive service.

### Enable It:

1. **Add to Render Environment Variables**:
   ```env
   ENABLE_KEEP_ALIVE=true
   SERVICE_URL=https://your-backend.onrender.com
   KEEP_ALIVE_INTERVAL=5
   ```

2. **The backend will ping itself every 5 minutes**

### Note:
- This only works if the backend is already running
- Use this **in addition to** external monitoring
- Not as reliable as external service

---

## Method 4: Frontend Auto-Refresh

Your frontend can keep the backend alive by making regular requests.

### Already Implemented:
- Frontend polls `/api/stats` every 10 seconds
- This keeps backend active if users are on the site

### Enhance It:
Add a background keep-alive in your frontend:

```javascript
// In your frontend code
setInterval(() => {
  fetch('https://your-backend.onrender.com/api/keep-alive')
    .catch(() => {}); // Silent fail
}, 4 * 60 * 1000); // Every 4 minutes
```

---

## Method 5: Render Health Checks

Configure Render's built-in health checks.

### Setup:

1. **In Render Dashboard** → Your Service → Settings
2. **Health Check Path**: `/api/health`
3. **Health Check Interval**: 60 seconds
4. **Save**

### Why This Helps:
- Render monitors service health
- Can auto-restart if unhealthy
- Doesn't prevent spin-down, but helps with reliability

---

## 🎯 Recommended Setup (Maximum Reliability)

Use **ALL of these**:

1. ✅ **UptimeRobot** - Primary keep-alive (external)
2. ✅ **Cron-Job.org** - Backup keep-alive (external)
3. ✅ **Backend Self-Ping** - Internal backup
4. ✅ **Frontend Polling** - User activity keeps it alive
5. ✅ **Render Health Checks** - Service monitoring

---

## 📋 Quick Setup Checklist

### External Monitoring (Choose 1-2):
- [ ] UptimeRobot account created
- [ ] Monitor added for backend: `/api/keep-alive`
- [ ] Monitor added for frontend (optional)
- [ ] OR Cron-Job.org setup

### Backend Configuration:
- [ ] `ENABLE_KEEP_ALIVE=true` in Render env vars
- [ ] `SERVICE_URL` set to your backend URL
- [ ] `KEEP_ALIVE_INTERVAL=5` set
- [ ] Health check path configured in Render

### Verification:
- [ ] Test `/api/keep-alive` endpoint manually
- [ ] Check UptimeRobot shows "Up" status
- [ ] Wait 20 minutes, verify service still responds quickly
- [ ] Check Render logs for keep-alive pings

---

## 🧪 Testing Keep-Alive

### Test 1: Manual Ping
```bash
curl https://your-backend.onrender.com/api/keep-alive
```
Should return: `{"success":true,"status":"alive",...}`

### Test 2: Check UptimeRobot
- Go to UptimeRobot dashboard
- Monitor should show "Up" status
- Check "Response Times" - should be consistent

### Test 3: Cold Start Test
1. Stop all monitoring for 20 minutes
2. Make a request to your backend
3. Note the response time (should be slow - 30-60s)
4. Re-enable monitoring
5. Wait 5 minutes
6. Make another request (should be fast - <1s)

---

## 🆘 Troubleshooting

### Service Still Spinning Down
- Check UptimeRobot is actually pinging (check logs)
- Verify URL is correct (no typos)
- Check backend `/api/keep-alive` endpoint works
- Try multiple monitoring services

### Keep-Alive Not Working
- Check Render environment variables are set
- Check backend logs for keep-alive errors
- Verify `SERVICE_URL` is correct
- Check network connectivity

### First Request Still Slow
- This is normal for free tier
- External monitoring reduces this
- Consider upgrading to paid plan for always-on

---

## 💡 Pro Tips

1. **Use Multiple Services**: Don't rely on just one
2. **Check Regularly**: Monitor UptimeRobot dashboard weekly
3. **Set Up Alerts**: Get email notifications if service goes down
4. **Test Periodically**: Manually test after 20+ minutes of inactivity
5. **Document Your Setup**: Note which services you're using

---

## 🎉 Success Criteria

Your setup is working if:
- ✅ UptimeRobot shows "Up" status
- ✅ Backend responds in <1 second after 20+ minutes
- ✅ No cold starts during business hours
- ✅ Health checks passing in Render

---

**With this setup, your Render services will stay active 24/7!** 🚀

