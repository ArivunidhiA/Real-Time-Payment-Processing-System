# Netlify Deployment Guide

This guide will help you deploy the frontend to Netlify.

## 🚀 Quick Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize Netlify
   - Select your repository: `Real-Time-Payment-Processing-System`

3. **Configure Build Settings**
   - **Base directory**: Leave empty (or set to `.`)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/.next`
   - **Node version**: `18` (or leave default)

4. **Set Environment Variables**
   Click "Show advanced" → "New variable" and add:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://real-time-payment-processing-system-z90t.onrender.com
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (3-5 minutes)
   - Your site will be live at `https://your-site-name.netlify.app`

---

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
   cd /path/to/Real-Time-Payment-Processing-System
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Follow prompts

4. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_BACKEND_URL https://real-time-payment-processing-system-z90t.onrender.com
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

---

## ⚙️ Netlify Dashboard Settings

After initial deployment, configure these settings in the Netlify dashboard:

### 1. Site Settings → Build & Deploy

**Build settings:**
- **Base directory**: `.` (root)
- **Build command**: `cd frontend && npm install && npm run build`
- **Publish directory**: `frontend/.next`

**Environment variables:**
- `NEXT_PUBLIC_BACKEND_URL` = `https://real-time-payment-processing-system-z90t.onrender.com`
- `NODE_VERSION` = `18` (optional, but recommended)

### 2. Site Settings → Environment Variables

Add these variables:
```
NEXT_PUBLIC_BACKEND_URL=https://real-time-payment-processing-system-z90t.onrender.com
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

### 3. Site Settings → Domain Management

- Your site will have a default URL: `https://random-name.netlify.app`
- You can add a custom domain if you have one
- Or change the site name in "Site settings" → "Change site name"

### 4. Site Settings → Build & Deploy → Post Processing

- **Asset optimization**: Enabled (default)
- **Snippet injection**: Enabled (default)

### 5. Site Settings → Build & Deploy → Continuous Deployment

- **Build hooks**: Can be used for manual deployments
- **Deploy notifications**: Configure if needed

---

## 🔧 Configuration Details

### Build Command
```bash
cd frontend && npm install && npm run build
```

This:
1. Changes to the frontend directory
2. Installs dependencies
3. Builds the Next.js application

### Publish Directory
```
frontend/.next
```

This is where Next.js outputs the production build.

### Environment Variables

**Required:**
- `NEXT_PUBLIC_BACKEND_URL`: Your Render backend URL

**Optional:**
- `NODE_VERSION`: Node.js version (default: 18)
- `NPM_FLAGS`: Additional npm flags

---

## 🧪 Testing After Deployment

1. **Check Build Logs**
   - Go to "Deploys" tab
   - Click on the latest deploy
   - Check for any errors

2. **Test the Site**
   - Visit your Netlify URL
   - Check browser console for errors
   - Verify WebSocket connection works
   - Test transaction generation

3. **Verify Environment Variables**
   - Check Network tab in browser DevTools
   - API calls should go to your Render backend
   - WebSocket should connect to Render backend

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check that all dependencies are in `package.json`
- Verify `npm install` completes successfully
- Check build logs for specific missing modules

**Error: "TypeScript errors"**
- Fix TypeScript errors locally first
- Run `npm run build` locally to test
- Check `tsconfig.json` configuration

**Error: "Next.js build failed"**
- Check Node.js version (should be 18+)
- Verify all environment variables are set
- Check for memory issues (Netlify free tier has limits)

### Site Not Loading

**Blank page:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check Network tab for failed requests

**WebSocket not connecting:**
- Verify backend URL is correct
- Check CORS settings on backend
- Verify WebSocket endpoint is accessible

**API calls failing:**
- Check backend is running on Render
- Verify backend URL in environment variables
- Check CORS configuration

### Performance Issues

**Slow initial load:**
- This is normal for Next.js on Netlify
- Consider enabling Netlify's edge functions
- Optimize images and assets

**WebSocket disconnections:**
- Check backend keep-alive is configured
- Verify Render backend is not spinning down
- Check network connectivity

---

## 📋 Deployment Checklist

Before deploying:

- [ ] Code is pushed to GitHub
- [ ] All dependencies are in `package.json`
- [ ] `npm run build` works locally
- [ ] Environment variables are documented
- [ ] Backend is deployed and running on Render
- [ ] Backend URL is correct

After deploying:

- [ ] Build completes successfully
- [ ] Site loads without errors
- [ ] API calls work correctly
- [ ] WebSocket connects successfully
- [ ] Transactions are processing
- [ ] Dashboard displays data correctly

---

## 🔄 Updating Deployment

### Automatic Updates (Recommended)

If you connected via GitHub:
- Push changes to `main` branch
- Netlify will automatically rebuild and deploy
- Check "Deploys" tab for status

### Manual Updates

1. **Via Netlify Dashboard:**
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

2. **Via Netlify CLI:**
   ```bash
   netlify deploy --prod
   ```

---

## 🎯 Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure SSL** (automatic with Netlify)
3. **Set up analytics** (optional, Netlify Analytics)
4. **Configure form handling** (if needed)
5. **Set up redirects** (if needed)

---

## 📚 Additional Resources

- [Netlify Next.js Documentation](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Your frontend is now ready to deploy to Netlify!** 🚀
