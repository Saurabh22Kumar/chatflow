# ChatFlow Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository (already done ✅)
- MongoDB Atlas database (already configured ✅)

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "New Project"

2. **Import Repository**
   - Connect your GitHub account if not already connected
   - Select your `chatflow` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: "Other" (will auto-detect)
   - Root Directory: Leave as `.` (root)
   - Build Command: Will use the configured build settings
   - Output Directory: `public/build`

4. **Add Environment Variables**
   ```
   MONGO_URL=your_mongodb_atlas_connection_string
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project root**
   ```bash
   vercel
   ```

4. **Follow the prompts**
   - Project name: `chatflow`
   - Link to existing project: No (first time)
   - In which directory is your code located: `./`

5. **Set environment variables**
   ```bash
   vercel env add MONGO_URL
   # Enter your MongoDB Atlas connection string when prompted
   
   vercel env add NODE_ENV
   # Enter: production
   ```

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/chatflow` |
| `NODE_ENV` | Environment mode | `production` |

## Post-Deployment

1. **Update Frontend API URL**
   - Your frontend will automatically detect the production environment
   - API calls will go to the same domain

2. **Test Your Deployment**
   - Visit your Vercel URL
   - Test user registration
   - Test messaging functionality

3. **Custom Domain (Optional)**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

2. **API Errors**
   - Verify MONGO_URL environment variable
   - Check API routes are correctly configured

3. **Frontend Issues**
   - Clear browser cache
   - Check console for errors

### Support
- Vercel Documentation: https://vercel.com/docs
- ChatFlow Issues: https://github.com/Saurabh22Kumar/chatflow/issues

## Features Available After Deployment

✅ **Serverless API** - Automatic scaling
✅ **Global CDN** - Fast worldwide access  
✅ **HTTPS** - Secure by default
✅ **Custom Domains** - Professional URLs
✅ **Analytics** - Built-in performance monitoring
✅ **Automatic Deployments** - Git-based deployments
