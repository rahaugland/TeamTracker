import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getPracticePlan,
  createPracticeBlock,
  updatePracticeBlock,
  deletePracticeBlock,
  reorderPracticeBlocks,
  updatePracticePlan,
  calculatePlanDuration,
} from '@/services/practice-plans.service';
import { getDrills } from '@/services/drills.service';
import type { PracticePlanWithBlocks } from '@/services/practice-plans.service';
import type { Drill, PracticeBlockType } from '@/types/database.types';
import { SKILL_TAGS } from '@/types/database.types';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  GripVertical,
  X,
  Clock,
  ChevronLeft,
  Search,
  Plus,
  Save,
} from 'lucide-react';

// Types
type SectionType = 'warmup' | 'main' | 'game';

interface PlanBlock {
  id: string;
  order_index: number;
  type: PracticeBlockType;
  drill_id?: string;
  custom_title?: string;
  duration_minutes: number;
  notes?: string;
  drill?: {
    id: string;
    name: string;
    description: string;
    skill_tags: string[];
    progression_level: number;
  } | null;
  section: SectionType;
}

// Draggable drill item from library
function DraggableDrillItem({ drill }: { drill: Drill }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `drill-${drill.id}`,
    data: {
      type: 'library-drill',
      drill,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-navy-80 rounded-lg border border-transparent hover:border-vq-teal transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-display font-bold text-[13px] uppercase text-white tracking-wide">
          {drill.name}
        </span>
        <span className="font-mono text-[11px] text-vq-teal">
          {drill.duration_minutes || 15} min
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {drill.skill_tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/6 text-gray-400"
          >
            {tag}
          </span>
        ))}
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/6 text-gray-400">
          Lvl {drill.progression_level}
        </span>
      </div>
    </div>
  );
}

// Sortable block in the plan
function SortablePlanBlock({
  block,
  globalIndex,
  onDelete,
  onDurationChange,
}: {
  block: PlanBlock;
  globalIndex: number;
  onDelete: () => void;
  onDurationChange: (minutes: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: 'plan-block',
      block,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const blockTitle = block.drill?.name || block.custom_title || block.type;
  const blockDescription = block.drill?.description || block.notes || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-navy-80 rounded-lg border-l-[3px] border-vq-teal group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Order number */}
      <span className="w-6 h-6 rounded-full bg-vq-teal text-navy flex items-center justify-center font-display font-extrabold text-xs shrink-0">
        {globalIndex}
      </span>

      {/* Block info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-white uppercase tracking-wide truncate">
          {blockTitle}
        </p>
        {blockDescription && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {blockDescription}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <input
            type="number"
            min="1"
            max="120"
            value={block.duration_minutes}
            onChange={(e) => onDurationChange(parseInt(e.target.value) || 1)}
            className="w-14 bg-navy-70 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white text-center appearance-none"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
            m
          </span>
        </div>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Droppable section container
function DroppableSection({
  title,
  duration,
  blocks,
  globalStartIndex,
  onDeleteBlock,
  onDurationChange,
  isOver,
}: {
  section?: SectionType;
  title: string;
  duration: number;
  blocks: PlanBlock[];
  globalStartIndex: number;
  onDeleteBlock: (blockId: string) => void;
  onDurationChange: (blockId: string, minutes: number) => void;
  isOver: boolean;
}) {
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-bold text-xs uppercase tracking-[2px] text-gray-400">
          {title}
        </span>
        <span className="font-mono text-xs text-gray-400">
          {duration} min
        </span>
      </div>

      {/* Sortable blocks */}
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`space-y-2 min-h-[60px] rounded-lg transition-all p-1 -m-1 ${
            isOver ? 'bg-vq-teal/10 ring-2 ring-vq-teal/30 ring-dashed' : ''
          }`}
        >
          {blocks.map((block, index) => (
            <SortablePlanBlock
              key={block.id}
              block={block}
              globalIndex={globalStartIndex + index + 1}
              onDelete={() => onDeleteBlock(block.id)}
              onDurationChange={(mins) => onDurationChange(block.id, mins)}
            />
          ))}
          {blocks.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isOver
                  ? 'border-vq-teal bg-vq-teal/5'
                  : 'border-white/10'
              }`}
            >
              <Plus className="w-5 h-5 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-500">
                Drag drills here
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// Drag overlay for visual feedback
function DragOverlayContent({
  active,
}: {
  active: { id: UniqueIdentifier; data: { current?: { type: string; drill?: Drill; block?: PlanBlock } } } | null;
}) {
  if (!active?.data.current) return null;

  const { type, drill, block } = active.data.current;

  if (type === 'library-drill' && drill) {
    return (
      <div className="p-3 bg-navy-80 rounded-lg border-2 border-vq-teal shadow-glow-teal cursor-grabbing w-64">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-display font-bold text-[13px] uppercase text-white tracking-wide">
            {drill.name}
          </span>
          <span className="font-mono text-[11px] text-vq-teal">
            {drill.duration_minutes || 15} min
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {drill.skill_tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/6 text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'plan-block' && block) {
    const blockTitle = block.drill?.name || block.custom_title || block.type;
    return (
      <div className="flex items-center gap-3 p-3 bg-navy-80 rounded-lg border-l-[3px] border-vq-teal shadow-glow-teal cursor-grabbing w-96">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <span className="w-6 h-6 rounded-full bg-vq-teal text-navy flex items-center justify-center font-display font-extrabold text-xs">
          #
        </span>
        <p className="font-display font-bold text-sm text-white uppercase tracking-wide">
          {blockTitle}
        </p>
      </div>
    );
  }

  return null;
}

/**
 * PracticePlanBuilderPage
 * Edit practice plan with drag-and-drop builder
 */
export function PracticePlanBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  useAuth(); // Auth context for protected route

  // State
  const [plan, setPlan] = useState<PracticePlanWithBlocks | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; blockId: string | null }>({
    open: false,
    blockId: null,
  });
  const [drillSearch, setDrillSearch] = useState('');
  const [drillSkillFilter, setDrillSkillFilter] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overSection, setOverSection] = useState<SectionType | null>(null);

  // Configure dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load data
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
      if (planData) {
        setPlanName(planData.name);
      }
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

  // Map blocks to sections
  const blocksBySection = useMemo(() => {
    if (!plan) return { warmup: [], main: [], game: [] };

    const warmup: PlanBlock[] = [];
    const main: PlanBlock[] = [];
    const game: PlanBlock[] = [];

    plan.practice_blocks.forEach((block) => {
      const planBlock: PlanBlock = {
        ...block,
        section: block.type === 'warmup' ? 'warmup' : block.type === 'scrimmage' ? 'game' : 'main',
      };

      if (block.type === 'warmup') {
        warmup.push(planBlock);
      } else if (block.type === 'scrimmage') {
        game.push(planBlock);
      } else {
        main.push(planBlock);
      }
    });

    return { warmup, main, game };
  }, [plan]);

  // Filtered drills for library
  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const matchesSearch =
        drillSearch === '' ||
        drill.name.toLowerCase().includes(drillSearch.toLowerCase()) ||
        drill.description.toLowerCase().includes(drillSearch.toLowerCase());
      const matchesSkill =
        !drillSkillFilter || drill.skill_tags.includes(drillSkillFilter);
      return matchesSearch && matchesSkill;
    });
  }, [drills, drillSearch, drillSkillFilter]);

  // Section durations
  const sectionDurations = useMemo(() => ({
    warmup: blocksBySection.warmup.reduce((sum, b) => sum + b.duration_minutes, 0),
    main: blocksBySection.main.reduce((sum, b) => sum + b.duration_minutes, 0),
    game: blocksBySection.game.reduce((sum, b) => sum + b.duration_minutes, 0),
  }), [blocksBySection]);

  const totalDuration = plan ? calculatePlanDuration(plan.practice_blocks) : 0;

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverSection(null);
      return;
    }

    // Check if over a section drop zone or a block in a section
    const overData = over.data.current;
    if (overData?.type === 'plan-block') {
      setOverSection(overData.block.section);
    } else {
      // Check if over ID matches a section
      const overId = String(over.id);
      if (['warmup', 'main', 'game'].includes(overId)) {
        setOverSection(overId as SectionType);
      } else {
        // Check which section the block belongs to
        const block = [...blocksBySection.warmup, ...blocksBySection.main, ...blocksBySection.game].find(
          (b) => b.id === overId
        );
        if (block) {
          setOverSection(block.section);
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverSection(null);

    if (!over || !id || !plan) return;

    const activeData = active.data.current;
    const overId = String(over.id);

    // Handle dropping a library drill onto the canvas
    if (activeData?.type === 'library-drill') {
      const drill = activeData.drill as Drill;
      let targetSection: SectionType = 'main';
      let insertIndex = plan.practice_blocks.length;

      // Determine target section and position
      if (['warmup', 'main', 'game'].includes(overId)) {
        targetSection = overId as SectionType;
        // Insert at end of section
        const sectionBlocks = blocksBySection[targetSection];
        if (sectionBlocks.length > 0) {
          const lastBlock = sectionBlocks[sectionBlocks.length - 1];
          insertIndex = plan.practice_blocks.findIndex((b) => b.id === lastBlock.id) + 1;
        } else {
          // Find where the section should start
          if (targetSection === 'warmup') {
            insertIndex = 0;
          } else if (targetSection === 'main') {
            insertIndex = blocksBySection.warmup.length;
          } else {
            insertIndex = blocksBySection.warmup.length + blocksBySection.main.length;
          }
        }
      } else {
        // Dropped on a specific block - insert after it
        const overBlock = [...blocksBySection.warmup, ...blocksBySection.main, ...blocksBySection.game].find(
          (b) => b.id === overId
        );
        if (overBlock) {
          targetSection = overBlock.section;
          insertIndex = plan.practice_blocks.findIndex((b) => b.id === overId) + 1;
        }
      }

      // Map section to block type
      const blockType: PracticeBlockType =
        targetSection === 'warmup' ? 'warmup' : targetSection === 'game' ? 'scrimmage' : 'drill';

      try {
        await createPracticeBlock({
          practice_plan_id: id,
          order_index: insertIndex,
          type: blockType,
          drill_id: drill.id,
          duration_minutes: drill.duration_minutes || 15,
          notes: '',
        });
        await loadPlanData(id);
      } catch (error) {
        console.error('Error adding drill block:', error);
      }
      return;
    }

    // Handle reordering blocks within the plan
    if (activeData?.type === 'plan-block') {
      const activeBlock = activeData.block as PlanBlock;
      const activeIndex = plan.practice_blocks.findIndex((b) => b.id === active.id);

      // Find the target index
      let overIndex = plan.practice_blocks.findIndex((b) => b.id === over.id);

      // If dropped on a section (empty), find the appropriate position
      if (overIndex === -1) {
        if (overId === 'warmup') {
          overIndex = 0;
        } else if (overId === 'main') {
          overIndex = blocksBySection.warmup.length;
        } else if (overId === 'game') {
          overIndex = blocksBySection.warmup.length + blocksBySection.main.length;
        }
      }

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newOrder = arrayMove(
          plan.practice_blocks.map((b) => b.id),
          activeIndex,
          overIndex
        );

        // Update block type if moved to different section
        let newType: PracticeBlockType | undefined;
        if (overId === 'warmup' || (blocksBySection.warmup.some((b) => b.id === overId))) {
          newType = 'warmup';
        } else if (overId === 'game' || blocksBySection.game.some((b) => b.id === overId)) {
          newType = 'scrimmage';
        } else if (overId === 'main' || blocksBySection.main.some((b) => b.id === overId)) {
          newType = activeBlock.type === 'warmup' || activeBlock.type === 'scrimmage' ? 'drill' : activeBlock.type;
        }

        try {
          // Update type if changed
          if (newType && newType !== activeBlock.type) {
            await updatePracticeBlock(String(active.id), { type: newType });
          }
          await reorderPracticeBlocks(id, newOrder);
          await loadPlanData(id);
        } catch (error) {
          console.error('Error reordering blocks:', error);
        }
      }
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

  const handleDurationChange = async (blockId: string, minutes: number) => {
    if (!id || minutes < 1) return;

    try {
      await updatePracticeBlock(blockId, { duration_minutes: minutes });
      await loadPlanData(id);
    } catch (error) {
      console.error('Error updating duration:', error);
    }
  };

  const handleSavePlan = async () => {
    if (!id || !planName.trim()) return;

    setSaving(true);
    try {
      await updatePracticePlan(id, { name: planName.trim() });
      // Could show a toast here
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get active item for drag overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;

    const activeIdStr = String(activeId);
    if (activeIdStr.startsWith('drill-')) {
      const drillId = activeIdStr.replace('drill-', '');
      const drill = drills.find((d) => d.id === drillId);
      return { id: activeId, data: { current: { type: 'library-drill', drill } } };
    }

    const block = plan?.practice_blocks.find((b) => b.id === activeIdStr);
    if (block) {
      const section: SectionType =
        block.type === 'warmup' ? 'warmup' : block.type === 'scrimmage' ? 'game' : 'main';
      return {
        id: activeId,
        data: { current: { type: 'plan-block', block: { ...block, section } } },
      };
    }

    return null;
  }, [activeId, drills, plan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-vq-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">{t('common.messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Practice plan not found</p>
          <Button onClick={() => navigate('/practice-plans')}>
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-navy">
        {/* Breadcrumb */}
        <div className="px-6 py-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/practice-plans')}
              className="w-8 h-8 rounded-lg bg-navy-80 hover:bg-navy-70 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <span className="text-gray-600">/</span>
              <button
                onClick={() => navigate('/practice-plans')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Practice Plans
              </button>
              <span className="text-gray-600">/</span>
              <span className="text-white font-medium">Edit Plan</span>
            </div>
          </div>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex-1 grid grid-cols-[320px_1fr] gap-6 p-6 overflow-hidden">
          {/* Left Panel: Drill Library */}
          <div className="bg-navy-90 border border-white/6 rounded-xl flex flex-col overflow-hidden">
            {/* Library Header */}
            <div className="p-4 border-b border-white/6">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search drills..."
                  value={drillSearch}
                  onChange={(e) => setDrillSearch(e.target.value)}
                  className="w-full bg-navy-80 border-white/10 text-white placeholder:text-gray-500 text-sm pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setDrillSkillFilter(null)}
                  className={`font-display font-semibold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full transition-all border ${
                    !drillSkillFilter
                      ? 'bg-vq-teal text-navy border-vq-teal'
                      : 'bg-navy-80 text-gray-400 border-transparent hover:text-white hover:border-white/10'
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
                        : 'bg-navy-80 text-gray-400 border-transparent hover:text-white hover:border-white/10'
                    }`}
                  >
                    {skill.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Library List - Draggable drills */}
            <div className="flex-1 overflow-y-auto p-4">
              <SortableContext
                items={filteredDrills.map((d) => `drill-${d.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredDrills.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">
                        {drillSearch || drillSkillFilter
                          ? 'No drills match your filters'
                          : 'No drills available'}
                      </p>
                    </div>
                  ) : (
                    filteredDrills.map((drill) => (
                      <DraggableDrillItem key={drill.id} drill={drill} />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>

            {/* Library footer */}
            <div className="p-4 border-t border-white/6">
              <p className="text-xs text-gray-500 text-center">
                {filteredDrills.length} drill{filteredDrills.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {/* Right Panel: Plan Canvas */}
          <div className="bg-navy-90 border border-white/6 rounded-xl flex flex-col overflow-hidden">
            {/* Canvas Header */}
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="bg-transparent border-none font-display font-extrabold text-xl uppercase text-white placeholder:text-gray-500 outline-none w-80 focus:ring-0"
                placeholder="Plan name..."
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-80 rounded-lg">
                  <Clock className="w-4 h-4 text-vq-teal" />
                  <span className="font-mono text-sm text-vq-teal font-semibold">
                    {totalDuration} min
                  </span>
                </div>
                <Button
                  onClick={handleSavePlan}
                  disabled={saving || !planName.trim()}
                  className="bg-club-primary hover:bg-club-primary-dim gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Plan'}
                </Button>
              </div>
            </div>

            {/* Canvas Body - Droppable sections */}
            <div className="flex-1 overflow-y-auto p-6">
              <DroppableSection
                section="warmup"
                title="Warmup"
                duration={sectionDurations.warmup}
                blocks={blocksBySection.warmup}
                globalStartIndex={0}
                onDeleteBlock={(blockId) => setDeleteConfirm({ open: true, blockId })}
                onDurationChange={handleDurationChange}
                isOver={overSection === 'warmup'}
              />

              <DroppableSection
                section="main"
                title="Main Focus"
                duration={sectionDurations.main}
                blocks={blocksBySection.main}
                globalStartIndex={blocksBySection.warmup.length}
                onDeleteBlock={(blockId) => setDeleteConfirm({ open: true, blockId })}
                onDurationChange={handleDurationChange}
                isOver={overSection === 'main'}
              />

              <DroppableSection
                section="game"
                title="Game Play"
                duration={sectionDurations.game}
                blocks={blocksBySection.game}
                globalStartIndex={blocksBySection.warmup.length + blocksBySection.main.length}
                onDeleteBlock={(blockId) => setDeleteConfirm({ open: true, blockId })}
                onDurationChange={handleDurationChange}
                isOver={overSection === 'game'}
              />
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          <DragOverlayContent active={activeItem} />
        </DragOverlay>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ open, blockId: null })}
          onConfirm={handleDeleteBlock}
          title="Remove Block"
          description="Are you sure you want to remove this block from the plan?"
        />
      </div>
    </DndContext>
  );
}
