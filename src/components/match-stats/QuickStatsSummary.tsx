import { cn } from '@/lib/utils';

export interface TeamTotals {
  kills: number;
  attackErrors: number;
  attackAttempts: number;
  aces: number;
  serviceErrors: number;
  serveAttempts: number;
  digs: number;
  blockSolos: number;
  blockAssists: number;
  blockTouches: number;
  ballHandlingErrors: number;
  passAttempts: number;
  passSum: number;
  setAttempts: number;
  setSum: number;
  settingErrors: number;
}

export interface QuickStatsSummaryProps {
  totals: TeamTotals;
  className?: string;
}

/**
 * QuickStatsSummary component
 * Horizontal bar showing key team stats at a glance
 */
export function QuickStatsSummary({ totals, className }: QuickStatsSummaryProps) {
  const killPercentage =
    totals.attackAttempts > 0
      ? ((totals.kills - totals.attackErrors) / totals.attackAttempts) * 100
      : 0;

  const passRating =
    totals.passAttempts > 0 ? totals.passSum / totals.passAttempts : 0;

  const totalBlocks = totals.blockSolos + totals.blockAssists * 0.5;

  const totalErrors =
    totals.attackErrors +
    totals.serviceErrors +
    totals.ballHandlingErrors +
    totals.settingErrors;

  const stats = [
    {
      label: 'Team Kills',
      value: totals.kills.toString(),
      color: 'text-green-400',
    },
    {
      label: 'Kill %',
      value: killPercentage.toFixed(1) + '%',
      color: 'text-vq-teal',
    },
    {
      label: 'Aces',
      value: totals.aces.toString(),
      color: 'text-white',
    },
    {
      label: 'Blocks',
      value: totalBlocks.toFixed(0),
      color: 'text-white',
    },
    {
      label: 'Digs',
      value: totals.digs.toString(),
      color: 'text-white',
    },
    {
      label: 'Pass Rating',
      value: passRating.toFixed(2),
      color: 'text-yellow-400',
    },
    {
      label: 'Errors',
      value: totalErrors.toString(),
      color: 'text-red-400',
    },
  ];

  return (
    <div
      className={cn(
        'flex gap-6 p-4 overflow-x-auto',
        'bg-navy-90 border border-white/5 rounded-lg',
        'scrollbar-thin scrollbar-thumb-white/10',
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center min-w-[80px] flex-shrink-0"
        >
          <span className={cn('font-mono font-bold text-2xl', stat.color)}>
            {stat.value}
          </span>
          <span className="font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
