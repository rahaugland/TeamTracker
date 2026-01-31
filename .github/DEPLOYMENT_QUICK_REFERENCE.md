# Deployment Quick Reference

Quick commands and troubleshooting for TeamTracker deployments.

## Common Commands

### Local Development
```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test:run

# Lint code
pnpm lint

# Analyze bundle size
pnpm run build:analyze
```

### Vercel CLI Deployment
```bash
# Install Vercel CLI (first time only)
npm i -g vercel

# Login to Vercel (first time only)
vercel login

# Deploy to preview
pnpm run deploy:preview
# or
vercel

# Deploy to production
pnpm run deploy
# or
vercel --prod

# View deployment logs
vercel logs

# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Environment Variables
```bash
# Pull environment variables from Vercel
vercel env pull

# Add new environment variable
vercel env add VITE_SUPABASE_URL production

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VITE_SUPABASE_URL production
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push and create preview deployment
git push origin feature/my-feature

# Merge to main (triggers production deployment)
git checkout main
git merge feature/my-feature
git push origin main
```

## Quick Troubleshooting

### Build Failures

| Problem | Solution |
|---------|----------|
| TypeScript errors | Run `pnpm run build` locally to see errors |
| ESLint errors | Run `pnpm run lint` and fix warnings |
| Missing dependencies | Delete `node_modules` and run `pnpm install` |
| Outdated lockfile | Run `pnpm install` to update `pnpm-lock.yaml` |

### Deployment Issues

| Problem | Solution |
|---------|----------|
| Environment variables missing | Check Vercel dashboard → Settings → Environment Variables |
| Old version showing | Clear browser cache, hard refresh (Ctrl+Shift+R) |
| 404 on routes | Verify `vercel.json` has SPA rewrites configured |
| Service worker not updating | Unregister in DevTools → Application → Service Workers |

### Environment Variable Issues

| Problem | Solution |
|---------|----------|
| Supabase connection fails | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Variables not available in build | Ensure variables are prefixed with `VITE_` |
| Different values needed for preview | Set environment-specific variables in Vercel |
| Local env not working | Create `.env.local` from `.env.example` |

## Deployment Checklist (Quick)

Before deploying to production:

- [ ] `pnpm run build` succeeds
- [ ] `pnpm run lint` passes
- [ ] `pnpm run test:run` passes
- [ ] Environment variables set in Vercel
- [ ] Changes committed and pushed to git

## Emergency Procedures

### Rollback Production
```bash
# Via CLI
vercel ls  # Find previous deployment URL
vercel rollback <deployment-url>

# Via Dashboard
# 1. Go to Vercel dashboard → Deployments
# 2. Find last good deployment
# 3. Click ⋯ → "Promote to Production"
```

### Fix Failed Deployment
```bash
# 1. Check what failed
vercel logs

# 2. Fix locally
pnpm run build  # Test build works

# 3. Commit and redeploy
git add .
git commit -m "Fix deployment issue"
git push origin main
```

### Clear Vercel Cache
```bash
# Redeploy without cache
vercel --prod --force
```

## Useful Vercel Dashboard URLs

- **Project Settings**: `https://vercel.com/<username>/<project>/settings`
- **Environment Variables**: `https://vercel.com/<username>/<project>/settings/environment-variables`
- **Deployments**: `https://vercel.com/<username>/<project>/deployments`
- **Domains**: `https://vercel.com/<username>/<project>/settings/domains`
- **Analytics**: `https://vercel.com/<username>/<project>/analytics`

## Key Files for Deployment

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel configuration (build, rewrites, headers) |
| `.vercelignore` | Files to exclude from deployment |
| `vite.config.ts` | Build configuration and optimizations |
| `package.json` | Scripts and dependencies |
| `.env.example` | Template for required environment variables |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline |

## Production URLs

After deployment, your app will be available at:

- **Production**: `https://<project-name>.vercel.app`
- **Custom domain**: `https://your-domain.com` (if configured)
- **Preview**: `https://<project-name>-<hash>.vercel.app`

## Support

- **Vercel Status**: https://www.vercel-status.com
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions Status**: https://www.githubstatus.com

---

For detailed instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md)
