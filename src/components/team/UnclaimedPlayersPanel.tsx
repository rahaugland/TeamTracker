import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Copy, Trash2, UserPlus } from 'lucide-react';
import { generateClaimToken, buildClaimUrl, revokeClaimToken, getTeamClaimTokens } from '@/services/claim.service';
import type { ClaimToken } from '@/types/database.types';
import { POSITION_NAMES, type VolleyballPosition } from '@/types/database.types';
import { useUI } from '@/store';

interface UnclaimedPlayersProps {
  teamId: string;
  players: Array<{
    id: string;
    name: string;
    positions?: string[];
    user_id?: string | null;
    photo_url?: string | null;
    team_memberships?: Array<{ jersey_number?: number | null }>;
  }>;
  onUpdate: () => void;
}

export function UnclaimedPlayersPanel({ teamId, players, onUpdate }: UnclaimedPlayersProps) {
  const { t } = useTranslation();
  const { addNotification } = useUI();
  const [tokenMap, setTokenMap] = useState<Map<string, ClaimToken & { player_name: string }>>(new Map());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const unclaimedPlayers = players.filter(p => !p.user_id);

  useEffect(() => {
    let cancelled = false;

    async function fetchTokens() {
      try {
        const tokens = await getTeamClaimTokens(teamId);
        if (cancelled) return;
        const map = new Map<string, ClaimToken & { player_name: string }>();
        for (const token of tokens) {
          map.set(token.player_id, token);
        }
        setTokenMap(map);
      } catch {
        // Silently fail — tokens just won't show as active
      }
    }

    fetchTokens();
    return () => { cancelled = true; };
  }, [teamId]);

  const handleGenerate = async (playerId: string) => {
    setProcessingIds(prev => new Set(prev).add(playerId));
    try {
      const { token } = await generateClaimToken(playerId, teamId);
      const url = buildClaimUrl(token);
      await navigator.clipboard.writeText(url);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: t('claim.linkCopied'),
        duration: 3000,
      });
      // Refresh tokens
      const tokens = await getTeamClaimTokens(teamId);
      const map = new Map<string, ClaimToken & { player_name: string }>();
      for (const tk of tokens) {
        map.set(tk.player_id, tk);
      }
      setTokenMap(map);
    } catch {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: t('common.messages.error'),
        duration: 5000,
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildClaimUrl(token));
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: t('claim.linkCopied'),
        duration: 3000,
      });
    } catch {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: t('common.messages.error'),
        duration: 5000,
      });
    }
  };

  const handleRevoke = async (tokenId: string, playerId: string) => {
    if (!window.confirm(t('claim.revokeLinkConfirm'))) return;

    setProcessingIds(prev => new Set(prev).add(playerId));
    try {
      await revokeClaimToken(tokenId);
      setTokenMap(prev => {
        const next = new Map(prev);
        next.delete(playerId);
        return next;
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
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  if (unclaimedPlayers.length === 0) return null;

  return (
    <Card className="border-club-secondary/30 bg-club-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-club-secondary" />
          {t('claim.unclaimedPlayers')}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({unclaimedPlayers.length})
          </span>
        </CardTitle>
        <CardDescription>{t('claim.unclaimedPlayersDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unclaimedPlayers.map(player => {
            const activeToken = tokenMap.get(player.id);
            const isProcessing = processingIds.has(player.id);
            const jerseyNumber = player.team_memberships?.[0]?.jersey_number;
            const positions = (player.positions || []) as VolleyballPosition[];

            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-white/[0.06]"
              >
                <div>
                  <p className="font-medium">
                    {player.name}
                    {jerseyNumber != null && (
                      <span className="ml-2 text-sm text-muted-foreground">#{jerseyNumber}</span>
                    )}
                  </p>
                  {positions.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {positions.map(pos => POSITION_NAMES[pos]).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeToken ? (
                    <>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                        {t('claim.activeLink')}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {t('claim.linkExpires', {
                          date: new Date(activeToken.expires_at).toLocaleDateString(),
                        })}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(activeToken.token)}
                        disabled={isProcessing}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {t('claim.copyLink')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-club-primary border-club-primary/30 hover:bg-club-primary/10"
                        onClick={() => handleRevoke(activeToken.id, player.id)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                      onClick={() => handleGenerate(player.id)}
                      disabled={isProcessing}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      {t('claim.generateLink')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
