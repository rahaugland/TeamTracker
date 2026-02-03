import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Target, Lightbulb, MessageSquare } from 'lucide-react';
import type { PlayerGoal } from '@/types/database.types';
import type { FeedbackWithAuthor } from '@/services/player-feedback.service';
import type { SelfAssessmentWithEvent } from '@/services/self-assessment.service';
import type { AttendanceStats } from '@/services/player-stats.service';

interface StreaksMilestonesProps {
  goals: PlayerGoal[];
  feedback: FeedbackWithAuthor[];
  assessments: SelfAssessmentWithEvent[];
  attendanceStats: AttendanceStats | null;
}

export function StreaksMilestones({ goals, feedback, assessments, attendanceStats }: StreaksMilestonesProps) {
  const { t } = useTranslation();

  const completedGoals = goals.filter(g => g.is_completed).length;
  const activeGoals = goals.filter(g => !g.is_completed).length;

  const cards = [
    {
      icon: Flame,
      color: 'text-club-primary',
      bg: 'bg-club-primary/10',
      title: t('playerExperience.progress.currentStreak'),
      value: attendanceStats?.currentStreak ?? 0,
      subtitle: t('playerExperience.progress.bestStreak', { count: attendanceStats?.longestStreak ?? 0 }),
    },
    {
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      title: t('playerExperience.progress.goalsAchieved'),
      value: completedGoals,
      subtitle: t('playerExperience.progress.activeGoals', { count: activeGoals }),
    },
    {
      icon: Lightbulb,
      color: 'text-vq-teal',
      bg: 'bg-vq-teal/10',
      title: t('playerExperience.progress.selfReflections'),
      value: assessments.length,
      subtitle: t('playerExperience.progress.totalReflections'),
    },
    {
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      title: t('playerExperience.progress.feedbackReceived'),
      value: feedback.length,
      subtitle: t('playerExperience.progress.totalFeedback'),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl text-stat font-bold">{card.value}</div>
            <p className="text-sm font-medium text-muted-foreground mt-1">{card.title}</p>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
