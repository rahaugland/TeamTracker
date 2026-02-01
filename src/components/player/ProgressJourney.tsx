import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, MessageSquare, Star, Trophy } from 'lucide-react';
import type { PlayerGoal } from '@/types/database.types';
import type { FeedbackWithAuthor } from '@/services/player-feedback.service';
import type { SelfAssessmentWithEvent } from '@/services/self-assessment.service';
import { getPlayerAwards } from '@/services/player-awards.service';

interface ProgressJourneyProps {
  goals: PlayerGoal[];
  feedback: FeedbackWithAuthor[];
  assessments: SelfAssessmentWithEvent[];
  playerId?: string;
}

type EntryType = 'goal_created' | 'goal_completed' | 'feedback' | 'assessment' | 'game_award' | 'season_award';

interface TimelineEntry {
  id: string;
  type: EntryType;
  date: string;
  title: string;
  description?: string;
}

const ENTRY_CONFIG: Record<EntryType, { icon: typeof Target; color: string; bg: string }> = {
  goal_created: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500' },
  goal_completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500' },
  feedback: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500' },
  assessment: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  game_award: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  season_award: { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-600' },
};

const PAGE_SIZE = 15;

export function ProgressJourney({ goals, feedback, assessments, playerId }: ProgressJourneyProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [awardEntries, setAwardEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    getPlayerAwards(playerId).then((summary) => {
      if (cancelled) return;
      const entries: TimelineEntry[] = [];
      for (const a of summary.gameAwards) {
        entries.push({
          id: `game-award-${a.id}`,
          type: 'game_award',
          date: a.event_date,
          title: t('playerExperience.progress.journeyGameAward', {
            award: t(`awards.types.${a.award_type}`),
            opponent: a.opponent || a.event_title,
          }),
        });
      }
      for (const a of summary.seasonAwards) {
        entries.push({
          id: `season-award-${a.id}`,
          type: 'season_award',
          date: a.season_end,
          title: t('playerExperience.progress.journeySeasonAward', {
            award: t(`awards.types.${a.award_type}`),
            season: a.season_name,
          }),
        });
      }
      setAwardEntries(entries);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [playerId, t]);

  const entries: TimelineEntry[] = [];

  for (const goal of goals) {
    entries.push({
      id: `goal-created-${goal.id}`,
      type: 'goal_created',
      date: goal.created_at,
      title: t('playerExperience.progress.journeyGoalCreated'),
      description: goal.title,
    });
    if (goal.is_completed && goal.completed_at) {
      entries.push({
        id: `goal-completed-${goal.id}`,
        type: 'goal_completed',
        date: goal.completed_at,
        title: t('playerExperience.progress.journeyGoalCompleted'),
        description: goal.title,
      });
    }
  }

  for (const fb of feedback) {
    entries.push({
      id: `feedback-${fb.id}`,
      type: 'feedback',
      date: fb.created_at,
      title: t('playerExperience.progress.journeyFeedback', { author: fb.author.full_name }),
      description: fb.content,
    });
  }

  for (const a of assessments) {
    entries.push({
      id: `assessment-${a.id}`,
      type: 'assessment',
      date: a.created_at,
      title: t('playerExperience.progress.journeyAssessment'),
      description: `${a.event.title} — ${a.rating}/5${a.notes ? `: ${a.notes}` : ''}`,
    });
  }

  entries.push(...awardEntries);
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (entries.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          {t('playerExperience.progress.journeyEmpty')}
        </p>
      </div>
    );
  }

  const visible = entries.slice(0, visibleCount);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t('playerExperience.progress.journeyTitle')}</h3>
      <div className="relative border-l-2 border-muted ml-4 space-y-6">
        {visible.map((entry) => {
          const config = ENTRY_CONFIG[entry.type];
          const Icon = config.icon;
          return (
            <div key={entry.id} className="relative pl-8">
              <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ${config.bg} flex items-center justify-center`}>
                <Icon className="h-2.5 w-2.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{entry.title}</p>
                {entry.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{entry.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount < entries.length && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          {t('playerExperience.progress.showMore')}
        </Button>
      )}
    </div>
  );
}
