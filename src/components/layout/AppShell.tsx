import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSyncStatus, useLastSyncFormatted } from '@/hooks/useOffline';
import { performSync } from '@/services/sync.service';
import { WifiOff, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell component
 * Main application layout with sidebar navigation and header
 */
export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { sidebarOpen, setSidebarOpen, language, setLanguage } = useUI();
  const { synced, syncing, error, offline, pendingCount } = useSyncStatus();
  const lastSyncFormatted = useLastSyncFormatted();

  const isPlayer = user?.role === 'player';
  const isParent = user?.role === 'parent';

  const handleSync = async () => {
    if (user?.id && !syncing && !offline) {
      await performSync(user.id);
    }
  };

  const isHeadCoach = user?.role === 'head_coach';

  // Role-based navigation
  const getNavigation = () => {
    if (isPlayer) {
      return [
        { name: t('navigation.dashboard'), href: '/player-dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: t('navigation.schedule'), href: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { name: t('navigation.profile'), href: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ];
    }

    if (isParent) {
      return [
        { name: t('navigation.dashboard'), href: '/parent-dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: t('navigation.schedule'), href: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { name: t('navigation.players'), href: '/players', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { name: t('navigation.profile'), href: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ];
    }

    // Coach navigation
    return [
      { name: t('navigation.dashboard'), href: '/coach-dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: t('season.plural'), href: '/seasons', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: t('navigation.teams'), href: '/teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { name: t('navigation.players'), href: '/players', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: t('navigation.schedule'), href: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: t('navigation.drills'), href: '/drills', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { name: t('navigation.practices'), href: '/practice-plans', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { name: t('navigation.import'), href: '/import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
      ...(isHeadCoach ? [{ name: t('navigation.users'), href: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }] : []),
    ];
  };

  const navigation = getNavigation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'no' : 'en');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b gradient-hero">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-white/10 text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-white">{t('app.name')}</h1>
        <div className="w-8 flex items-center justify-end">
          {offline && (
            <WifiOff className="w-5 h-5 text-white/80" />
          )}
          {!offline && syncing && (
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 border-r border-sidebar-border gradient-sidebar transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-sidebar-border">
              <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
              <p className="text-xs text-sidebar-foreground/70 mt-1">{t('app.tagline')}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Sync status */}
            <div className="p-4 border-t border-sidebar-border">
              <button
                onClick={handleSync}
                disabled={syncing || offline}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  offline
                    ? 'bg-sidebar-accent/50 text-sidebar-foreground/50 cursor-not-allowed'
                    : error
                    ? 'status-error hover:shadow-lg'
                    : syncing
                    ? 'status-info'
                    : synced
                    ? 'status-success hover:shadow-lg'
                    : 'status-warning hover:shadow-lg'
                )}
              >
                {offline ? (
                  <WifiOff className="w-4 h-4" />
                ) : error ? (
                  <AlertCircle className="w-4 h-4" />
                ) : syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : synced ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <CloudOff className="w-4 h-4" />
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">
                    {offline
                      ? t('offline.status.offline')
                      : error
                      ? t('offline.status.error')
                      : syncing
                      ? t('offline.status.syncing')
                      : synced
                      ? t('offline.status.synced')
                      : t('offline.syncNow')}
                  </p>
                  {!offline && !syncing && lastSyncFormatted && (
                    <p className="text-xs opacity-75 truncate">
                      {lastSyncFormatted}
                    </p>
                  )}
                  {pendingCount > 0 && (
                    <p className="text-xs opacity-75 truncate">
                      {t('offline.pendingChanges', { count: pendingCount })}
                    </p>
                  )}
                </div>
              </button>
            </div>

            {/* User menu */}
            <div className="p-4 border-t border-sidebar-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-all text-left">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shadow-lg">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name}</p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('auth.profile.welcome', { name: user?.name })}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">{t('navigation.profile')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleLanguage}>
                    {language === 'en' ? 'Norsk' : 'English'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
