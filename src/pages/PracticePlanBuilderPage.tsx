import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { practiceBlockSchema, type PracticeBlockFormData, blockTypes } from '@/lib/validations/practice-plan';
import {
  getPracticePlan,
  createPracticeBlock,
  deletePracticeBlock,
  moveBlockUp,
  moveBlockDown,
  calculatePlanDuration,
} from '@/services/practice-plans.service';
import { getDrills } from '@/services/drills.service';
import type { PracticePlanWithBlocks } from '@/services/practice-plans.service';
import type { Drill } from '@/types/database.types';
import { SKILL_TAGS } from '@/types/database.types';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

/**
 * PracticePlanBuilderPage
 * Edit practice plan with block management (add, reorder, delete)
 */
export function PracticePlanBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [plan, setPlan] = useState<PracticePlanWithBlocks | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBlockDialog, setShowAddBlockDialog] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; blockId: string | null }>({
    open: false,
    blockId: null,
  });
  const [drillSearch, setDrillSearch] = useState('');
  const [drillSkillFilter, setDrillSkillFilter] = useState<string | null>(null);

  const form = useForm<PracticeBlockFormData>({
    resolver: zodResolver(practiceBlockSchema),
    defaultValues: {
      type: 'warmup',
      drill_id: null,
      custom_title: '',
      duration_minutes: 15,
      notes: '',
    },
  });

  const blockType = form.watch('type');

  useEffect(() => {
    if (id) {
      loadPlanData(id);
    }
    loadDrills();
  }, [id]);

  const loadPlanData = async (planId: string) => {
    setLoading(true);
    try {
      const planData = await getPracticePlan(planId);
      setPlan(planData);
    } catch (error) {
      console.error('Error loading practice plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrills = async () => {
    try {
      const drillsData = await getDrills();
      setDrills(drillsData);
    } catch (error) {
      console.error('Error loading drills:', error);
    }
  };

  const handleAddBlock = async (data: PracticeBlockFormData) => {
    if (!id || !plan) return;

    setIsAddingBlock(true);
    try {
      await createPracticeBlock({
        practice_plan_id: id,
        order_index: plan.practice_blocks.length,
        type: data.type,
        drill_id: data.drill_id || undefined,
        custom_title: data.custom_title || undefined,
        duration_minutes: data.duration_minutes,
        notes: data.notes,
      });

      // Reload plan data
      await loadPlanData(id);
      setShowAddBlockDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error adding block:', error);
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleMoveUp = async (blockId: string) => {
    if (!id) return;
    try {
      await moveBlockUp(id, blockId);
      await loadPlanData(id);
    } catch (error) {
      console.error('Error moving block up:', error);
    }
  };

  const handleMoveDown = async (blockId: string) => {
    if (!id) return;
    try {
      await moveBlockDown(id, blockId);
      await loadPlanData(id);
    } catch (error) {
      console.error('Error moving block down:', error);
    }
  };

  const handleDeleteBlock = async () => {
    if (!id || !deleteConfirm.blockId) return;

    try {
      await deletePracticeBlock(deleteConfirm.blockId);
      await loadPlanData(id);
      setDeleteConfirm({ open: false, blockId: null });
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  const getBlockTitle = (block: PracticePlanWithBlocks['practice_blocks'][0]) => {
    if (block.type === 'drill' && block.drill) {
      return block.drill.name;
    }
    if (block.type === 'custom' && block.custom_title) {
      return block.custom_title;
    }
    return t(`practice.blockTypes.${block.type}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Practice plan not found</p>
      </div>
    );
  }

  const totalDuration = calculatePlanDuration(plan.practice_blocks);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate('/practice-plans')} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
            <p className="text-muted-foreground">{plan.team.name}</p>
            {plan.date && (
              <p className="text-sm text-muted-foreground">
                {new Date(plan.date).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t('practice.totalDuration')}</p>
            <p className="text-2xl font-bold">{totalDuration} min</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Practice Blocks</h2>
        <Button onClick={() => { setShowAddBlockDialog(true); setDrillSearch(''); setDrillSkillFilter(null); }}>
          {t('practice.addBlock')}
        </Button>
      </div>

      {/* Blocks List */}
      <div className="space-y-3">
        {plan.practice_blocks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No blocks yet. Add your first block to start building the practice plan.
              </p>
            </CardContent>
          </Card>
        ) : (
          plan.practice_blocks.map((block, index) => (
            <Card key={block.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveUp(block.id)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveDown(block.id)}
                      disabled={index === plan.practice_blocks.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      ↓
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                        {t(`practice.blockTypes.${block.type}`)}
                      </span>
                      <h3 className="font-medium">{getBlockTitle(block)}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{block.duration_minutes} min</span>
                      {block.drill && (
                        <span>Level {block.drill.progression_level}</span>
                      )}
                    </div>
                    {block.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{block.notes}</p>
                    )}
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, blockId: block.id })}
                  >
                    {t('common.buttons.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Block Dialog */}
      <Dialog open={showAddBlockDialog} onOpenChange={setShowAddBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('practice.addBlock')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddBlock)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Block Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {blockTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`practice.blockTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {blockType === 'drill' && (
                <FormField
                  control={form.control}
                  name="drill_id"
                  render={({ field }) => {
                    const filteredDrills = drills.filter((d) => {
                      const matchesSearch = drillSearch === '' ||
                        d.name.toLowerCase().includes(drillSearch.toLowerCase());
                      const matchesSkill = !drillSkillFilter ||
                        d.skill_tags.includes(drillSkillFilter);
                      return matchesSearch && matchesSkill;
                    });
                    const selectedDrill = drills.find(d => d.id === field.value);

                    return (
                      <FormItem>
                        <FormLabel>{t('practice.selectDrill')} *</FormLabel>
                        <div className="space-y-2">
                          <Input
                            placeholder={t('drill.searchDrills')}
                            value={drillSearch}
                            onChange={(e) => setDrillSearch(e.target.value)}
                          />
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setDrillSkillFilter(null)}
                              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                !drillSkillFilter
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-accent border-input'
                              }`}
                            >
                              {t('common.labels.all')}
                            </button>
                            {SKILL_TAGS.map((skill) => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => setDrillSkillFilter(drillSkillFilter === skill ? null : skill)}
                                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                  drillSkillFilter === skill
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-accent border-input'
                                }`}
                              >
                                {t(`drill.skills.${skill.replace('-', '')}` as any)}
                              </button>
                            ))}
                          </div>
                          <div className="border rounded-md max-h-48 overflow-y-auto">
                            {filteredDrills.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                {t('drill.noDrills')}
                              </p>
                            ) : (
                              filteredDrills.map((drill) => (
                                <button
                                  key={drill.id}
                                  type="button"
                                  onClick={() => field.onChange(drill.id)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                                    field.value === drill.id ? 'bg-accent font-medium' : ''
                                  }`}
                                >
                                  <span>{drill.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                    L{drill.progression_level}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                          {selectedDrill && (
                            <p className="text-xs text-muted-foreground">
                              {t('practice.selectDrill')}: <span className="font-medium">{selectedDrill.name}</span>
                            </p>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              {blockType === 'custom' && (
                <FormField
                  control={form.control}
                  name="custom_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('practice.customTitle')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom block title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('practice.blockDuration')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                  onClick={() => setShowAddBlockDialog(false)}
                >
                  {t('common.buttons.cancel')}
                </Button>
                <Button type="submit" disabled={isAddingBlock}>
                  {isAddingBlock ? t('common.messages.saving') : t('common.buttons.add')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, blockId: null })}
        onConfirm={handleDeleteBlock}
        title={t('practice.deleteBlock')}
        description="Are you sure you want to delete this block?"
      />
    </div>
  );
}
