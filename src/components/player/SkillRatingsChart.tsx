import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillRating, SkillRatingType } from '@/types/database.types';

interface SkillRatingsChartProps {
  ratings: SkillRating[];
}

const SKILL_COLORS: Record<SkillRatingType, string> = {
  serve: 'bg-blue-500',
  pass: 'bg-green-500',
  attack: 'bg-red-500',
  block: 'bg-purple-500',
  set: 'bg-yellow-500',
  defense: 'bg-orange-500',
};

const SKILLS: SkillRatingType[] = ['serve', 'pass', 'attack', 'block', 'set', 'defense'];

/**
 * Displays skill ratings as a visual bar chart
 * Shows the latest rating for each skill type
 */
export function SkillRatingsChart({ ratings }: SkillRatingsChartProps) {
  const { t } = useTranslation();

  // Get the latest rating for each skill type
  const latestRatings = SKILLS.map((skillType) => {
    const skillRatings = ratings
      .filter((r) => r.skill_type === skillType)
      .sort((a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime());

    return {
      skill: skillType,
      rating: skillRatings[0]?.rating || 0,
      hasRating: skillRatings.length > 0,
    };
  });

  const hasAnyRatings = latestRatings.some(r => r.hasRating);

  if (!hasAnyRatings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.skills.noRatings')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playerExperience.skills.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {latestRatings.map(({ skill, rating, hasRating }) => (
            <div key={skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">
                  {t(`playerExperience.skills.${skill}`)}
                </span>
                <span className="text-muted-foreground">
                  {hasRating ? `${rating}/10` : '-'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {hasRating && (
                  <div
                    className={`h-full ${SKILL_COLORS[skill]} transition-all duration-500`}
                    style={{ width: `${(rating / 10) * 100}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
