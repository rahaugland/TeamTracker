import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface PendingTeam {
  id: string;
  team_name: string;
  joined_at: string;
}

interface PendingMembershipsProps {
  refreshKey?: number;
}

export function PendingMemberships({ refreshKey }: PendingMembershipsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      const { data } = await supabase
        .from('team_memberships')
        .select(`
          id,
          joined_at,
          team:teams(name)
        `)
        .eq('status', 'pending')
        .eq('is_active', true)
        .in(
          'player_id',
          (
            await supabase
              .from('players')
              .select('id')
              .eq('user_id', user.id)
          ).data?.map((p: any) => p.id) || []
        );

      setPendingTeams(
        (data || []).map((item: any) => ({
          id: item.id,
          team_name: item.team?.name || '?',
          joined_at: item.joined_at,
        }))
      );
    };

    load();
  }, [user?.id, refreshKey]);

  if (pendingTeams.length === 0) return null;

  return (
    <Card className="border-club-secondary/20 bg-club-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-club-secondary" />
          {t('player.pendingMemberships.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pendingTeams.map((pt) => (
            <div
              key={pt.id}
              className="flex items-center justify-between p-3 bg-card rounded-lg border border-white/[0.06]"
            >
              <div>
                <p className="font-medium">{pt.team_name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('player.pendingMemberships.waitingApproval')}
                </p>
              </div>
              <Clock className="h-4 w-4 text-club-secondary" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
