import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, BarChart3, Target, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'home', href: '/player/home', icon: Home },
  { key: 'schedule', href: '/player/schedule', icon: Calendar },
  { key: 'stats', href: '/player/stats', icon: BarChart3 },
  { key: 'goals', href: '/player/goals', icon: Target },
  { key: 'profile', href: '/player/profile', icon: User },
] as const;

const i18nKeys: Record<string, string> = {
  home: 'navigation.home',
  schedule: 'navigation.schedule',
  stats: 'navigation.stats',
  goals: 'navigation.goals',
  profile: 'navigation.profile',
};

export function PlayerBottomTabBar() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-navy-90 border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ key, href, icon: Icon }) => {
          const isActive = location.pathname.startsWith(href);
          return (
            <Link
              key={key}
              to={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-lg transition-colors',
                isActive
                  ? 'text-club-primary'
                  : 'text-white/50 active:text-white/70'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-6 rounded-full transition-colors',
                  isActive && 'bg-club-primary/10'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-display font-semibold uppercase tracking-wide leading-tight">
                {t(i18nKeys[key])}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
