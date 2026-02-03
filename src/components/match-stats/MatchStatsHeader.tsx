import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SetScore {
  home: number;
  away: number;
}

export interface MatchStatsHeaderProps {
  teamName: string;
  teamInitials: string;
  opponent: string;
  opponentInitials: string;
  eventType: string;
  startTime: string;
  location?: string;
  setsWon: number;
  setsLost: number;
  setScores: SetScore[];
  onScoreChange: (setsWon: number, setsLost: number) => void;
  onSetScoresChange: (setScores: SetScore[]) => void;
  className?: string;
}

/**
 * MatchStatsHeader component
 * Match header with team badges, score inputs, and set scores
 */
export function MatchStatsHeader({
  teamName,
  teamInitials,
  opponent,
  opponentInitials,
  eventType,
  startTime,
  location,
  setsWon,
  setsLost,
  setScores,
  onScoreChange,
  onSetScoresChange,
  className,
}: MatchStatsHeaderProps) {
  const startDate = new Date(startTime);
  const dateStr = format(startDate, 'EEEE, MMMM d, yyyy');
  const timeStr = format(startDate, 'HH:mm');

  const getEventTypeLabel = () => {
    switch (eventType) {
      case 'game':
        return 'League Match';
      case 'tournament':
        return 'Tournament';
      default:
        return eventType;
    }
  };

  const handleSetScoreChange = (index: number, field: 'home' | 'away', value: number) => {
    const newSetScores = [...setScores];
    newSetScores[index] = { ...newSetScores[index], [field]: Math.max(0, value) };
    onSetScoresChange(newSetScores);

    // Recalculate sets won/lost
    const won = newSetScores.filter(s => s.home > s.away).length;
    const lost = newSetScores.filter(s => s.away > s.home).length;
    onScoreChange(won, lost);
  };

  const addSet = () => {
    if (setScores.length < 5) {
      onSetScoresChange([...setScores, { home: 0, away: 0 }]);
    }
  };

  const removeSet = (index: number) => {
    const newSetScores = setScores.filter((_, i) => i !== index);
    onSetScoresChange(newSetScores);

    // Recalculate sets won/lost
    const won = newSetScores.filter(s => s.home > s.away).length;
    const lost = newSetScores.filter(s => s.away > s.home).length;
    onScoreChange(won, lost);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg p-6 md:p-8',
        'bg-gradient-to-br from-vq-teal to-teal-600',
        className
      )}
    >
      {/* Decorative blur element */}
      <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/10 blur-[60px]" />

      <div className="relative z-10">
        {/* Event Type Badge */}
        <span className="inline-block font-display font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/20 text-white mb-4">
          {getEventTypeLabel()}
        </span>

        {/* Title */}
        <h1 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-wide mb-2 text-white">
          Record Match Stats
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mb-6">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {dateStr}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {timeStr}
          </span>
          {location && (
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
          )}
        </div>

        {/* Score Section */}
        <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-6 border-t border-white/15">
          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="font-display font-extrabold text-base text-white">
                {teamInitials}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-wider">Home</p>
              <p className="font-display font-bold text-sm uppercase text-white">
                {teamName}
              </p>
            </div>
          </div>

          {/* Score Inputs */}
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={5}
              value={setsWon}
              onChange={(e) => onScoreChange(parseInt(e.target.value) || 0, setsLost)}
              className="w-16 h-14 text-center font-mono font-bold text-2xl bg-white/15 border-white/30 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="font-display font-extrabold text-xl text-white/50">:</span>
            <Input
              type="number"
              min={0}
              max={5}
              value={setsLost}
              onChange={(e) => onScoreChange(setsWon, parseInt(e.target.value) || 0)}
              className="w-16 h-14 text-center font-mono font-bold text-2xl bg-white/15 border-white/30 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center">
              <span className="font-display font-extrabold text-base text-blue-300">
                {opponentInitials}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-white/60 uppercase tracking-wider">Away</p>
              <p className="font-display font-bold text-sm uppercase text-white">
                {opponent}
              </p>
            </div>
          </div>

        </div>

        {/* Set Scores Section */}
        <div className="mt-6 pt-6 border-t border-white/15">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-white/70">
              Set Scores
            </span>
            {setScores.length < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSet}
                className="text-white/70 hover:text-white hover:bg-white/10 h-7 px-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Set
              </Button>
            )}
          </div>

          {setScores.length === 0 ? (
            <p className="text-sm text-white/50 italic">No sets recorded yet. Click "Add Set" to start.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {setScores.map((score, idx) => {
                const isWin = score.home > score.away;
                const isLoss = score.away > score.home;
                const isDraw = score.home === score.away && score.home > 0;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg',
                      isWin && 'bg-green-500/20',
                      isLoss && 'bg-red-500/20',
                      !isWin && !isLoss && 'bg-white/10'
                    )}
                  >
                    <span className="font-display font-bold text-xs text-white/60 w-8">
                      Set {idx + 1}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={score.home}
                      onChange={(e) => handleSetScoreChange(idx, 'home', parseInt(e.target.value) || 0)}
                      className="w-12 h-8 text-center font-mono font-bold text-sm bg-white/10 border-white/20 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="font-mono text-white/50">-</span>
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={score.away}
                      onChange={(e) => handleSetScoreChange(idx, 'away', parseInt(e.target.value) || 0)}
                      className="w-12 h-8 text-center font-mono font-bold text-sm bg-white/10 border-white/20 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeSet(idx)}
                      className="p-1 text-white/40 hover:text-white/80 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
