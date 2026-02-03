import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { getDrills, searchDrills, getDrillsBySkillTag, getDrillsByLevel } from '@/services/drills.service';
import { getProgressionMetrics } from '@/services/drill-executions.service';
import type { Drill, SkillTag } from '@/types/database.types';
import { SKILL_TAGS } from '@/types/database.types';

/**
 * DrillsPage
 * Displays the drill library with search and filtering capabilities
 */
export function DrillsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [progressionStatus, setProgressionStatus] = useState<Record<string, boolean>>({});

  const loadDrills = async () => {
    setLoading(true);
    try {
      let result: Drill[] = [];

      if (searchQuery.trim()) {
        result = await searchDrills(searchQuery);
      } else if (skillFilter !== 'all') {
        result = await getDrillsBySkillTag(skillFilter as SkillTag);
      } else if (levelFilter !== 'all') {
        result = await getDrillsByLevel(parseInt(levelFilter) as 1 | 2 | 3 | 4 | 5);
      } else {
        result = await getDrills();
      }

      // Apply additional filters if both are set
      if (skillFilter !== 'all' && levelFilter !== 'all') {
        result = result.filter((drill) => drill.progression_level === parseInt(levelFilter));
      }

      setDrills(result);

      // Load progression status for each drill (simplified - would need team context in real app)
      // For now, just mark as not ready
      const status: Record<string, boolean> = {};
      for (const drill of result) {
        status[drill.id] = false; // Would call getProgressionMetrics with team_id
      }
      setProgressionStatus(status);
    } catch (error) {
      console.error('Error loading drills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, skillFilter, levelFilter]);

  const handleCreateDrill = () => {
    navigate('/drills/new');
  };

  const handleDrillClick = (drillId: string) => {
    navigate(`/drills/${drillId}`);
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
            <h1 className="text-3xl font-bold">{t('drill.library')}</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage your drill library
            </p>
          </div>
          <Button onClick={handleCreateDrill}>
            {t('drill.addDrill')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('drill.searchDrills')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('drill.filterBySkill')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.labels.all')}</SelectItem>
              {SKILL_TAGS.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {t(`drill.skills.${skill.replace('-', '')}` as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('drill.filterByLevel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.labels.all')}</SelectItem>
              {[1, 2, 3, 4, 5].map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  Level {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drill List */}
        {drills.length === 0 ? (
          <EmptyState
            title={t('drill.noDrills')}
            description={t('drill.noDrillsDescription')}
            action={{
              label: t('drill.addDrill'),
              onClick: handleCreateDrill,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drills.map((drill) => (
              <Card
                key={drill.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleDrillClick(drill.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{drill.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Level {drill.progression_level}
                      </CardDescription>
                    </div>
                    {progressionStatus[drill.id] && (
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 rounded-full">
                        {t('drill.advanceBadge')}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {drill.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {drill.skill_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                      >
                        {t(`drill.skills.${tag.replace('-', '')}` as any)}
                      </span>
                    ))}
                    {drill.skill_tags.length > 3 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground">
                        +{drill.skill_tags.length - 3}
                      </span>
                    )}
                  </div>
                  {drill.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {drill.duration_minutes} min
                      {drill.min_players && ` • ${drill.min_players}-${drill.max_players || '∞'} players`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
