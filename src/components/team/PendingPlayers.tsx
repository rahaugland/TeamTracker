import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';
import { approveTeamMembership, rejectTeamMembership } from '@/services/players.service';
import type { PlayerWithMemberships } from '@/services/players.service';

interface PendingPlayersProps {
  pendingPlayers: PlayerWithMemberships[];
  onUpdate: () => void;
  addNotification: (n: { id: string; type: 'error' | 'info' | 'success' | 'warning'; message: string; duration: number }) => void;
}

export function PendingPlayers({ pendingPlayers, onUpdate, addNotification }: PendingPlayersProps) {
  const { t } = useTranslation();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  if (pendingPlayers.length === 0) return null;

  const getMembershipId = (player: PlayerWithMemberships) =>
    player.team_memberships?.[0]?.id;

  const handleApprove = async (player: PlayerWithMemberships) => {
    const membershipId = getMembershipId(player);
    if (!membershipId) return;

    setProcessingIds((prev) => new Set(prev).add(membershipId));
    try {
      await approveTeamMembership(membershipId);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: t('team.pendingPlayers.approved'),
        duration: 3000,
      });
      onUpdate();
    } catch {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: t('common.messages.error'),
        duration: 5000,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(membershipId);
        return next;
      });
    }
  };

  const handleReject = async (player: PlayerWithMemberships) => {
    const membershipId = getMembershipId(player);
    if (!membershipId) return;

    if (!window.confirm(t('common.messages.confirmDelete'))) return;

    setProcessingIds((prev) => new Set(prev).add(membershipId));
    try {
      await rejectTeamMembership(membershipId);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: t('team.pendingPlayers.rejected'),
        duration: 3000,
      });
      onUpdate();
    } catch {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: t('common.messages.error'),
        duration: 5000,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(membershipId);
        return next;
      });
    }
  };

  return (
    <Card className="border-club-secondary/30 bg-club-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-club-secondary" />
          {t('team.pendingPlayers.title')}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({pendingPlayers.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingPlayers.map((player) => {
            const membershipId = getMembershipId(player);
            const isProcessing = membershipId ? processingIds.has(membershipId) : false;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-white/[0.06]"
              >
                <div>
                  <p className="font-medium">{player.name}</p>
                  {player.email && (
                    <p className="text-sm text-muted-foreground">{player.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(player.team_memberships?.[0]?.joined_at || player.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                    onClick={() => handleApprove(player)}
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t('team.pendingPlayers.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-club-primary border-club-primary/30 hover:bg-club-primary/10"
                    onClick={() => handleReject(player)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('team.pendingPlayers.reject')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
