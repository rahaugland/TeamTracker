import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import { getTeamByInviteCode, joinTeamByCode } from '@/services/teams.service';
import { performSync } from '@/services/sync.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamWithSeason } from '@/services/teams.service';

/**
 * Join Team Page
 * Allows players and parents to join a team using an invite code
 */
export function JoinTeamPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, syncSession } = useAuth();
  const { addNotification } = useUI();

  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [validatedTeam, setValidatedTeam] = useState<TeamWithSeason | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidateCode = async () => {
    if (!inviteCode.trim()) return;

    setIsValidating(true);
    setError(null);
    setValidatedTeam(null);

    try {
      const team = await getTeamByInviteCode(inviteCode.trim());

      if (!team) {
        setError(t('joinTeam.invalidCode'));
      } else {
        setValidatedTeam(team);
      }
    } catch (err) {
      console.error('Error validating invite code:', err);
      setError(t('joinTeam.invalidCode'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!validatedTeam || !user) return;

    setIsJoining(true);
    setError(null);

    try {
      await joinTeamByCode(inviteCode.trim(), user.name, user.email);

      // Sync session and pull new data into IndexedDB
      await syncSession();
      await performSync(user.id);

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: t('joinTeam.joinPending', { teamName: validatedTeam.name }),
        duration: 7000,
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error joining team:', err);

      if (err.code === '23505' || err.code === 'P0002') {
        setError(t('joinTeam.alreadyMember'));
      } else {
        setError(t('joinTeam.joinError'));
      }

      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error || t('joinTeam.joinError'),
        duration: 5000,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInviteCode(value);
    setValidatedTeam(null);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inviteCode.trim() && !validatedTeam) {
      handleValidateCode();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('joinTeam.title')}</CardTitle>
            <CardDescription>{t('joinTeam.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">{t('joinTeam.enterCode')}</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder={t('joinTeam.codePlaceholder')}
                  value={inviteCode}
                  onChange={handleCodeInputChange}
                  onKeyPress={handleKeyPress}
                  maxLength={6}
                  className="text-lg text-center tracking-wider font-mono uppercase"
                  disabled={isValidating || isJoining}
                  autoFocus
                />
              </div>

              {!validatedTeam && (
                <Button
                  onClick={handleValidateCode}
                  disabled={!inviteCode.trim() || isValidating}
                  className="w-full"
                >
                  {isValidating ? t('joinTeam.validating') : t('joinTeam.validateCode')}
                </Button>
              )}

              {error && (
                <div className="p-3 bg-club-primary/10 border border-club-primary/30 rounded-md">
                  <p className="text-sm text-club-primary">{error}</p>
                </div>
              )}

              {validatedTeam && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-md space-y-2">
                    <p className="font-semibold text-emerald-400">
                      {t('joinTeam.teamFound')}
                    </p>
                    <p className="text-sm text-emerald-400/80">
                      {t('joinTeam.teamName', { teamName: validatedTeam.name })}
                    </p>
                    <p className="text-sm text-emerald-400/80">
                      {t('joinTeam.seasonName', { seasonName: validatedTeam.season.name })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleJoinTeam}
                      disabled={isJoining}
                      className="w-full"
                      size="lg"
                    >
                      {isJoining ? t('joinTeam.joining') : t('joinTeam.confirmJoin')}
                    </Button>
                    <Button
                      onClick={() => {
                        setValidatedTeam(null);
                        setInviteCode('');
                      }}
                      variant="outline"
                      className="w-full"
                      disabled={isJoining}
                    >
                      {t('common.buttons.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{t('joinTeam.instructions')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
