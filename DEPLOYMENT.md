# HiveApp Deployment Guide

## 🚀 Deploy to Vercel

Your HiveApp is ready for deployment! Follow these steps:

### 1. Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Twitter Developer account for OAuth

### 2. Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial HiveApp deployment"

# Create GitHub repository and push
# (Create repository on GitHub first, then run:)
git remote add origin https://github.com/YOUR_USERNAME/hiveapp.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Deploy!

### 4. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-generated-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAuOT7P9HuiVhnAJSCg1RY5IpUCqkbyYL_5cSPZ1X3xers0tJJeXgmPdAEdXLLxTJ6oyq3JlYSjXAMawj1fGqO4
VAPID_PRIVATE_KEY=jWKvCvCTlIbJQla62FuPqQpeIGn8fIw6uDemTL8-1Cs
DATABASE_URL=file:./prod.db
```

### 5. Twitter OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Set callback URL to: `https://your-app-name.vercel.app/api/auth/callback/twitter`
4. Copy Client ID and Secret to Vercel environment variables

### 6. Features Ready for Production

✅ Full black theme
✅ Hive.png logo integrated
✅ PWA with mobile notifications
✅ Token-gated group access
✅ Real-time chat
✅ Group announcements
✅ User profiles
✅ Wallet integration
✅ Mobile-responsive design

### 7. Post-Deployment

- Test Twitter login
- Test PWA installation on mobile
- Test notifications
- Create test groups and messages

Your HiveApp will be live at: `https://your-app-name.vercel.app`

## 🎉 Ready to Launch!

Your modern token-gated chat application is production-ready with:
- Beautiful full black theme
- Custom hive logo
- Complete PWA functionality
- Mobile notifications
- All requested features implemented
