# Deployment Configuration Files Summary

This document provides an overview of all deployment-related files in the TeamTracker project.

## Core Deployment Files

### `vercel.json`
**Location**: Project root
**Purpose**: Main Vercel configuration file

Key configurations:
- Build command: `pnpm run build`
- Output directory: `dist`
- SPA routing rewrites (all routes → index.html)
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Caching strategies for different asset types
- Service worker cache control
- Environment variable references

### `.vercelignore`
**Location**: Project root
**Purpose**: Excludes unnecessary files from Vercel deployment

Excludes:
- `node_modules` and `.pnpm-store`
- Development files (`.env.local`, `.vscode`, etc.)
- Test coverage and CI/CD files
- Documentation (except README.md)
- OS-specific files

### `vite.config.ts`
**Location**: Project root
**Purpose**: Vite build configuration with production optimizations

Features:
- Source maps enabled for production debugging
- Terser minification with console.log removal
- Code splitting and manual chunk configuration
- Gzip and Brotli compression
- Bundle size analysis (via `pnpm run build:analyze`)

### `package.json`
**Location**: Project root
**Purpose**: Project metadata and scripts

Deployment scripts added:
- `deploy`: Deploy to production (`vercel --prod`)
- `deploy:preview`: Deploy preview (`vercel`)
- `build:analyze`: Analyze bundle size

## Documentation Files

### `DEPLOYMENT.md`
**Location**: Project root
**Purpose**: Comprehensive deployment guide

Contents:
- Prerequisites and initial setup
- Step-by-step Vercel configuration
- Environment variable setup
- Custom domain configuration
- Preview deployments explanation
- Post-deployment verification checklist
- Troubleshooting common issues
- Performance optimization tips
- Rollback procedures
- Security best practices

### `.github/GITHUB_ACTIONS_SETUP.md`
**Location**: `.github/` directory
**Purpose**: GitHub Actions CI/CD setup instructions

Contents:
- How to get Vercel credentials
- Adding secrets to GitHub repository
- Workflow breakdown and customization
- Troubleshooting GitHub Actions issues
- Security best practices for CI/CD

### `.github/PRE_DEPLOYMENT_CHECKLIST.md`
**Location**: `.github/` directory
**Purpose**: Pre-deployment verification checklist

Covers:
- Code quality checks
- Environment configuration
- Supabase setup
- Build verification
- PWA requirements
- Security checks
- Performance checks
- Functionality testing
- Browser and responsive testing
- Accessibility verification

### `.github/DEPLOYMENT_QUICK_REFERENCE.md`
**Location**: `.github/` directory
**Purpose**: Quick command reference and troubleshooting

Contains:
- Common CLI commands
- Quick troubleshooting table
- Emergency procedures
- Useful Vercel dashboard URLs
- Key files reference

## CI/CD Files

### `.github/workflows/deploy.yml`
**Location**: `.github/workflows/` directory
**Purpose**: GitHub Actions workflow for automated deployment

Workflow jobs:
1. **Quality Checks**: TypeScript, ESLint, build verification
2. **Deploy**: Vercel deployment (production or preview)
3. **Post-Deploy Tests**: Test suite and health checks

Features:
- Automatic deployment on push to `main`
- Preview deployments for pull requests
- PR comments with preview URLs
- Build caching for faster runs
- Failure notifications

Required GitHub Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Environment Configuration

### `.env.example`
**Location**: Project root
**Purpose**: Template for local development environment variables

Contains:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENVIRONMENT`

### `.env.production.example`
**Location**: Project root
**Purpose**: Template for production environment variables

Contains:
- Production Supabase configuration
- Environment identifier
- Optional feature flags
- API configuration options

**Note**: Actual values should be set in Vercel dashboard, not committed to git.

## PWA Files (Relevant to Deployment)

### `public/manifest.json`
**Location**: `public/` directory
**Purpose**: PWA manifest file

Configured for:
- App name and description
- Start URL and display mode
- Icons (192x192, 512x512)
- Theme colors
- Orientation preferences

### `public/service-worker.js`
**Location**: `public/` directory
**Purpose**: Service worker for offline functionality

Note: Service worker cache headers configured in `vercel.json` to ensure updates are not cached.

## File Relationships

```
Deployment Flow:
├── Developer pushes code to GitHub
├── .github/workflows/deploy.yml triggers
│   ├── Runs quality checks
│   └── Calls Vercel CLI
├── Vercel reads vercel.json
│   ├── Runs build command from package.json
│   ├── Uses vite.config.ts for build
│   └── Applies .vercelignore exclusions
├── Vercel deploys to production/preview
└── Service worker and manifest.json enable PWA
```

## Maintenance

### Regular Updates

- Review and update security headers in `vercel.json`
- Keep deployment documentation current
- Update GitHub Actions workflow when Node.js/pnpm versions change
- Rotate Vercel API tokens periodically
- Review and optimize chunk splitting in `vite.config.ts`

### When Adding New Features

- Update `.env.example` if new environment variables are needed
- Add new variables to Vercel dashboard
- Update deployment documentation if process changes
- Add new checks to pre-deployment checklist if applicable

## Security Notes

Files that should NEVER be committed:
- `.env.local` - Contains actual secrets
- `.vercel/` - Contains project IDs (gitignored by default)
- Any file with actual API keys or tokens

Files that SHOULD be committed:
- `vercel.json` - Public configuration
- `.env.example` - Template only
- `.vercelignore` - Deployment exclusions
- All documentation files
- GitHub Actions workflow

## Getting Help

If you encounter issues with deployment:

1. Check [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions
2. Review [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md) for common issues
3. Check [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) to verify all requirements
4. For GitHub Actions issues, see [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
5. Check Vercel documentation: https://vercel.com/docs
6. Check GitHub Actions documentation: https://docs.github.com/en/actions

## Next Steps

1. Follow [DEPLOYMENT.md](../DEPLOYMENT.md) to deploy for the first time
2. Set up [GitHub Actions](.github/GITHUB_ACTIONS_SETUP.md) for automatic deployments
3. Use [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) before each deployment
4. Keep [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md) handy for daily use

---

Last updated: January 2026
