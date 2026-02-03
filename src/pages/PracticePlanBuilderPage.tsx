import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
 * Edit practice plan with two-panel drag-and-drop builder
 */
export function PracticePlanBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [plan, setPlan] = useState<PracticePlanWithBlocks | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; blockId: string | null }>({
    open: false,
    blockId: null,
  });
  const [drillSearch, setDrillSearch] = useState('');
  const [drillSkillFilter, setDrillSkillFilter] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');

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
      setPlanName(planData.name);
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

  const handleAddDrillBlock = async (drill: Drill) => {
    if (!id || !plan) return;

    try {
      await createPracticeBlock({
        practice_plan_id: id,
        order_index: plan.practice_blocks.length,
        type: 'drill',
        drill_id: drill.id,
        duration_minutes: 15,
        notes: '',
      });

      await loadPlanData(id);
    } catch (error) {
      console.error('Error adding drill block:', error);
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

  const getSectionBlocks = (sectionType: 'warmup' | 'main' | 'game') => {
    if (!plan) return [];

    return plan.practice_blocks.filter(block => {
      if (sectionType === 'warmup') return block.type === 'warmup';
      if (sectionType === 'game') return block.type === 'scrimmage' || block.type === 'game';
      // Main section includes drills and custom blocks
      return block.type === 'drill' || block.type === 'custom';
    });
  };

  const getSectionDuration = (sectionType: 'warmup' | 'main' | 'game') => {
    const blocks = getSectionBlocks(sectionType);
    return blocks.reduce((sum, block) => sum + block.duration_minutes, 0);
  };

  const filteredDrills = drills.filter((drill) => {
    const matchesSearch = drillSearch === '' ||
      drill.name.toLowerCase().includes(drillSearch.toLowerCase());
    const matchesSkill = !drillSkillFilter ||
      drill.skill_tags.includes(drillSkillFilter);
    return matchesSearch && matchesSkill;
  });

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
    <div className="h-screen flex flex-col bg-navy">
      {/* Breadcrumb */}
      <div className="px-6 py-4 border-b border-white/6">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => navigate('/practice-plans')}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            Practice Plans
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-white">Edit Plan</span>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex-1 grid grid-cols-[300px_1fr] gap-6 p-6 overflow-hidden">
        {/* Left Panel: Drill Library */}
        <div className="bg-navy-90 border border-white/6 rounded-lg flex flex-col overflow-hidden">
          {/* Library Header */}
          <div className="p-4 border-b border-white/6">
            <Input
              placeholder="Search drills..."
              value={drillSearch}
              onChange={(e) => setDrillSearch(e.target.value)}
              className="w-full bg-navy-80 border-white/10 text-white placeholder:text-muted-foreground text-sm mb-2"
            />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setDrillSkillFilter(null)}
                className={`font-display font-semibold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full transition-all border ${
                  !drillSkillFilter
                    ? 'bg-vq-teal text-navy border-vq-teal'
                    : 'bg-navy-80 text-muted-foreground border-transparent hover:text-white hover:border-white/10'
                }`}
              >
                All
              </button>
              {SKILL_TAGS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setDrillSkillFilter(drillSkillFilter === skill ? null : skill)}
                  className={`font-display font-semibold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full transition-all border ${
                    drillSkillFilter === skill
                      ? 'bg-vq-teal text-navy border-vq-teal'
                      : 'bg-navy-80 text-muted-foreground border-transparent hover:text-white hover:border-white/10'
                  }`}
                >
                  {skill.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Library List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredDrills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('drill.noDrills')}
              </p>
            ) : (
              filteredDrills.map((drill) => (
                <div
                  key={drill.id}
                  onClick={() => handleAddDrillBlock(drill)}
                  className="p-3 bg-navy-80 rounded border border-transparent hover:border-vq-teal transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-bold text-[13px] uppercase text-white">
                      {drill.name}
                    </span>
                    <span className="font-mono text-[11px] text-vq-teal">
                      15 min
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {drill.skill_tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/6 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/6 text-muted-foreground">
                      Level {drill.progression_level}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Plan Canvas */}
        <div className="bg-navy-90 border border-white/6 rounded-lg flex flex-col overflow-hidden">
          {/* Canvas Header */}
          <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="bg-transparent border-none font-display font-extrabold text-xl uppercase text-white placeholder:text-muted-foreground outline-none w-80"
              placeholder="Plan name..."
            />
            <div className="flex items-center gap-6">
              <span className="font-mono text-sm text-vq-teal">
                Total: {totalDuration} min
              </span>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                Save Plan
              </Button>
            </div>
          </div>

          {/* Canvas Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Warmup Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-xs uppercase tracking-[2px] text-muted-foreground">
                  Warmup
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {getSectionDuration('warmup')} min
                </span>
              </div>
              <div className="space-y-2">
                {getSectionBlocks('warmup').map((block, index) => (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 p-3 bg-navy-80 rounded border-l-[3px] border-vq-teal"
                  >
                    <span className="w-6 h-6 rounded-full bg-vq-teal text-navy flex items-center justify-center font-display font-extrabold text-xs">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-display font-bold text-sm text-white">
                        {getBlockTitle(block)}
                      </p>
                      {block.notes && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {block.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${block.duration_minutes} min`}
                        readOnly
                        className="w-16 bg-navy-70 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white text-center"
                      />
                      <button
                        onClick={() => setDeleteConfirm({ open: true, blockId: block.id })}
                        className="w-6 h-6 rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {getSectionBlocks('warmup').length === 0 && (
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag drills here to add
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Focus Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-xs uppercase tracking-[2px] text-muted-foreground">
                  Main Focus
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {getSectionDuration('main')} min
                </span>
              </div>
              <div className="space-y-2">
                {getSectionBlocks('main').map((block, index) => {
                  const globalIndex = getSectionBlocks('warmup').length + index + 1;
                  return (
                    <div
                      key={block.id}
                      className="flex items-center gap-3 p-3 bg-navy-80 rounded border-l-[3px] border-vq-teal"
                    >
                      <span className="w-6 h-6 rounded-full bg-vq-teal text-navy flex items-center justify-center font-display font-extrabold text-xs">
                        {globalIndex}
                      </span>
                      <div className="flex-1">
                        <p className="font-display font-bold text-sm text-white">
                          {getBlockTitle(block)}
                        </p>
                        {block.notes && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {block.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${block.duration_minutes} min`}
                          readOnly
                          className="w-16 bg-navy-70 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white text-center"
                        />
                        <button
                          onClick={() => setDeleteConfirm({ open: true, blockId: block.id })}
                          className="w-6 h-6 rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
                {getSectionBlocks('main').length === 0 && (
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag drills here to add
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Game Play Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-xs uppercase tracking-[2px] text-muted-foreground">
                  Game Play
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {getSectionDuration('game')} min
                </span>
              </div>
              <div className="space-y-2">
                {getSectionBlocks('game').map((block, index) => {
                  const globalIndex = getSectionBlocks('warmup').length + getSectionBlocks('main').length + index + 1;
                  return (
                    <div
                      key={block.id}
                      className="flex items-center gap-3 p-3 bg-navy-80 rounded border-l-[3px] border-vq-teal"
                    >
                      <span className="w-6 h-6 rounded-full bg-vq-teal text-navy flex items-center justify-center font-display font-extrabold text-xs">
                        {globalIndex}
                      </span>
                      <div className="flex-1">
                        <p className="font-display font-bold text-sm text-white">
                          {getBlockTitle(block)}
                        </p>
                        {block.notes && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {block.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${block.duration_minutes} min`}
                          readOnly
                          className="w-16 bg-navy-70 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white text-center"
                        />
                        <button
                          onClick={() => setDeleteConfirm({ open: true, blockId: block.id })}
                          className="w-6 h-6 rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
                {getSectionBlocks('game').length === 0 && (
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag drills here to add
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
