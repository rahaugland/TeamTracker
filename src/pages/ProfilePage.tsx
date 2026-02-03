import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getUserById, updateUserProfile, type UserWithTeams } from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Phone, Shield, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { JoinTeamCard } from '@/components/player/JoinTeamCard';
import { PendingMemberships } from '@/components/player/PendingMemberships';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user: currentUser, syncSession } = useAuth();
  const isPlayer = currentUser?.role === 'player';
  const [joinRefreshKey, setJoinRefreshKey] = useState(0);

  const [profile, setProfile] = useState<UserWithTeams | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (currentUser?.id) {
      loadProfile();
    }
  }, [currentUser?.id]);

  const loadProfile = async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserById(currentUser.id);
      setProfile(data);
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await updateUserProfile(currentUser.id, {
        full_name: formData.full_name || undefined,
        phone: formData.phone || undefined,
        avatar_url: formData.avatar_url || undefined,
      });

      // Sync session to update the user in the store
      await syncSession();

      setSuccess(t('profile.updateSuccess'));
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(t('profile.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'head_coach':
        return 'default';
      case 'assistant_coach':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-muted-foreground">
          {t('common.messages.loading')}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('profile.notFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const allTeams = [
    ...(profile.coach_assignments?.map((ca) => ({
      name: ca.team.name,
      seasonName: ca.team.season.name,
      role: t(`users.roles.${ca.role}`),
    })) || []),
    ...(profile.team_memberships
      ?.filter((tm) => tm.is_active)
      .map((tm) => ({
        name: tm.team.name,
        seasonName: tm.team.season.name,
        role: t(`player.roles.${tm.role}`),
      })) || []),
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('profile.description')}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('profile.information')}</CardTitle>
                <CardDescription>{t('profile.informationDescription')}</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  {t('common.buttons.edit')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('common.labels.name')}</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder={t('profile.namePlaceholder')}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.full_name || t('profile.notSet')}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.labels.email')}</Label>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('profile.emailNotEditable')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('common.labels.phone')}</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={t('profile.phonePlaceholder')}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone || t('profile.notSet')}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">{t('profile.avatarUrl')}</Label>
              {isEditing ? (
                <Input
                  id="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  placeholder={t('profile.avatarUrlPlaceholder')}
                />
              ) : (
                <div className="text-sm">
                  {profile.avatar_url ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <span className="text-muted-foreground truncate">
                        {profile.avatar_url}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t('profile.notSet')}</span>
                  )}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? t('common.messages.saving') : t('common.buttons.save')}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  {t('common.buttons.cancel')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('profile.roleAndPermissions')}
            </CardTitle>
            <CardDescription>{t('profile.roleDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t('users.role')}</Label>
              <div>
                <Badge variant={getRoleBadgeVariant(profile.role)} className="text-sm">
                  {t(`users.roles.${profile.role}`)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('profile.roleChangeNote')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Teams Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('profile.myTeams')}
            </CardTitle>
            <CardDescription>{t('profile.teamsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {allTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('users.noTeams')}</p>
            ) : (
              <div className="space-y-3">
                {allTeams.map((team, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.seasonName} • {team.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Team & Pending Requests (players only) */}
        {isPlayer && (
          <>
            <JoinTeamCard onJoined={() => {
              setJoinRefreshKey((k) => k + 1);
              loadProfile();
            }} />
            <PendingMemberships refreshKey={joinRefreshKey} />
          </>
        )}
      </div>
    </div>
  );
}
