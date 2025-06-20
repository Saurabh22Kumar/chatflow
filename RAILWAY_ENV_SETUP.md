🚀 RAILWAY ENVIRONMENT VARIABLES SETUP
===============================================

Copy and paste these environment variables in Railway Dashboard:
Go to your Railway service → Variables tab → Add these one by one

🔹 CORE VARIABLES:
------------------
NODE_ENV=production
PORT=$PORT

🔹 DATABASE (Replace with Railway MongoDB connection):
-----------------------------------------------------
MONGO_URL=mongodb://mongo:PASSWORD@monorail.proxy.rlwy.net:PORT/railway

🔹 SECURITY:
------------
JWT_SECRET=chatflow-super-secure-jwt-secret-key-2024-production-railway

🔹 EMAIL SERVICE (Your existing Resend setup):
-----------------------------------------------
EMAIL_SERVICE=resend
RESEND_API_KEY=re_Pcut575k_GbzstHCcEvdaiA6wayYdi6kn
EMAIL_FROM=onboarding@resend.dev

🔹 FILE UPLOADS:
----------------
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

🔹 CORS & SOCKET (Replace YOUR_APP_URL with Railway URL):
--------------------------------------------------------
CORS_ORIGIN=https://YOUR_APP_URL.railway.app
SOCKET_CORS_ORIGIN=https://YOUR_APP_URL.railway.app

📝 STEPS TO DEPLOY:
==================
1. Go to https://railway.app
2. Create new project from GitHub
3. Select: Saurabh22Kumar/chatflow
4. Add MongoDB database service
5. Copy MongoDB connection string to MONGO_URL above
6. Add all environment variables above
7. Update CORS_ORIGIN with your Railway app URL
8. Deploy!

✅ Your ChatFlow will be live at: https://YOUR_APP_URL.railway.app
