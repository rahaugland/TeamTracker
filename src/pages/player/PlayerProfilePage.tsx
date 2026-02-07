import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { getUserById, updateUserProfile, type UserWithTeams } from '@/services/users.service';
import { getAttendanceStats } from '@/services/player-stats.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Globe, LogOut } from 'lucide-react';
import { JoinTeamCard } from '@/components/player/JoinTeamCard';
import { PendingMemberships } from '@/components/player/PendingMemberships';
import type { AttendanceStats } from '@/services/player-stats.service';

export function PlayerProfilePage() {
  const { t } = useTranslation();
  const { user: currentUser, signOut, syncSession } = useAuth();
  const { language, setLanguage } = useUI();
  const { player, refreshPlayer } = usePlayerContext();

  const [profile, setProfile] = useState<UserWithTeams | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [joinRefreshKey, setJoinRefreshKey] = useState(0);

  const [formData, setFormData] = useState({ full_name: '', phone: '', avatar_url: '' });

  useEffect(() => {
    if (currentUser?.id) loadProfile();
  }, [currentUser?.id]);

  const loadProfile = async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const [data, attStats] = await Promise.all([
        getUserById(currentUser.id),
        player?.id ? getAttendanceStats(player.id).catch(() => null) : null,
      ]);
      setProfile(data);
      setAttendanceStats(attStats);
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-navy-80 border-2 border-white/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-white/50">
              {(profile?.full_name || currentUser?.name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h2 className="text-xl font-display font-bold text-white mt-3">
          {profile?.full_name || currentUser?.name}
        </h2>
        <Badge variant="outline" className="mt-1">
          {t('users.roles.player')}
        </Badge>
      </div>

      {/* Career Stats Grid */}
      {attendanceStats && (
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

      {/* Teams */}
      {profile?.team_memberships && profile.team_memberships.filter((tm) => tm.is_active).length > 0 && (
        <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('profile.myTeams')}
          </h3>
          <div className="space-y-2">
            {profile.team_memberships
              .filter((tm) => tm.is_active)
              .map((tm) => (
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
      <PendingMemberships refreshKey={joinRefreshKey} />

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
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-white/50">
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
