/**
 * Preload utilities for lazy-loaded routes
 * Allows predictive loading of routes the user is likely to visit next
 */

// Map of route paths to their lazy load functions
const routePreloadMap: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/pages/DashboardPage'),
  '/player-dashboard': () => import('@/pages/PlayerDashboardPage'),
  '/parent-dashboard': () => import('@/pages/ParentDashboardPage'),
  '/teams': () => import('@/pages/TeamsPage'),
  '/players': () => import('@/pages/PlayersPage'),
  '/schedule': () => import('@/pages/SchedulePage'),
  '/drills': () => import('@/pages/DrillsPage'),
  '/practice-plans': () => import('@/pages/PracticePlansPage'),
  '/import': () => import('@/pages/ImportPage'),
};

/**
 * Preload a route's component before navigation
 * @param path - The route path to preload
 */
export function preloadRoute(path: string): void {
  const loader = routePreloadMap[path];
  if (loader) {
    // Start loading the component
    loader().catch((error) => {
      console.warn(`Failed to preload route ${path}:`, error);
    });
  }
}

/**
 * Preload multiple routes
 * @param paths - Array of route paths to preload
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach((path) => preloadRoute(path));
}

/**
 * Preload routes based on user role
 * @param role - User role (coach, player, parent)
 */
export function preloadRoleBasedRoutes(role: string): void {
  const commonRoutes = ['/schedule', '/profile'];

  switch (role) {
    case 'head_coach':
    case 'assistant_coach':
      preloadRoutes([
        '/dashboard',
        '/teams',
        '/players',
        '/drills',
        '/practice-plans',
        ...commonRoutes,
      ]);
      break;
    case 'player':
      preloadRoutes(['/player-dashboard', ...commonRoutes]);
      break;
    case 'parent':
      preloadRoutes(['/parent-dashboard', ...commonRoutes]);
      break;
  }
}

/**
 * Setup hover preloading for navigation links
 * Call this on navigation link hover to preload the target route
 */
export function setupHoverPreload(): void {
  // This can be called from navigation components
  // to preload routes when user hovers over links
  if (typeof window !== 'undefined') {
    document.addEventListener(
      'mouseover',
      (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a[href^="/"]');
        if (link) {
          const path = link.getAttribute('href');
          if (path) {
            preloadRoute(path);
          }
        }
      },
      { passive: true }
    );
  }
}
