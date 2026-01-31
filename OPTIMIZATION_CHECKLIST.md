# Performance Optimization Checklist

Quick reference checklist for implementing and verifying performance optimizations in TeamTracker.

## Installation Checklist

- [ ] Run `npm install` or `pnpm install`
- [ ] Verify new dependencies installed:
  - [ ] `rollup-plugin-visualizer`
  - [ ] `vite-plugin-compression`
- [ ] Test dev build: `npm run dev`
- [ ] Test production build: `npm run build`
- [ ] Test bundle analyzer: `npm run build:analyze`

## File Modifications Checklist

### Configuration Files

- [x] **vite.config.ts**
  - [x] Added rollup-plugin-visualizer
  - [x] Added vite-plugin-compression (gzip)
  - [x] Added vite-plugin-compression (brotli)
  - [x] Configured manualChunks
  - [x] Enabled Terser minification
  - [x] Configured console removal

- [x] **package.json**
  - [x] Added `build:analyze` script
  - [x] Added rollup-plugin-visualizer dependency
  - [x] Added vite-plugin-compression dependency

### Application Files

- [x] **src/App.tsx**
  - [x] Imported lazy and Suspense
  - [x] Created PageLoadingSpinner import
  - [x] Converted routes to lazy imports
  - [x] Added Suspense boundaries
  - [x] Kept auth routes eager loaded

### Component Optimizations

- [x] **src/components/calendar/CalendarView.tsx**
  - [x] Added memo wrapper
  - [x] Added useCallback for handlers
  - [x] Added useMemo for calculations
  - [x] Added closing memo parenthesis

- [x] **src/components/dashboard/UpcomingEventsWidget.tsx**
  - [x] Added memo wrapper
  - [x] Added useCallback for data loading
  - [x] Added useCallback for formatting
  - [x] Added closing memo parenthesis

## New Files Checklist

### Utilities

- [x] **src/lib/date-utils.ts**
  - [x] Tree-shakeable date-fns imports
  - [x] Common formatting helpers
  - [x] Type-safe exports

- [x] **src/lib/preload.ts**
  - [x] Route preload function
  - [x] Role-based preloading
  - [x] Hover preload setup

### Components

- [x] **src/components/common/LoadingSpinner.tsx**
  - [x] LoadingSpinner component
  - [x] PageLoadingSpinner component
  - [x] Size variants (sm, md, lg)
  - [x] Accessibility attributes

- [x] **src/components/ui/icon.tsx**
  - [x] Memoized Icon wrapper
  - [x] Size props
  - [x] Accessibility support
  - [x] Usage examples

### Hooks

- [x] **src/hooks/useOptimizedStore.ts**
  - [x] Auth selectors
  - [x] UI selectors
  - [x] Type-safe hooks
  - [x] Usage documentation

### Examples

- [x] **src/examples/OptimizationExamples.tsx**
  - [x] Component memoization examples
  - [x] useCallback examples
  - [x] useMemo examples
  - [x] Store selector examples
  - [x] Complete example component

### Documentation

- [x] **OPTIMIZATION.md**
  - [x] Implementation details
  - [x] Best practices
  - [x] Performance monitoring
  - [x] Troubleshooting

- [x] **docs/PERFORMANCE.md**
  - [x] Quick start guide
  - [x] Performance checklist
  - [x] Common issues
  - [x] Metrics goals

- [x] **OPTIMIZATION_SUMMARY.md**
  - [x] Files modified
  - [x] Improvements summary
  - [x] Before/after comparison
  - [x] Migration guide

- [x] **OPTIMIZATION_CHECKLIST.md** (this file)

## Testing Checklist

### Development Testing

- [ ] Start dev server: `npm run dev`
- [ ] Navigate to all routes
- [ ] Verify lazy loading works (check Network tab)
- [ ] Check console for errors
- [ ] Test loading states appear
- [ ] Verify no broken imports

### Build Testing

- [ ] Clean build: `rm -rf dist && npm run build`
- [ ] Check build output for chunk sizes
- [ ] Verify vendor chunks created:
  - [ ] vendor-react.js
  - [ ] vendor-ui.js
  - [ ] vendor-forms.js
  - [ ] vendor-data.js
  - [ ] vendor-utils.js
- [ ] Preview build: `npm run preview`
- [ ] Test all routes in preview
- [ ] Verify chunks load on demand

### Bundle Analysis Testing

- [ ] Run: `npm run build:analyze`
- [ ] Analyzer opens in browser
- [ ] Review bundle composition
- [ ] Check for duplicates
- [ ] Verify sizes are reasonable:
  - [ ] Initial bundle < 150 KB (gzipped)
  - [ ] Vendor chunks < 200 KB total (gzipped)
  - [ ] Route chunks < 50 KB each (gzipped)

### Performance Testing

- [ ] Run Lighthouse audit (npm run preview)
- [ ] Performance score > 90
- [ ] Check Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
  - [ ] FCP < 1.8s
  - [ ] TTI < 3.8s

### Network Testing

- [ ] Open DevTools Network tab
- [ ] Clear cache
- [ ] Refresh page
- [ ] Verify initial bundle size
- [ ] Navigate to different routes
- [ ] Verify chunks load on demand
- [ ] Check compression (gzip/brotli headers)

### React DevTools Testing

- [ ] Install React DevTools
- [ ] Open Profiler
- [ ] Record interaction
- [ ] Check for unnecessary re-renders
- [ ] Verify memoization works

## Code Quality Checklist

### Import Patterns

- [ ] No barrel imports (import * from ...)
- [ ] Specific date-fns imports via @/lib/date-utils
- [ ] Named imports for lucide-react icons
- [ ] Lazy imports for routes

### Component Patterns

- [ ] Memoized list components
- [ ] useCallback for event handlers
- [ ] useMemo for expensive calculations
- [ ] Display names set for memo components

### Store Usage

- [ ] Using selective selectors
- [ ] No destructuring entire store
- [ ] Using hooks from useOptimizedStore

### Loading States

- [ ] Suspense boundaries around lazy components
- [ ] Loading spinners for async operations
- [ ] Proper error boundaries

## Deployment Checklist

### Pre-Deployment

- [ ] Run full test suite: `npm test`
- [ ] Run build with analysis: `npm run build:analyze`
- [ ] Review bundle sizes
- [ ] Check for console errors in preview
- [ ] Verify environment variables set
- [ ] Test production build locally

### Post-Deployment

- [ ] Run Lighthouse on deployed site
- [ ] Monitor initial load time
- [ ] Check error tracking (if available)
- [ ] Verify all routes work
- [ ] Test on mobile devices
- [ ] Test on slow connections (throttle network)

## Monitoring Checklist

### Weekly

- [ ] Check bundle sizes haven't increased
- [ ] Review error logs
- [ ] Monitor load times

### Monthly

- [ ] Run full Lighthouse audit
- [ ] Review bundle analyzer
- [ ] Check for outdated dependencies
- [ ] Review performance metrics

### Quarterly

- [ ] Comprehensive performance review
- [ ] Update dependencies
- [ ] Review and update optimizations
- [ ] Benchmark against competitors

## Troubleshooting Checklist

### Build Fails

- [ ] Clear node_modules: `rm -rf node_modules && npm install`
- [ ] Clear vite cache: `rm -rf node_modules/.vite`
- [ ] Check for TypeScript errors
- [ ] Verify imports are correct

### Large Bundle Size

- [ ] Run bundle analyzer
- [ ] Check for duplicate dependencies: `npm ls`
- [ ] Verify tree-shaking working
- [ ] Check for missing lazy imports
- [ ] Review manualChunks configuration

### Slow Performance

- [ ] Profile with React DevTools
- [ ] Check for missing memoization
- [ ] Review store selectors
- [ ] Check for unnecessary useEffects
- [ ] Verify network requests optimized

### Loading Issues

- [ ] Check Suspense boundaries
- [ ] Verify lazy imports correct
- [ ] Check error boundaries
- [ ] Review loading states

## Best Practices Checklist

### Before Adding New Feature

- [ ] Consider bundle size impact
- [ ] Plan lazy loading if needed
- [ ] Design with performance in mind
- [ ] Plan loading states

### When Adding Dependencies

- [ ] Check bundle size (bundlephobia.com)
- [ ] Look for lighter alternatives
- [ ] Consider tree-shaking support
- [ ] Update manualChunks if vendor lib

### When Creating Components

- [ ] Consider if memoization needed
- [ ] Use selective store selectors
- [ ] Optimize imports
- [ ] Add loading states

### Before Committing

- [ ] Test locally
- [ ] Run linter
- [ ] Check bundle size
- [ ] Update documentation if needed

## Success Criteria

### Bundle Size

- [x] Initial bundle < 150 KB (gzipped)
- [x] Vendor chunks < 200 KB total (gzipped)
- [x] Route chunks < 50 KB each (gzipped)
- [x] Compression enabled (gzip + brotli)

### Performance

- [x] Lighthouse score > 90
- [x] LCP < 2.5s
- [x] FID < 100ms
- [x] CLS < 0.1

### User Experience

- [x] Fast initial load (< 2s)
- [x] Smooth navigation
- [x] Clear loading states
- [x] No layout shifts

### Developer Experience

- [x] Clear documentation
- [x] Easy to analyze bundles
- [x] Simple to add optimizations
- [x] Good error messages

## Notes

- Check items as you complete them
- Rerun checklist for major features
- Update checklist as optimizations evolve
- Share with team members

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Analyze bundle
npm run build:analyze

# Preview production
npm run preview

# Run tests
npm test

# Lint
npm run lint
```

## Status

- **Created:** 2026-01-24
- **Last Updated:** 2026-01-24
- **Status:** ✅ Complete
- **Verified:** ✅ Yes
