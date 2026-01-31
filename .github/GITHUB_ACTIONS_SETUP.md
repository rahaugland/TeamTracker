# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automatic deployment to Vercel.

## Overview

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automates:

1. Code quality checks (TypeScript, linting, build verification)
2. Automatic deployment to Vercel on push to main
3. Preview deployments for pull requests
4. PR comments with preview URLs

## Prerequisites

- GitHub repository with TeamTracker code
- Vercel account with project created
- Vercel CLI installed locally

## Step 1: Get Vercel Credentials

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project (run from project root):
   ```bash
   vercel link
   ```

   Follow the prompts to link to your existing Vercel project or create a new one.

4. Extract the required IDs:
   ```bash
   cat .vercel/project.json
   ```

   This will show your `projectId` and `orgId`.

### Option B: Manual Retrieval

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token:
   - Name: `GitHub Actions - TeamTracker`
   - Scope: Full Account
   - Expiration: No expiration (or as per your security policy)
   - Click "Create"
   - Copy and save the token immediately (you won't see it again)

3. Get your Organization ID:
   - Go to Vercel dashboard
   - Click on your avatar → Account Settings
   - Scroll to "Your ID" or "Organization ID"
   - Copy the ID

4. Get your Project ID:
   - Go to your TeamTracker project in Vercel
   - Click Settings
   - Scroll to "Project ID"
   - Copy the ID

## Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these three secrets:

### Secret 1: VERCEL_TOKEN

- **Name**: `VERCEL_TOKEN`
- **Value**: The token you created in Step 1
- Click **Add secret**

### Secret 2: VERCEL_ORG_ID

- **Name**: `VERCEL_ORG_ID`
- **Value**: Your organization/account ID from Step 1
- Click **Add secret**

### Secret 3: VERCEL_PROJECT_ID

- **Name**: `VERCEL_PROJECT_ID`
- **Value**: Your project ID from Step 1
- Click **Add secret**

## Step 3: Verify Secrets

After adding all secrets, you should see:

```
VERCEL_TOKEN          •••••••••••••••••
VERCEL_ORG_ID         •••••••••••••••••
VERCEL_PROJECT_ID     •••••••••••••••••
```

## Step 4: Test the Workflow

### Test on a Feature Branch

1. Create a test branch:
   ```bash
   git checkout -b test/github-actions
   ```

2. Make a small change (e.g., update README.md)

3. Commit and push:
   ```bash
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin test/github-actions
   ```

4. Go to GitHub → **Actions** tab
5. You should see a workflow run starting
6. Wait for it to complete (takes 2-5 minutes)

### Create a Pull Request

1. On GitHub, create a PR from your test branch to main
2. GitHub Actions will:
   - Run quality checks
   - Deploy a preview to Vercel
   - Comment on the PR with the preview URL

### Test Production Deployment

1. Merge the PR to main (or push directly to main)
2. GitHub Actions will:
   - Run quality checks
   - Deploy to production on Vercel
   - Run post-deployment tests

## Workflow Breakdown

The workflow has three jobs:

### 1. Quality Checks
Runs on every push and PR:
- TypeScript compilation check
- ESLint
- Build verification
- Checks that build output is valid

### 2. Deploy
Runs after quality checks pass:
- Installs Vercel CLI
- Pulls Vercel environment configuration
- Builds the project
- Deploys to Vercel (production or preview)
- Comments on PR with preview URL (for PRs only)

### 3. Post-Deploy Tests
Runs after production deployment:
- Runs test suite
- Performs health checks
- Continues even if tests fail (won't block deployment)

## Customization

### Change Deployment Triggers

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main
      - staging  # Add more branches
  pull_request:
    branches:
      - main
```

### Disable Preview Deployments

Comment out the PR trigger:

```yaml
on:
  push:
    branches:
      - main
  # pull_request:
  #   branches:
  #     - main
```

### Add More Quality Checks

Add additional steps in the `quality-checks` job:

```yaml
- name: Run custom validation
  run: pnpm run validate

- name: Check bundle size
  run: pnpm run size-check
```

### Skip Workflow for Specific Commits

Add `[skip ci]` or `[ci skip]` to your commit message:

```bash
git commit -m "Update docs [skip ci]"
```

## Troubleshooting

### Workflow Fails with "Resource not accessible by integration"

**Problem**: GitHub Actions doesn't have permission to comment on PRs

**Solution**:
1. Go to repo Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Save

### Workflow Fails with "Invalid token"

**Problem**: Vercel token is incorrect or expired

**Solution**:
1. Create a new Vercel token
2. Update `VERCEL_TOKEN` secret in GitHub
3. Re-run the workflow

### Workflow Fails with "Project not found"

**Problem**: `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID` is incorrect

**Solution**:
1. Run `vercel link` locally
2. Check `.vercel/project.json` for correct IDs
3. Update secrets in GitHub
4. Re-run the workflow

### Build Fails in GitHub Actions but Works Locally

**Problem**: Environment differences between local and CI

**Solution**:
1. Check Node.js version in workflow (currently 20)
2. Ensure pnpm version matches (currently 10.24.0)
3. Check if any dependencies require specific environment variables
4. Review workflow logs for specific error messages

### Deployment Succeeds but Site Shows Old Version

**Problem**: Vercel cache or deployment targeting wrong environment

**Solution**:
1. Check which branch triggered the deployment
2. In Vercel dashboard, verify which deployment is in production
3. Check environment variables are set correctly in Vercel
4. Manually promote correct deployment in Vercel dashboard

## Security Best Practices

1. **Never commit secrets to git**
   - `.env.local` is in `.gitignore`
   - Only use GitHub Secrets for sensitive data

2. **Limit token scope**
   - Use project-specific tokens when possible
   - Set token expiration if your security policy requires it

3. **Rotate tokens regularly**
   - Update `VERCEL_TOKEN` every 90 days
   - Update GitHub secret when rotating

4. **Review workflow permissions**
   - Only grant necessary permissions
   - Regularly audit who has access to repository secrets

5. **Monitor workflow runs**
   - Check Actions tab regularly
   - Set up notifications for failed deployments

## Monitoring Deployments

### GitHub Actions Tab

- Shows all workflow runs
- Click on a run to see detailed logs
- Green checkmark = success, Red X = failure

### Vercel Dashboard

- Shows all deployments
- Click deployment to see build logs
- Production deployments marked with icon

### PR Comments

For pull requests, GitHub Actions automatically comments with:
- Preview deployment URL
- Build status
- Timestamp

## Disabling GitHub Actions

If you prefer manual deployments:

1. Delete `.github/workflows/deploy.yml`
2. Or rename it to `deploy.yml.disabled`
3. Use manual deployment: `pnpm run deploy`

## Next Steps

After setting up:

1. Test a full deployment cycle (feature branch → PR → merge → production)
2. Verify preview URLs work correctly
3. Check that production deployments succeed
4. Set up Slack/email notifications for deployment status (optional)
5. Document any custom deployment procedures for your team

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [GitHub Actions + Vercel Guide](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)

---

Last updated: January 2026
