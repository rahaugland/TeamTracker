import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getTeamByInviteCode } from '@/services/teams.service';
import { createPlayer, addPlayerToTeam } from '@/services/players.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import type { TeamWithSeason } from '@/services/teams.service';

interface JoinTeamCardProps {
  onJoined?: () => void;
}

export function JoinTeamCard({ onJoined }: JoinTeamCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [validatedTeam, setValidatedTeam] = useState<TeamWithSeason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    } catch {
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
      const player = await createPlayer({
        name: user.name,
        email: user.email,
        user_id: user.id,
        created_by: user.id,
      });

      await addPlayerToTeam({
        player_id: player.id,
        team_id: validatedTeam.id,
        role: 'player',
      });

      setSuccess(t('joinTeam.joinPending', { teamName: validatedTeam.name }));
      setValidatedTeam(null);
      setInviteCode('');
      onJoined?.();
    } catch (err: any) {
      if (err.code === '23505' || err.message === 'ALREADY_MEMBER') {
        setError(t('joinTeam.alreadyMember'));
      } else {
        setError(t('joinTeam.joinError'));
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          {t('joinTeam.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="joinCode">{t('joinTeam.enterCode')}</Label>
          <div className="flex gap-2">
            <Input
              id="joinCode"
              type="text"
              placeholder={t('joinTeam.codePlaceholder')}
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setValidatedTeam(null);
                setError(null);
                setSuccess(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inviteCode.trim() && !validatedTeam) {
                  handleValidateCode();
                }
              }}
              maxLength={6}
              className="font-mono uppercase tracking-wider"
              disabled={isValidating || isJoining}
            />
            {!validatedTeam && (
              <Button
                onClick={handleValidateCode}
                disabled={!inviteCode.trim() || isValidating}
              >
                {isValidating ? t('joinTeam.validating') : t('joinTeam.validateCode')}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {validatedTeam && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="font-semibold text-green-900 dark:text-green-100">
                {t('joinTeam.teamFound')}
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('joinTeam.teamName', { teamName: validatedTeam.name })}
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('joinTeam.seasonName', { seasonName: validatedTeam.season.name })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleJoinTeam} disabled={isJoining}>
                {isJoining ? t('joinTeam.joining') : t('joinTeam.confirmJoin')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setValidatedTeam(null);
                  setInviteCode('');
                }}
                disabled={isJoining}
              >
                {t('common.buttons.cancel')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
