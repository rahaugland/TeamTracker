import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getTeamByInviteCode, joinTeamByCode } from '@/services/teams.service';
import { performSync } from '@/services/sync.service';
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
  const { user, syncSession } = useAuth();

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
      await joinTeamByCode(inviteCode.trim(), user.name, user.email);

      // Sync session and pull new data into IndexedDB
      await syncSession();
      await performSync(user.id);

      setSuccess(t('joinTeam.joinPending', { teamName: validatedTeam.name }));
      setValidatedTeam(null);
      setInviteCode('');
      onJoined?.();
    } catch (err: any) {
      if (err.code === '23505' || err.code === 'P0002') {
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
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
            <p className="text-sm text-emerald-400">{success}</p>
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
          <div className="p-3 bg-club-primary/10 border border-club-primary/20 rounded-md">
            <p className="text-sm text-club-primary">{error}</p>
          </div>
        )}

        {validatedTeam && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <p className="font-semibold text-emerald-300">
                {t('joinTeam.teamFound')}
              </p>
              <p className="text-sm text-emerald-400">
                {t('joinTeam.teamName', { teamName: validatedTeam.name })}
              </p>
              <p className="text-sm text-emerald-400">
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
