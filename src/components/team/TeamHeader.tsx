import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import type { TeamRating, FormStreak } from '@/services/team-stats.service';

interface TeamHeaderProps {
  teamName: string;
  seasonName: string;
  inviteCode?: string;
  teamRating: TeamRating | null;
  formStreak: FormStreak | null;
  isLoading?: boolean;
}

/**
 * TeamHeader component
 * Displays team name, overall rating, and recent form
 */
export function TeamHeader({
  teamName,
  seasonName,
  inviteCode,
  teamRating,
  formStreak,
  isLoading = false,
}: TeamHeaderProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFormResultBadge = (result: 'W' | 'L' | 'D') => {
    if (result === 'W') {
      return (
        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
          {t('team.dashboard.wins')}
        </Badge>
      );
    }
    if (result === 'L') {
      return (
        <Badge className="bg-club-primary text-white hover:bg-club-primary/90">
          {t('team.dashboard.losses')}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">{t('team.dashboard.draws')}</Badge>
    );
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start justify-between">
          {/* Team Info */}
          <div>
            <h1 className="text-3xl font-bold">{teamName}</h1>
            <p className="text-muted-foreground mt-1">{seasonName}</p>
            {inviteCode && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">{t('team.inviteCode')}:</span>
                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{inviteCode}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyCode}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}
          </div>

          {/* Team Rating & Form */}
          <div className="flex items-center gap-6">
            {/* Overall Rating */}
            {teamRating && (
              <div className="text-center">
                <div className="text-4xl font-bold">{teamRating.overall}</div>
                <div className="text-xs text-muted-foreground">
                  {t('team.dashboard.overallRating')}
                </div>
                {teamRating.isProvisional && (
                  <div className="text-xs text-club-secondary mt-1">
                    {t('team.dashboard.provisional')}
                  </div>
                )}
              </div>
            )}

            {/* Form Streak */}
            {formStreak && formStreak.results.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t('team.dashboard.formStreak')}
                </div>
                <div className="flex gap-1">
                  {formStreak.results.map((result, index) => (
                    <div key={index}>{getFormResultBadge(result)}</div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  {t('team.dashboard.winRate')}: {formStreak.winRate}%
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
