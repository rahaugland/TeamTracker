import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getActiveSeason } from '@/services/seasons.service';
import { getTeamsBySeason } from '@/services/teams.service';
import { addPlayerToTeam, getPlayer } from '@/services/players.service';
import type { TeamWithSeason } from '@/services/teams.service';

const teamMembershipSchema = z.object({
  teamId: z.string().min(1, 'Team is required'),
  jerseyNumber: z.number().min(0).max(99).optional(),
  role: z.enum(['player', 'captain']),
});

type TeamMembershipFormData = z.input<typeof teamMembershipSchema>;

interface AddToTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  onSuccess: () => void;
}

/**
 * AddToTeamModal component
 * Modal for adding a player to a team with jersey number and role
 */
export function AddToTeamModal({
  open,
  onOpenChange,
  playerId,
  onSuccess,
}: AddToTeamModalProps) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<TeamWithSeason[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TeamMembershipFormData>({
    resolver: zodResolver(teamMembershipSchema),
    defaultValues: {
      teamId: '',
      jerseyNumber: undefined,
      role: 'player',
    },
  });

  useEffect(() => {
    if (open) {
      loadTeams();
      form.reset();
    }
  }, [open]);

  const loadTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeSeason = await getActiveSeason();
      if (activeSeason) {
        const teamsData = await getTeamsBySeason(activeSeason.id);

        // Filter out teams the player is already an active member of
        const player = await getPlayer(playerId);
        const activeTeamIds = new Set(
          (player?.team_memberships ?? [])
            .filter(m => m.is_active)
            .map(m => m.team_id)
        );
        setTeams(teamsData.filter(team => !activeTeamIds.has(team.id)));
      } else {
        setError(t('player.noActiveSeason'));
      }
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: TeamMembershipFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await addPlayerToTeam({
        player_id: playerId,
        team_id: data.teamId,
        jersey_number: data.jerseyNumber ?? undefined,
        role: data.role,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error adding player to team:', err);
      if (err?.message === 'ALREADY_MEMBER') {
        setError(t('player.alreadyOnTeam'));
      } else {
        setError(t('common.messages.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('player.addToTeam')}</DialogTitle>
          <DialogDescription>
            {t('player.addToTeamDescription')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('common.messages.loading')}
          </div>
        ) : teams.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('player.noTeamsAvailable')}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('team.singular')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('team.selectTeam')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jerseyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('player.jerseyNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('player.role')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player">
                          {t('player.roles.player')}
                        </SelectItem>
                        <SelectItem value="captain">
                          {t('player.roles.captain')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.buttons.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.messages.saving') : t('common.buttons.add')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
