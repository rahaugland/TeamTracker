import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAuth, useTeams } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { getPracticePlans, createPracticePlan } from '@/services/practice-plans.service';
import { getTeams } from '@/services/teams.service';
import type { PracticePlan, Team } from '@/types/database.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { practicePlanSchema, type PracticePlanFormData } from '@/lib/validations/practice-plan';
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
import { Textarea } from '@/components/ui/textarea';

/**
 * PracticePlansPage
 * Lists all practice plans with create functionality - VolleyQuest style
 */
export function PracticePlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeTeamId, getActiveTeam } = useTeams();
  const activeTeam = getActiveTeam();

  const [plans, setPlans] = useState<PracticePlan[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<PracticePlanFormData>({
    resolver: zodResolver(practicePlanSchema),
    defaultValues: {
      name: '',
      team_id: activeTeamId || '',
      date: '',
      notes: '',
    },
  });

  useEffect(() => {
    loadData();
  }, [activeTeamId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, teamsData] = await Promise.all([
        getPracticePlans(),
        getTeams(),
      ]);

      // Filter by active team if selected
      const filteredPlans = activeTeamId
        ? plansData.filter(p => p.team_id === activeTeamId)
        : plansData;

      setPlans(filteredPlans);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (data: PracticePlanFormData) => {
    if (!user?.id) return;

    setIsCreating(true);
    try {
      const newPlan = await createPracticePlan({
        name: data.name,
        team_id: data.team_id,
        date: data.date || undefined,
        notes: data.notes,
        created_by: user.id,
      });

      // Navigate to the plan builder
      navigate(`/practice-plans/${newPlan.id}`);
    } catch (error) {
      console.error('Error creating practice plan:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePlanClick = (planId: string) => {
    navigate(`/practice-plans/${planId}`);
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-[32px] uppercase tracking-tight text-white mb-1">
          Practice Plans
        </h1>
        <p className="text-sm text-gray-400">
          {activeTeam?.name || 'All Teams'} • {filteredPlans.length} {filteredPlans.length === 1 ? 'plan' : 'plans'}
        </p>
      </div>

      {/* Search and Create */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search plans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-navy-90 border-white/10 text-white placeholder:text-gray-400 focus:border-club-primary"
        />
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-club-primary hover:bg-club-primary-dim text-white font-display font-semibold uppercase tracking-wide"
        >
          Create Plan
        </Button>
      </div>

      {/* Practice Plans Grid */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          title={plans.length === 0 ? "No Practice Plans" : "No results found"}
          description={plans.length === 0 ? "Create your first practice plan to get started" : "Try a different search term"}
          action={
            plans.length === 0
              ? {
                  label: "Create Plan",
                  onClick: () => setShowCreateDialog(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <Link key={plan.id} to={`/practice-plans/${plan.id}`}>
            <Card
              className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Accent stripe */}
              <div className="h-1 bg-gradient-to-r from-club-primary to-club-secondary" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-base uppercase text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {getTeamName(plan.team_id)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-vq-teal/10 flex items-center justify-center">
                    <span className="text-lg">📋</span>
                  </div>
                </div>

                {plan.date && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">📅</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(plan.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {plan.notes && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {plan.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <span className="text-[10px] font-display font-semibold uppercase tracking-wide text-gray-500">
                    Click to edit
                  </span>
                  <span className="text-vq-teal text-lg">→</span>
                </div>
              </div>
            </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-navy-90 border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-white">
              Create Practice Plan
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400">Plan Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Serve Reception Focus"
                        className="bg-navy-80 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400">Team *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-navy-80 border-white/10 text-white">
                          <SelectValue placeholder="Select a team" />
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400">Date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-navy-80 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-400">Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Focus areas, goals, etc..."
                        rows={3}
                        className="bg-navy-80 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-club-primary hover:bg-club-primary-dim"
                >
                  {isCreating ? 'Creating...' : 'Create & Edit'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
