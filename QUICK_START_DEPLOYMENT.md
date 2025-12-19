# Quick Start: Deploy to Production (No Credit Card Required)

This is a simplified guide to get you deployed quickly. For detailed steps, see the individual guides.

## 🎯 What You'll Deploy

- **Frontend**: Netlify (Next.js app)
- **Backend**: Render (Node.js API)
- **Database**: Render PostgreSQL
- **Kafka**: Upstash (serverless)

**All FREE, no credit card needed!**

## ⚡ Quick Steps (30 minutes total)

### 1. Get Upstash Kafka (5 min)
1. Go to https://upstash.com → Sign up
2. Create Kafka database
3. Create topic: `transactions`
4. Copy: Bootstrap Server, Username, Password

**Guide**: `UPSTASH_KAFKA_SETUP.md`

---

### 2. Deploy Backend to Render (15 min)
1. Go to https://render.com → Sign up with GitHub
2. Create PostgreSQL database (free tier)
3. Copy database connection string
4. Create Web Service:
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
5. Add environment variables (see below)
6. Deploy

**Guide**: `RENDER_BACKEND_DEPLOYMENT.md`

**Environment Variables for Render:**
```env
DATABASE_URL=<from Render PostgreSQL>
KAFKA_BROKER=<from Upstash>
KAFKA_USERNAME=<from Upstash>
KAFKA_PASSWORD=<from Upstash>
KAFKA_TOPIC=transactions
PORT=10000
NODE_ENV=production
JWT_SECRET=<run: openssl rand -base64 32>
ALLOWED_ORIGINS=https://your-site.netlify.app
PAYMENT_GATEWAY=mock
```

---

### 3. Deploy Frontend to Netlify (10 min)
1. Go to https://netlify.com → Sign up with GitHub
2. Import your GitHub repository
3. Settings:
   - Base directory: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `.next`
4. Add environment variable:
   - `NEXT_PUBLIC_BACKEND_URL` = your Render backend URL
5. Deploy

**Guide**: `NETLIFY_DEPLOYMENT.md`

---

### 4. Update CORS (2 min)
1. Go back to Render
2. Update `ALLOWED_ORIGINS` with your Netlify URL
3. Save (auto-redeploys)

---

## ✅ Done!

Your app is now live:
- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-backend.onrender.com`

---

## 📋 Full Checklist

For a detailed step-by-step checklist, see: `DEPLOYMENT_CHECKLIST.md`

---

## 🆘 Stuck?

1. Check the detailed guide for your current step
2. Review error logs in Render/Netlify dashboards
3. Verify all credentials are correct
4. Make sure services are active

**Most common issues:**
- Wrong Root Directory in Render (should be `backend`)
- Missing environment variables
- CORS errors (update `ALLOWED_ORIGINS`)

---

**Ready? Start with Step 1: Upstash Kafka! 🚀**

