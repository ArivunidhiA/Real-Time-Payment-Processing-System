# Netlify Deployment Guide

This guide will help you deploy the Real-Time Payment Processing System to Netlify.

## 📋 Prerequisites

1. **Netlify Account**: Sign up at https://netlify.com
2. **GitHub Repository**: Push your code to GitHub
3. **Backend Deployed**: Backend should be deployed to Render first (see `RENDER_BACKEND_DEPLOYMENT.md`)
4. **Backend URL**: Your Render backend URL (e.g., `https://your-backend.onrender.com`)

## 🚀 Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect Repository**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Build Settings**
   - **Base directory**: `frontend` (important!)
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18` (set in Environment Variables)

3. **Set Environment Variables**
   Go to Site Settings → Environment Variables and add:

   **Required Frontend Variable:**
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```
   ⚠️ **Important**: Replace with your actual Render backend URL!

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   cd /path/to/your/project
   netlify init
   ```

4. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_BACKEND_URL https://your-site-name.netlify.app
   netlify env:set DATABASE_URL postgresql://...
   # ... add all other variables
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## ⚙️ Configuration Files

### `netlify.toml`
The project includes a `netlify.toml` file that configures:
- Build settings
- Function directory
- Redirect rules (API routes → Functions)
- Security headers

### Important Note

**Backend is deployed separately on Render** - Netlify only hosts the frontend!

- Backend: Render (see `RENDER_BACKEND_DEPLOYMENT.md`)
- Frontend: Netlify (this guide)
- The frontend makes API calls to the Render backend

## 🔧 Recommended Architecture

For production, we recommend:

```
┌─────────────────┐
│   Netlify       │
│   (Frontend)    │
└────────┬────────┘
         │
         │ API Calls
         │
┌────────▼────────┐
│   Render/       │
│   Railway       │
│   (Backend API) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──┐
│ Kafka │ │Postgres│
└───────┘ └──────┘
```

### Separate Backend Deployment

1. **Deploy Backend to Render/Railway**
   - Push backend code
   - Set all environment variables
   - Get backend URL (e.g., `https://your-backend.onrender.com`)

2. **Update Frontend**
   - Set `NEXT_PUBLIC_BACKEND_URL` to backend URL
   - Redeploy frontend to Netlify

## 🔐 Environment Variables Checklist

### Frontend (Netlify)
- [ ] `NEXT_PUBLIC_BACKEND_URL` (your Render backend URL)

**Note**: All backend environment variables are set in Render, not Netlify!

## 🧪 Testing Deployment

1. **Frontend**
   - Visit: `https://your-site.netlify.app`
   - Should load the dashboard with gradient background

2. **Backend Connection**
   - Open browser console (F12)
   - Check for API calls to your Render backend
   - Should see data loading in the dashboard

3. **Backend Health Check** (test directly)
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"success":true,"status":"ok"}`

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Check Node version (should be 18)

### API Calls Fail
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check CORS settings on backend
- Check browser console for errors

### Functions Not Working
- Check function logs in Netlify dashboard
- Verify environment variables are set
- Check function timeout settings (default: 10s)

### WebSocket Issues
- WebSockets require a persistent connection
- Consider using a separate backend service (Render/Railway)
- Or use Server-Sent Events (SSE) as alternative

## 📊 Monitoring

1. **Netlify Analytics**
   - View in Netlify dashboard
   - Track visits, bandwidth, build times

2. **Function Logs**
   - View in Netlify dashboard → Functions → Logs

3. **Error Tracking**
   - Set up Sentry DSN
   - View errors in Sentry dashboard

## 🔄 Continuous Deployment

Netlify automatically deploys on:
- Push to main branch
- Pull requests (preview deployments)

To disable auto-deploy:
- Go to Site Settings → Build & Deploy
- Uncheck "Deploy automatically"

## 📝 Custom Domain

1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_BACKEND_URL` if needed

## 🎉 Success!

Once deployed, your Real-Time Payment Processing System will be live at:
`https://your-site-name.netlify.app`

---

**Need Help?**
- Netlify Docs: https://docs.netlify.com
- Netlify Community: https://community.netlify.com

