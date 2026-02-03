import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI, useTeams } from '@/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/hooks/useOffline';
import { performSync } from '@/services/sync.service';
import { WifiOff, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';

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
  const { synced, syncing, offline } = useSyncStatus();
  const { teams, getActiveTeam } = useTeams();

  const isPlayer = user?.role === 'player';
  const isParent = user?.role === 'parent';
  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';
  const activeTeam = getActiveTeam();

  const handleSync = async () => {
    if (user?.id && !syncing && !offline) {
      await performSync(user.id);
    }
  };

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

    // Coach navigation - matching wireframe structure
    return [
      { name: t('navigation.dashboard'), href: '/coach-dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: t('navigation.schedule'), href: '/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: t('navigation.players'), href: '/players', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Practice Plans', href: '/practice-plans', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { name: t('navigation.drills'), href: '/drills', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { name: t('navigation.reports'), href: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
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
    <div className="min-h-screen bg-navy">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.06] bg-navy-90">
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
        <h1 className="text-lg font-display font-bold uppercase tracking-wider text-white">VolleyQuest</h1>
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
        {/* Sidebar - 220px fixed width */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-40 h-screen w-[220px] border-r border-white/[0.06] bg-navy-90 transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo section - matching wireframe */}
            <div className="px-6 py-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-gradient-to-br from-vq-teal to-vq-teal/70 flex items-center justify-center font-display font-black text-white text-base">
                  VQ
                </div>
                <div className="font-display font-extrabold text-lg uppercase tracking-wide text-white">
                  VolleyQuest
                </div>
              </div>
            </div>

            {/* Navigation - matching wireframe styling */}
            <nav className="flex-1 p-4 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-md text-sm font-display font-semibold uppercase tracking-wide transition-all mb-1',
                      isActive
                        ? 'bg-club-primary text-white shadow-lg shadow-club-primary/30'
                        : 'text-muted-foreground hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    <svg className={cn("w-[18px] h-[18px]", isActive ? "opacity-100" : "opacity-70")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main wrapper for topbar and content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Topbar - 60px height, hidden on mobile */}
          <header className="hidden lg:flex fixed top-0 left-[220px] right-0 h-[60px] bg-navy-90 border-b border-white/[0.06] items-center justify-between px-6 z-30">
            {/* Left: Team selector */}
            {isCoach && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 bg-navy-80 px-4 py-2 rounded-md border border-white/10 hover:border-club-primary transition-colors">
                    <div className="w-7 h-7 rounded-md bg-club-primary flex items-center justify-center font-display font-extrabold text-xs text-white">
                      {activeTeam?.name?.substring(0, 2).toUpperCase() || 'T'}
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="font-display font-bold text-sm uppercase tracking-wide text-white leading-tight">
                        {activeTeam?.name || t('team.selectTeam')}
                      </div>
                      {activeTeam?.season?.name && (
                        <div className="text-xs text-white/60">
                          {activeTeam.season.name}
                        </div>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/60 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>{t('team.selectTeam')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {teams.map((team) => (
                    <DropdownMenuItem key={team.id} asChild>
                      <Link to={`/teams/${team.id}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-club-primary/20 flex items-center justify-center font-display font-bold text-xs text-club-primary">
                            {team.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            {team.season?.name && <div className="text-xs text-muted-foreground">{team.season.name}</div>}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/teams">{t('team.viewAll')}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Right: Sync button and user menu */}
            <div className="flex items-center gap-4">
              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={syncing || offline}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-display font-semibold uppercase tracking-wide transition-all',
                  offline
                    ? 'bg-white/[0.03] text-white/50 cursor-not-allowed border border-white/5'
                    : syncing
                    ? 'bg-vq-teal/10 text-vq-teal border border-vq-teal/20'
                    : 'bg-vq-teal/10 text-vq-teal border border-vq-teal/20 hover:bg-vq-teal/20'
                )}
              >
                {offline ? (
                  <WifiOff className="w-4 h-4" />
                ) : syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : synced ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden xl:inline">
                  {offline
                    ? t('offline.status.offline')
                    : syncing
                    ? t('offline.status.syncing')
                    : synced
                    ? t('offline.status.synced')
                    : t('offline.syncNow')}
                </span>
              </button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-navy-70 flex items-center justify-center font-display font-bold text-sm text-vq-teal">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
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
          </header>

          {/* Main content area */}
          <main className="flex-1 lg:mt-[60px] p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
