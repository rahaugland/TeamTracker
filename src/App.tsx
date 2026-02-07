import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from '@/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/toast';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { PageLoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToastStore } from '@/hooks/useToast';
import { startAutoSync, stopAutoSync, performSync } from '@/services/sync.service';
import { PlayerContextProvider } from '@/hooks/usePlayerContext';

// Eagerly loaded pages (authentication and critical paths)
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { RoleSelectionPage } from '@/pages/RoleSelectionPage';

// Lazy loaded pages (route-level code splitting)
const JoinTeamPage = lazy(() => import('@/pages/JoinTeamPage').then(m => ({ default: m.JoinTeamPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PlayerDashboardPage = lazy(() => import('@/pages/PlayerDashboardPage').then(m => ({ default: m.PlayerDashboardPage })));
const ParentDashboardPage = lazy(() => import('@/pages/ParentDashboardPage').then(m => ({ default: m.ParentDashboardPage })));
const TeamsPage = lazy(() => import('@/pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const TeamDetailPage = lazy(() => import('@/pages/TeamDetailPage').then(m => ({ default: m.TeamDetailPage })));
const SeasonsPage = lazy(() => import('@/pages/SeasonsPage').then(m => ({ default: m.SeasonsPage })));
const PlayersPage = lazy(() => import('@/pages/PlayersPage').then(m => ({ default: m.PlayersPage })));
const PlayerDetailPage = lazy(() => import('@/pages/PlayerDetailPage').then(m => ({ default: m.PlayerDetailPage })));
const CreatePlayerPage = lazy(() => import('@/pages/CreatePlayerPage').then(m => ({ default: m.CreatePlayerPage })));
const EditPlayerPage = lazy(() => import('@/pages/EditPlayerPage').then(m => ({ default: m.EditPlayerPage })));
const SchedulePage = lazy(() => import('@/pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const DrillsPage = lazy(() => import('@/pages/DrillsPage').then(m => ({ default: m.DrillsPage })));
const DrillDetailPage = lazy(() => import('@/pages/DrillDetailPage').then(m => ({ default: m.DrillDetailPage })));
const CreateDrillPage = lazy(() => import('@/pages/CreateDrillPage').then(m => ({ default: m.CreateDrillPage })));
const EditDrillPage = lazy(() => import('@/pages/EditDrillPage').then(m => ({ default: m.EditDrillPage })));
const PracticePlansPage = lazy(() => import('@/pages/PracticePlansPage').then(m => ({ default: m.PracticePlansPage })));
const PracticePlanBuilderPage = lazy(() => import('@/pages/PracticePlanBuilderPage').then(m => ({ default: m.PracticePlanBuilderPage })));
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ImportPage = lazy(() => import('@/pages/ImportPage').then(m => ({ default: m.ImportPage })));
const PlayerStatsPage = lazy(() => import('@/pages/PlayerStatsPage').then(m => ({ default: m.PlayerStatsPage })));
const RecordStatsPage = lazy(() => import('@/pages/RecordStatsPage').then(m => ({ default: m.RecordStatsPage })));
const TeamSeasonsPage = lazy(() => import('@/pages/TeamSeasonsPage').then(m => ({ default: m.TeamSeasonsPage })));
const MatchSelectionPage = lazy(() => import('@/pages/MatchSelectionPage').then(m => ({ default: m.MatchSelectionPage })));

// Player mobile tab pages
const PlayerHomePage = lazy(() => import('@/pages/player/PlayerHomePage').then(m => ({ default: m.PlayerHomePage })));
const PlayerSchedulePage = lazy(() => import('@/pages/player/PlayerSchedulePage').then(m => ({ default: m.PlayerSchedulePage })));
const PlayerStatsTabPage = lazy(() => import('@/pages/player/PlayerStatsTabPage').then(m => ({ default: m.PlayerStatsTabPage })));
const PlayerGoalsPage = lazy(() => import('@/pages/player/PlayerGoalsPage').then(m => ({ default: m.PlayerGoalsPage })));
const PlayerProfilePage = lazy(() => import('@/pages/player/PlayerProfilePage').then(m => ({ default: m.PlayerProfilePage })));

function App() {
  const { syncSession, user } = useAuth();
  const { toasts, removeToast } = useToastStore();

  // Initialize auth session on app load (runs once)
  useEffect(() => {
    syncSession().catch((error) => {
      console.error('Initial session sync error:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start auto-sync when user is logged in
  useEffect(() => {
    if (user?.id) {
      // Initial sync
      performSync(user.id).catch((error) => {
        console.error('Initial sync error:', error);
      });

      // Start auto-sync every 2 minutes
      startAutoSync(user.id, 120000);

      return () => {
        stopAutoSync();
      };
    }
  }, [user?.id]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineIndicator />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/select-role" element={<RoleSelectionPage />} />
            <Route
              path="/join-team"
              element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <JoinTeamPage />
                </Suspense>
              }
            />

            {/* Routes with AppShell */}
            <Route element={<AppShellWrapper />}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
              {/* Player tab routes wrapped in PlayerContextProvider */}
              <Route element={<PlayerContextWrapper />}>
                <Route
                  path="/player/home"
                  element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PlayerHomePage />
                    </Suspense>
                  }
                />
                <Route
                  path="/player/schedule"
                  element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PlayerSchedulePage />
                    </Suspense>
                  }
                />
                <Route
                  path="/player/stats"
                  element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PlayerStatsTabPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/player/goals"
                  element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PlayerGoalsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/player/profile"
                  element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PlayerProfilePage />
                    </Suspense>
                  }
                />
              </Route>
              {/* Backwards compat redirect */}
              <Route path="/player-dashboard" element={<Navigate to="/player/home" replace />} />
              <Route
                path="/parent-dashboard"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <ParentDashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/coach-dashboard"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/seasons"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <SeasonsPage />
                  </Suspense>
                }
              />
              <Route
                path="/teams"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <TeamsPage />
                  </Suspense>
                }
              />
              <Route
                path="/teams/:id"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <TeamDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="/players"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <PlayersPage />
                  </Suspense>
                }
              />
              <Route
                path="/players/new"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <CreatePlayerPage />
                  </Suspense>
                }
              />
              <Route
                path="/players/:id"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <PlayerDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="/players/:id/edit"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <EditPlayerPage />
                  </Suspense>
                }
              />
              <Route
                path="/players/:id/stats"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <PlayerStatsPage />
                  </Suspense>
                }
              />
              <Route
                path="/schedule"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <SchedulePage />
                  </Suspense>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <EventDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="/teams/:teamId/team-seasons"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <TeamSeasonsPage />
                  </Suspense>
                }
              />
              <Route
                path="/events/:id/stats"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <RecordStatsPage />
                  </Suspense>
                }
              />
              <Route
                path="/events/:eventId/lineup"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <MatchSelectionPage />
                  </Suspense>
                }
              />
              <Route
                path="/drills"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <DrillsPage />
                  </Suspense>
                }
              />
              <Route
                path="/drills/new"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <CreateDrillPage />
                  </Suspense>
                }
              />
              <Route
                path="/drills/:id"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <DrillDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="/drills/:id/edit"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <EditDrillPage />
                  </Suspense>
                }
              />
              <Route
                path="/practice-plans"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <PracticePlansPage />
                  </Suspense>
                }
              />
              <Route
                path="/practice-plans/:id"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <PracticePlanBuilderPage />
                  </Suspense>
                }
              />
              <Route
                path="/users"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <UserManagementPage />
                  </Suspense>
                }
              />
              <Route
                path="/profile"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <ProfilePage />
                  </Suspense>
                }
              />
              <Route
                path="/import"
                element={
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <ImportPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Analytics />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/**
 * Dashboard redirect component
 * Redirects users to role-specific dashboards
 */
function DashboardRedirect() {
  const { user } = useAuth();

  if (!user?.role) {
    return <Navigate to="/select-role" replace />;
  }

  switch (user.role) {
    case 'player':
      return <Navigate to="/player/home" replace />;
    case 'parent':
      return <Navigate to="/parent-dashboard" replace />;
    case 'head_coach':
    case 'assistant_coach':
      return <Navigate to="/coach-dashboard" replace />;
    default:
      return <Navigate to="/select-role" replace />;
  }
}

/**
 * Wrapper to apply AppShell to nested routes
 * Uses Outlet to render child routes from parent Routes
 */
function AppShellWrapper() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/**
 * Wrapper providing PlayerContext to player tab routes
 */
function PlayerContextWrapper() {
  return (
    <PlayerContextProvider>
      <Outlet />
    </PlayerContextProvider>
  );
}

export default App;
