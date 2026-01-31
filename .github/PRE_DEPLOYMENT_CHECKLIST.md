# Pre-Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

## Code Quality

- [ ] All TypeScript compilation errors resolved
  ```bash
  pnpm run build
  ```

- [ ] No ESLint errors or warnings
  ```bash
  pnpm run lint
  ```

- [ ] Code formatted with Prettier
  ```bash
  pnpm run format
  ```

- [ ] All tests passing
  ```bash
  pnpm run test:run
  ```

## Environment Configuration

- [ ] `.env.example` is up to date with all required variables
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Verified environment variables in Vercel dashboard:
  - [ ] `VITE_SUPABASE_URL` set for Production, Preview, Development
  - [ ] `VITE_SUPABASE_ANON_KEY` set for Production, Preview, Development
  - [ ] `VITE_ENVIRONMENT` set to `production`

## Supabase Configuration

- [ ] Database schema is up to date
- [ ] RLS (Row Level Security) policies are configured
- [ ] Authentication providers are enabled
- [ ] API rate limits are appropriate
- [ ] Backup strategy is in place

## Build Verification

- [ ] Build completes without errors
  ```bash
  pnpm run build
  ```

- [ ] Build output directory (`dist`) contains:
  - [ ] `index.html`
  - [ ] `assets/` folder with JS and CSS
  - [ ] `manifest.json`
  - [ ] `service-worker.js`
  - [ ] Icon files (`icon-192.png`, `icon-512.png`)

- [ ] Test production build locally
  ```bash
  pnpm run preview
  ```

## PWA Requirements

- [ ] `manifest.json` has correct values:
  - [ ] App name and short name
  - [ ] Correct start URL
  - [ ] Icons at correct sizes (192x192, 512x512)
  - [ ] Theme and background colors set

- [ ] Service worker registers correctly
- [ ] App works offline (test with DevTools offline mode)
- [ ] Icons display correctly on home screen (test on mobile)

## Security

- [ ] No sensitive data in source code
- [ ] No API keys or secrets committed to git
- [ ] Supabase RLS policies prevent unauthorized access
- [ ] CORS settings configured in Supabase if needed
- [ ] Security headers configured in `vercel.json`

## Performance

- [ ] Images optimized and properly sized
- [ ] No console.log statements in production code
- [ ] Code splitting configured (check `vite.config.ts`)
- [ ] Bundle size is reasonable (run `pnpm run build:analyze`)

## Functionality Testing

- [ ] Authentication works:
  - [ ] Sign up
  - [ ] Sign in
  - [ ] Sign out
  - [ ] Password reset

- [ ] Core features work:
  - [ ] Create/edit/delete teams
  - [ ] Add/edit/remove players
  - [ ] Record match data
  - [ ] View statistics
  - [ ] Export data

- [ ] Navigation works:
  - [ ] All routes accessible
  - [ ] Back/forward browser buttons work
  - [ ] Deep linking works (direct URL access)

- [ ] Forms work:
  - [ ] Validation shows errors
  - [ ] Submission succeeds
  - [ ] Error handling works

## Vercel Configuration

- [ ] `vercel.json` exists and is properly configured
- [ ] Framework preset is correct (Vite)
- [ ] Build command: `pnpm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `pnpm install`
- [ ] SPA rewrites configured for routing

## GitHub Actions (if enabled)

- [ ] `.github/workflows/deploy.yml` exists
- [ ] Required secrets configured in GitHub:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`
- [ ] Workflow runs successfully on test branch

## Documentation

- [ ] README.md is up to date
- [ ] DEPLOYMENT.md has current deployment instructions
- [ ] Environment variables documented
- [ ] Setup instructions are clear

## Browser Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Responsive Design

- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1024px+ width)
- [ ] Large desktop (1920px+ width)

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader friendly (test with Chrome Vox or NVDA)
- [ ] Proper heading hierarchy
- [ ] Form labels are accessible
- [ ] Color contrast meets WCAG AA standards

## Final Checks

- [ ] All team members notified of deployment
- [ ] Backup of current production state (if applicable)
- [ ] Rollback plan documented
- [ ] Post-deployment monitoring plan in place

## Post-Deployment

After deployment, verify:

- [ ] Homepage loads correctly
- [ ] Can create an account
- [ ] Can log in with existing account
- [ ] Core functionality works in production
- [ ] PWA install prompt appears
- [ ] Custom domain works (if configured)
- [ ] SSL certificate is valid
- [ ] No console errors in browser

## Rollback Procedure

If deployment fails:

1. Go to Vercel dashboard → Deployments
2. Find last known good deployment
3. Click ⋯ → "Promote to Production"
4. Verify rollback successful
5. Document what went wrong
6. Fix issues before next deployment

---

**Note:** This checklist should be reviewed and updated as the project evolves. Add project-specific checks as needed.
