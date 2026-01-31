import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { getPracticePlans, createPracticePlan, deletePracticePlan } from '@/services/practice-plans.service';
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
import { Input } from '@/components/ui/input';
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
 * Lists all practice plans with create functionality
 */
export function PracticePlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState<PracticePlan[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<PracticePlanFormData>({
    resolver: zodResolver(practicePlanSchema),
    defaultValues: {
      name: '',
      team_id: '',
      date: '',
      notes: '',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, teamsData] = await Promise.all([
        getPracticePlans(),
        getTeams(),
      ]);

      setPlans(plansData);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p>{t('common.messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('practice.plans')}</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage practice plans
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            {t('practice.createPlan')}
          </Button>
        </div>

        {/* Practice Plans List */}
        {plans.length === 0 ? (
          <EmptyState
            title={t('practice.noPracticePlans')}
            description={t('practice.noPracticePlansDescription')}
            action={{
              label: t('practice.createPlan'),
              onClick: () => setShowCreateDialog(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePlanClick(plan.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    {getTeamName(plan.team_id)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plan.date && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(plan.date).toLocaleDateString()}
                    </p>
                  )}
                  {plan.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Plan Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('practice.createPlan')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('practice.planName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Weekly Practice Plan" {...field} />
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
                      <FormLabel>{t('team.selectTeam')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>{t('common.labels.date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>{t('common.labels.notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    {t('common.buttons.cancel')}
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? t('common.messages.saving') : t('common.buttons.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
