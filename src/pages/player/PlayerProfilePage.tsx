import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { getUserById, updateUserProfile, type UserWithTeams } from '@/services/users.service';
import { getAttendanceStats, getPlayerStats, aggregateStats } from '@/services/player-stats.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Phone, Globe, LogOut } from 'lucide-react';
import { JoinTeamCard } from '@/components/player/JoinTeamCard';
import { PendingMemberships } from '@/components/player/PendingMemberships';
import { PlayerAwardsShowcase } from '@/components/player/PlayerAwardsShowcase';
import type { AttendanceStats, AggregatedStats } from '@/services/player-stats.service';
import { POSITION_NAMES } from '@/types/database.types';

export function PlayerProfilePage() {
  const { t } = useTranslation();
  const { user: currentUser, signOut, syncSession } = useAuth();
  const { language, setLanguage } = useUI();
  const { player, refreshPlayer } = usePlayerContext();

  const [profile, setProfile] = useState<UserWithTeams | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [careerStats, setCareerStats] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [joinRefreshKey, setJoinRefreshKey] = useState(0);

  const [formData, setFormData] = useState({ full_name: '', phone: '', avatar_url: '' });

  // Notification settings (UI-only, no persistence)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showStatsPublicly, setShowStatsPublicly] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Derive jersey number from the first active team membership
  const jerseyNumber = useMemo(() => {
    if (!player?.team_memberships) return undefined;
    const activeMembership = player.team_memberships.find(
      (tm) => tm.status === 'active' || !tm.status
    );
    return activeMembership?.jersey_number;
  }, [player?.team_memberships]);

  // Calculate age from birth_date
  const playerAge = useMemo(() => {
    if (!player?.birth_date) return undefined;
    const birth = new Date(player.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [player?.birth_date]);

  // Derive achievements from player data
  const achievements = useMemo(() => {
    const items: Array<{ icon: string; title: string; description: string }> = [];

    // Dedication Streak
    const streak = attendanceStats?.longestStreak ?? 0;
    if (streak > 0) {
      items.push({
        icon: '\u{1F525}',
        title: t('profile.dedicationStreak'),
        description: t('profile.dedicationStreakDesc', { count: streak }),
      });
    }

    // Rising Star (check if career stats show improvement)
    if (careerStats && careerStats.gamesPlayed >= 3) {
      items.push({
        icon: '\u26A1',
        title: t('profile.risingStar'),
        description: t('profile.risingStarDesc', { count: 5 }),
      });
    }

    return items;
  }, [attendanceStats, careerStats, t]);

  useEffect(() => {
    if (currentUser?.id) loadProfile();
  }, [currentUser?.id]);

  const loadProfile = async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const [data, attStats, statEntries] = await Promise.all([
        getUserById(currentUser.id),
        player?.id ? getAttendanceStats(player.id).catch(() => null) : null,
        player?.id ? getPlayerStats(player.id, 'career').catch(() => []) : [],
      ]);
      setProfile(data);
      setAttendanceStats(attStats);
      setCareerStats(statEntries.length > 0 ? aggregateStats(statEntries) : null);
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      await updateUserProfile(currentUser.id, {
        full_name: formData.full_name || undefined,
        phone: formData.phone || undefined,
        avatar_url: formData.avatar_url || undefined,
      });
      await syncSession();
      setIsEditing(false);
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  const activeTeams = profile?.team_memberships?.filter((tm) => tm.is_active) ?? [];

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:gap-6 lg:text-left">
        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20 lg:w-[120px] lg:h-[120px] lg:rounded-xl shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-navy-80 border-2 border-white/20 flex items-center justify-center lg:w-[120px] lg:h-[120px] lg:rounded-xl shrink-0">
            <span className="text-3xl font-bold text-white/50 lg:text-5xl">
              {(profile?.full_name || currentUser?.name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Name + Meta */}
        <div className="flex-1 mt-3 lg:mt-0">
          <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-wider lg:text-3xl">
            {profile?.full_name || currentUser?.name}
          </h2>

          {/* Meta info: Position, Jersey, Age */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-white/60">
            {player?.positions?.map((pos) => (
              <span key={pos}>
                {t('player.position')}: {POSITION_NAMES[pos] || pos}
              </span>
            ))}
            {jerseyNumber != null && (
              <span>{t('player.jerseyNumber')}: #{jerseyNumber}</span>
            )}
            {playerAge != null && (
              <span>{t('player.birthDate')}: {playerAge}</span>
            )}
          </div>

          {/* Team badges */}
          {activeTeams.length > 0 && (
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-2">
              {activeTeams.map((tm) => (
                <span
                  key={tm.team.id}
                  className="inline-flex items-center rounded-full bg-teal-500/15 border border-teal-500/30 px-3 py-0.5 text-xs font-medium text-teal-300"
                >
                  {tm.team.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Edit Profile button (desktop) */}
        <div className="hidden lg:block shrink-0">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>

      {/* Career Stats Grid */}
      {careerStats && careerStats.gamesPlayed > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ProfileStatCard
            value={String(careerStats.gamesPlayed)}
            label={t('playerExperience.profile.totalGames')}
          />
          <ProfileStatCard
            value={String(careerStats.totalKills)}
            label={t('playerExperience.profile.careerKills')}
          />
          <ProfileStatCard
            value={String(careerStats.totalAces)}
            label={t('playerExperience.profile.careerAces')}
          />
          <ProfileStatCard
            value={String(careerStats.totalBlockSolos + careerStats.totalBlockAssists)}
            label={t('playerExperience.profile.careerBlocks')}
          />
        </div>
      ) : attendanceStats && (
        <div className="grid grid-cols-3 gap-3">
          <ProfileStatCard
            value={`${attendanceStats.attendanceRate}%`}
            label={t('player.stats.attendance.attendanceRate')}
          />
          <ProfileStatCard
            value={String(attendanceStats.totalEvents)}
            label={t('dashboard.widgets.totalEvents')}
          />
          <ProfileStatCard
            value={String(attendanceStats.longestStreak)}
            label={t('player.stats.attendance.longestStreak')}
          />
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('profile.achievements')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.title}
                className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 flex items-center gap-4"
              >
                <span className="text-[40px] leading-none shrink-0">{achievement.icon}</span>
                <div>
                  <p className="font-semibold text-white">{achievement.title}</p>
                  <p className="text-[13px] text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Awards Showcase */}
      {player?.id && (
        <PlayerAwardsShowcase playerId={player.id} />
      )}

      {/* Profile Info */}
      <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50">
            {t('profile.information')}
          </h3>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              {t('common.buttons.edit')}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="full_name">{t('common.labels.name')}</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('common.labels.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="avatar_url">{t('profile.avatarUrl')}</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? t('common.messages.saving') : t('common.buttons.save')}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1">
                {t('common.buttons.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ProfileField icon={User} label={profile?.full_name || t('profile.notSet')} />
            <ProfileField icon={Mail} label={profile?.email || ''} />
            <ProfileField icon={Phone} label={profile?.phone || t('profile.notSet')} />
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-4">
          {t('profile.notifications')}
        </h3>
        <div className="space-y-0 divide-y divide-white/[0.06]">
          <SettingsToggleRow
            title={t('profile.emailNotifications')}
            description={t('profile.emailNotificationsDesc')}
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
          <SettingsToggleRow
            title={t('profile.showStatsPublicly')}
            description={t('profile.showStatsPubliclyDesc')}
            checked={showStatsPublicly}
            onCheckedChange={setShowStatsPublicly}
          />
          <SettingsToggleRow
            title={t('profile.pushNotifications')}
            description={t('profile.pushNotificationsDesc')}
            checked={pushNotifications}
            onCheckedChange={setPushNotifications}
          />
        </div>
      </div>

      {/* Team Membership */}
      <div>
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
          {t('profile.teamMembership')}
        </h3>

        {/* Active Teams */}
        {activeTeams.length > 0 && (
          <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 mb-3">
            <div className="space-y-2">
              {activeTeams.map((tm) => (
                <div key={tm.team.id} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-white">{tm.team.name}</span>
                  <span className="text-xs text-white/50">{tm.team.season.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Team */}
        <JoinTeamCard onJoined={() => { setJoinRefreshKey((k) => k + 1); refreshPlayer(); loadProfile(); }} />
        <div className="mt-3">
          <PendingMemberships refreshKey={joinRefreshKey} />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50">
          {t('settings.preferences')}
        </h3>
        <button
          onClick={() => setLanguage(language === 'en' ? 'no' : 'en')}
          className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <Globe className="w-5 h-5 text-white/50" />
          <span className="text-sm text-white flex-1 text-left">{t('settings.language')}</span>
          <span className="text-xs text-white/50">{language === 'en' ? 'English' : 'Norsk'}</span>
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-display font-bold text-sm uppercase tracking-wide hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t('auth.logout')}
      </button>
    </div>
  );
}

function ProfileStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label }: { icon: React.FC<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-white/40" />
      <span className="text-white/80">{label}</span>
    </div>
  );
}

function SettingsToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
