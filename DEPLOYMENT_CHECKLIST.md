# Complete Deployment Checklist

Follow this checklist step-by-step to deploy your Real-Time Payment Processing System to production (all free, no credit card required).

## 📋 Pre-Deployment Checklist

Before starting, make sure:
- [ ] Code is pushed to GitHub repository
- [ ] You have a GitHub account
- [ ] You're ready to create accounts on:
  - Upstash (for Kafka)
  - Render (for backend + database)
  - Netlify (for frontend)

## 🚀 Deployment Steps

### Step 1: Set Up Upstash Kafka (5 minutes)

**Guide**: See `UPSTASH_KAFKA_SETUP.md` for detailed steps

- [ ] Sign up at https://upstash.com (no credit card)
- [ ] Create Kafka database
- [ ] Create topic named `transactions`
- [ ] Copy Bootstrap Server URL
- [ ] Copy Username
- [ ] Copy Password
- [ ] Save credentials securely

**You'll need:**
```
KAFKA_BROKER=<from Upstash>
KAFKA_USERNAME=<from Upstash>
KAFKA_PASSWORD=<from Upstash>
```

---

### Step 2: Set Up Render Backend (10 minutes)

**Guide**: See `RENDER_BACKEND_DEPLOYMENT.md` for detailed steps

#### 2.1 Create PostgreSQL Database
- [ ] Sign up at https://render.com (GitHub login)
- [ ] Create new PostgreSQL database
- [ ] Select free tier
- [ ] Copy database connection string
- [ ] Run database schema (from `backend/db/schema.sql`)

**You'll need:**
```
DATABASE_URL=<from Render PostgreSQL>
```

#### 2.2 Deploy Backend Web Service
- [ ] Create new Web Service in Render
- [ ] Connect your GitHub repository
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Select free tier

#### 2.3 Configure Environment Variables in Render
Add these in Render → Your Web Service → Environment:

- [ ] `DATABASE_URL` (from Step 2.1)
- [ ] `KAFKA_BROKER` (from Step 1)
- [ ] `KAFKA_USERNAME` (from Step 1)
- [ ] `KAFKA_PASSWORD` (from Step 1)
- [ ] `KAFKA_TOPIC=transactions`
- [ ] `PORT=10000`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `JWT_EXPIRES_IN=24h`
- [ ] `ALLOWED_ORIGINS` (will update after frontend deploy)
- [ ] `PAYMENT_GATEWAY=mock` (for testing)

#### 2.4 Deploy and Verify
- [ ] Wait for deployment to complete
- [ ] Check logs for successful startup
- [ ] Test health endpoint: `https://your-backend.onrender.com/api/health`
- [ ] Save your backend URL: `https://your-backend.onrender.com`

**Backend URL**: `https://____________________.onrender.com`

---

### Step 3: Deploy Frontend to Netlify (5 minutes)

**Guide**: See `NETLIFY_DEPLOYMENT.md` for detailed steps

#### 3.1 Create Netlify Site
- [ ] Sign up at https://netlify.com (GitHub login)
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Connect your GitHub repository
- [ ] Select your repository

#### 3.2 Configure Build Settings
- [ ] Base directory: `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `.next`
- [ ] Node version: `18`

#### 3.3 Set Environment Variable
- [ ] Go to Site Settings → Environment Variables
- [ ] Add: `NEXT_PUBLIC_BACKEND_URL`
- [ ] Value: Your Render backend URL from Step 2.4
- [ ] Example: `https://your-backend.onrender.com`

#### 3.4 Deploy
- [ ] Click "Deploy site"
- [ ] Wait for build to complete
- [ ] Save your frontend URL: `https://your-site.netlify.app`

**Frontend URL**: `https://____________________.netlify.app`

---

### Step 4: Final Configuration (2 minutes)

#### 4.1 Update Backend CORS
- [ ] Go back to Render → Your Web Service → Environment
- [ ] Update `ALLOWED_ORIGINS` with your Netlify URL
- [ ] Example: `https://your-site.netlify.app`
- [ ] Save changes (will auto-redeploy)

#### 4.2 Verify Everything Works
- [ ] Visit your Netlify frontend URL
- [ ] Check that dashboard loads
- [ ] Check browser console for errors
- [ ] Test "Generate Transaction" button
- [ ] Verify real-time updates work

---

## ✅ Final Verification Checklist

- [ ] Frontend loads at Netlify URL
- [ ] Backend health check works: `/api/health`
- [ ] Frontend can fetch data from backend
- [ ] Transactions can be generated
- [ ] Real-time updates work (WebSocket)
- [ ] No console errors in browser
- [ ] No errors in Render logs

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
- [ ] Check `NEXT_PUBLIC_BACKEND_URL` is correct in Netlify
- [ ] Verify backend is running (check Render logs)
- [ ] Check CORS settings in backend (`ALLOWED_ORIGINS`)

### Backend errors
- [ ] Check Render logs for errors
- [ ] Verify all environment variables are set
- [ ] Check database connection
- [ ] Check Kafka connection

### Kafka connection fails
- [ ] Verify Upstash credentials are correct
- [ ] Check Kafka cluster is active in Upstash
- [ ] Ensure topic `transactions` exists

---

## 📝 Credentials Summary

Save these for your records:

### Upstash Kafka
```
Bootstrap Server: ____________________
Username: ____________________
Password: ____________________
```

### Render
```
Backend URL: https://____________________.onrender.com
Database URL: postgresql://____________________
```

### Netlify
```
Frontend URL: https://____________________.netlify.app
```

### JWT Secret
```
JWT_SECRET: ____________________
```

---

## 🎉 Success!

Once all checkboxes are checked, your system is live and ready to use!

**Your live URLs:**
- Frontend: `https://your-site.netlify.app`
- Backend API: `https://your-backend.onrender.com/api`

---

## 📚 Reference Guides

- **Upstash Kafka Setup**: `UPSTASH_KAFKA_SETUP.md`
- **Render Backend Deployment**: `RENDER_BACKEND_DEPLOYMENT.md`
- **Netlify Frontend Deployment**: `NETLIFY_DEPLOYMENT.md`
- **API Keys Required**: `API_KEYS_REQUIRED.md`

---

## 🆘 Need Help?

If you get stuck at any step:
1. Check the detailed guide for that step
2. Review error messages in logs
3. Verify all credentials are correct
4. Make sure all services are active

**Common Issues:**
- First request to Render backend may be slow (cold start)
- WebSocket may need a few seconds to connect
- Check browser console for CORS errors

---

**Good luck with your deployment! 🚀**

