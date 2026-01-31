# TeamTracker Deployment Guide

This guide covers deploying TeamTracker to Vercel with proper configuration for the PWA service worker and Supabase integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Vercel Setup](#initial-vercel-setup)
3. [Environment Variables](#environment-variables)
4. [Custom Domain Configuration](#custom-domain-configuration)
5. [Preview Deployments](#preview-deployments)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD with GitHub Actions](#cicd-with-github-actions)

## Prerequisites

Before deploying, ensure you have:

- A Vercel account (free tier works great)
- A Supabase project with your database configured
- Your Supabase URL and anon key ready
- Git repository pushed to GitHub, GitLab, or Bitbucket
- Node.js 18+ and pnpm installed locally

## Initial Vercel Setup

### Option 1: Deploy via Vercel Dashboard (Recommended for First Deploy)

1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub/GitLab/Bitbucket account

2. **Import Your Project**
   - Click "Add New Project"
   - Select your TeamTracker repository
   - Vercel will auto-detect it as a Vite project

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

   These should be auto-filled based on `vercel.json`, but verify they're correct.

4. **Add Environment Variables** (see next section)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? teamtracker (or your preference)
# - Directory? ./
# - Override settings? N

# For production deployment
vercel --prod
```

## Environment Variables

### Required Variables

You need to configure these environment variables in Vercel:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abcdefg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous public key | `eyJhbGci...` |
| `VITE_ENVIRONMENT` | Environment identifier | `production` |

### Adding Variables via Dashboard

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase URL (from Supabase dashboard → Settings → API)
   - **Environment**: Select `Production`, `Preview`, and `Development`
   - Click **Add**
4. Repeat for `VITE_SUPABASE_ANON_KEY` and `VITE_ENVIRONMENT`

### Adding Variables via CLI

```bash
# Add environment variables
vercel env add VITE_SUPABASE_URL production
# (paste your value when prompted)

vercel env add VITE_SUPABASE_ANON_KEY production
# (paste your value when prompted)

vercel env add VITE_ENVIRONMENT production
# (enter: production)

# Pull environment variables locally for testing
vercel env pull
```

### Getting Supabase Credentials

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your TeamTracker project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → use for `VITE_SUPABASE_URL`
   - **Project API keys** → anon/public key → use for `VITE_SUPABASE_ANON_KEY`

## Custom Domain Configuration

### Adding a Custom Domain

1. In Vercel dashboard, go to your project
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain (e.g., `teamtracker.com` or `app.yourdomain.com`)
5. Follow the DNS configuration instructions:

#### For Root Domain (teamtracker.com)

Add an `A` record:
- **Type**: A
- **Name**: @
- **Value**: 76.76.21.21

#### For Subdomain (app.yourdomain.com)

Add a `CNAME` record:
- **Type**: CNAME
- **Name**: app
- **Value**: cname.vercel-dns.com

6. Wait for DNS propagation (usually 5-60 minutes)
7. Vercel will automatically provision SSL certificate

### Redirect www to Non-www (or vice versa)

1. Add both domains (www and non-www)
2. Vercel automatically redirects based on which you added first
3. To change: Settings → Domains → Set as Primary

## Preview Deployments

Vercel automatically creates preview deployments for:

- **Pull Requests**: Each PR gets a unique URL
- **Branch Pushes**: Each push to non-production branches

### Preview Deployment URLs

Format: `https://teamtracker-{hash}-{scope}.vercel.app`

### Using Preview Deployments

1. Create a branch: `git checkout -b feature/new-stats`
2. Make changes and push: `git push origin feature/new-stats`
3. Vercel automatically deploys to a preview URL
4. Check deployment status in GitHub PR checks
5. Click "Visit Preview" to test
6. Preview uses same environment variables as production

### Preview-Specific Environment Variables

If you need different values for preview deployments:

1. Settings → Environment Variables
2. When adding a variable, select only **Preview** environment
3. Add preview-specific values (e.g., test Supabase project)

## Post-Deployment Verification

### Checklist

After deployment, verify these features work:

- [ ] Homepage loads correctly
- [ ] Navigation between pages (Teams, Players, Matches, Stats)
- [ ] PWA installation prompt appears on mobile/Chrome
- [ ] Service worker registers (check DevTools → Application → Service Workers)
- [ ] Offline functionality works (disconnect network, refresh)
- [ ] Supabase connection works (try logging in)
- [ ] Images and icons load
- [ ] Form submissions work
- [ ] Data persists after refresh
- [ ] Game finalization works (locks stats, shows awards)
- [ ] Season creation and finalization works

### Testing PWA Features

1. Open deployed site in Chrome
2. Open DevTools (F12)
3. Go to **Application** tab
4. Check **Manifest**: Should show TeamTracker manifest
5. Check **Service Workers**: Should show registered worker
6. Go to **Network** tab → Set "Offline"
7. Refresh page → Should still load

### Testing on Mobile

1. Visit site on mobile device
2. Look for "Install TeamTracker" prompt
3. Install the PWA
4. Check home screen icon appears
5. Open from home screen → should open in standalone mode (no browser UI)

## Troubleshooting

### Build Fails with TypeScript Errors

**Problem**: Build fails during `tsc -b` step

**Solution**:
```bash
# Run locally to see errors
pnpm run build

# Fix TypeScript errors
# Check: tsconfig.json, tsconfig.app.json
# Ensure all types are properly imported
```

### Environment Variables Not Working

**Problem**: App can't connect to Supabase

**Solution**:
1. Check variable names match exactly: `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
2. In Vercel dashboard, verify variables are set for "Production"
3. Redeploy after adding variables: Deployments → Click ⋯ → Redeploy
4. Check browser console for error messages

### Service Worker Not Updating

**Problem**: Changes don't appear after deployment

**Solution**:
1. Service workers are cached aggressively
2. In Chrome DevTools → Application → Service Workers:
   - Check "Update on reload"
   - Click "Unregister" then refresh
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Wait 24 hours for natural update cycle

### 404 on Routes

**Problem**: Direct navigation to routes (e.g., `/teams`) returns 404

**Solution**:
- This is handled by `vercel.json` rewrites
- Verify `vercel.json` exists in project root
- Redeploy if you just added it
- Check Vercel logs for routing issues

### Slow Build Times

**Problem**: Builds take > 5 minutes

**Solution**:
```bash
# Check build locally
pnpm run build

# Enable build cache (default in Vercel)
# Optimize dependencies: remove unused packages
pnpm prune

# Consider code splitting in vite.config.ts
```

### Images Not Loading

**Problem**: Images show broken in production but work locally

**Solution**:
1. Check image paths are absolute from `/public`: `/icon-192.png` not `./icon-192.png`
2. Verify images exist in `/public` directory
3. Check case sensitivity: `Icon.png` vs `icon.png`
4. Ensure images are committed to git

### PWA Install Prompt Doesn't Appear

**Problem**: No install prompt on mobile

**Solution**:
1. Verify HTTPS (required for PWA) - Vercel handles this
2. Check manifest.json is accessible: `https://your-site.vercel.app/manifest.json`
3. Verify icons exist and are correct sizes
4. Check browser console for manifest errors
5. Some browsers (Safari) have different PWA install UX

### Deployment Succeeded but Site Shows Old Version

**Problem**: Latest changes not visible

**Solution**:
1. Check deployment URL matches (production vs preview)
2. Clear browser cache and hard refresh
3. Check if deployment actually included your changes:
   - Vercel dashboard → Deployments → Click deployment
   - View "Source" tab to see exact commit deployed
4. Try incognito/private browsing mode

### Supabase RLS Policies Not Working

**Problem**: Data not loading, "Policy violation" errors

**Solution**:
1. This is a Supabase configuration issue, not deployment
2. Check Supabase → Authentication → Policies
3. Ensure RLS policies allow anon key access where needed
4. Check browser console for specific error messages
5. Test in Supabase SQL editor with same query

## CI/CD with GitHub Actions

For automated deployments, see `.github/workflows/deploy.yml`

### What GitHub Actions Handles

- Automatic deployment on push to `main`
- Preview deployments for pull requests
- Build verification before deployment
- TypeScript and lint checks
- Prevents deploying broken code

### Viewing Deployment Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. See deployment status for each commit/PR
4. Green checkmark = successful deployment
5. Red X = build failed (check logs)

### Manual Deployment Trigger

If automatic deployment fails:

```bash
# Trigger manual deployment
vercel --prod

# Or from specific commit
git checkout <commit-hash>
vercel --prod
```

## Performance Optimization

### Recommended Vercel Settings

These are handled automatically by `vercel.json`:

- **Static Assets**: Cached for 1 year (immutable)
- **Images**: Cached for 24 hours
- **Service Worker**: No cache (always fresh)
- **HTML**: No cache (always fetch latest)

### Enable Vercel Analytics (Optional)

1. Go to Vercel dashboard → your project
2. Click **Analytics** tab
3. Click **Enable Analytics**
4. Free tier includes Web Vitals monitoring
5. See real user performance metrics

### Speed Insights

1. Install Vercel Speed Insights package:
```bash
pnpm add @vercel/speed-insights
```

2. Add to your app (in `src/main.tsx`):
```tsx
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();
```

3. Redeploy to see metrics in Vercel dashboard

## Rollback Strategy

If a deployment breaks production:

### Via Dashboard

1. Vercel dashboard → Deployments
2. Find last known good deployment
3. Click ⋯ → Promote to Production
4. Confirms in ~30 seconds

### Via CLI

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

## Security Best Practices

- ✅ Never commit `.env.local` to git
- ✅ Rotate Supabase keys if accidentally exposed
- ✅ Use Vercel environment variables, not hardcoded values
- ✅ Enable Vercel deployment protection for sensitive projects
- ✅ Review Vercel access logs regularly
- ✅ Use Supabase RLS policies for data protection

## Cost Considerations

Vercel Free Tier includes:
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Web analytics

Paid plans needed for:
- Team collaboration features
- Password-protected deployments
- Advanced analytics
- Higher bandwidth limits

For this volleyball team app, free tier should be sufficient for most use cases.

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vite.dev/guide/static-deploy.html
- **Supabase Docs**: https://supabase.com/docs
- **PWA Guide**: https://web.dev/progressive-web-apps/

## Next Steps

After successful deployment:

1. Share the URL with your team
2. Install PWA on mobile devices
3. Set up custom domain (optional)
4. Enable analytics to monitor usage
5. Create GitHub issue templates for deployment problems
6. Document any custom deployment procedures for your team

---

Last updated: January 2026
