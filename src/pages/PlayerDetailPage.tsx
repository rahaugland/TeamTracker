import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useTeams } from '@/store';
import { getPlayer } from '@/services/players.service';
import { getPlayerNotes, createCoachNote, deleteCoachNote } from '@/services/coach-notes.service';
import { getPlayerStats, calculatePlayerRating, type PlayerRating as PlayerRatingType } from '@/services/player-stats.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { POSITION_NAMES, type VolleyballPosition } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { CoachNoteWithAuthor } from '@/services/coach-notes.service';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AddToTeamModal } from '@/components/modals/AddToTeamModal';
import { PlayerAwardsHighlight } from '@/components/player-stats/PlayerAwardsHighlight';
import { SkillRatingsPanel } from '@/components/player-stats/SkillRatingsPanel';
import { AttendanceTabContent } from '@/components/player-stats/AttendanceTabContent';
import { StatsHistoryTabContent } from '@/components/player-stats/StatsHistoryTabContent';
import { cn } from '@/lib/utils';
import { FifaPlayerCard } from '@/components/player/FifaPlayerCard';
import {
  calculatePlayerTier,
  calculateRatingChange,
  mapPlayerRatingToSkills,
  getPlayerInitials,
} from '@/components/player/FifaPlayerCard.example';


/**
 * PlayerDetailPage component
 * Shows player profile, history, coach notes, reviews, and skill ratings
 */
// Stats interface for the player card
interface PlayerQuickStats {
  attendancePercent: number;
  totalKills: number;
  totalAces: number;
  totalBlocks: number;
  gamesPlayed: number;
  rating: number;
}

// Using PlayerRating from player-stats service

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeTeamId } = useTeams();

  const [player, setPlayer] = useState<PlayerWithMemberships | null>(null);
  const [notes, setNotes] = useState<CoachNoteWithAuthor[]>([]);
  const [stats, setStats] = useState<PlayerQuickStats | null>(null);
  const [playerRating, setPlayerRating] = useState<PlayerRatingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<{ open: boolean; noteId: string | null }>({
    open: false,
    noteId: null,
  });
  const [showAddToTeamModal, setShowAddToTeamModal] = useState(false);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';
  const isPlayer = user?.role === 'player';
  const [activeTab, setActiveTab] = useState<'overview' | 'stats-history' | 'attendance' | 'notes'>('overview');

  useEffect(() => {
    if (id) {
      loadPlayerData(id);
    }
  }, [id]);

  // Players can only view their own profile - redirect if viewing another player
  useEffect(() => {
    if (isPlayer && player && player.user_id !== user?.id) {
      navigate('/player-dashboard', { replace: true });
    }
  }, [isPlayer, player, user?.id, navigate]);

  const loadPlayerData = async (playerId: string) => {
    setIsLoading(true);
    setIsLoadingStats(true);
    try {
      const [playerData, notesData] = await Promise.all([
        getPlayer(playerId),
        isCoach ? getPlayerNotes(playerId) : Promise.resolve([]),
      ]);

      setPlayer(playerData);
      setNotes(notesData);
      setIsLoading(false);

      if (!playerData) {
        setIsLoadingStats(false);
        return;
      }

      // Load stats in background
      try {
        const primaryPosition = playerData.positions[0] || 'all_around';
        const [gameStats, attendanceRecords] = await Promise.all([
          getPlayerStats(playerId, 'career', undefined, activeTeamId || undefined),
          getPlayerAttendance(playerId),
        ]);

        // Calculate attendance
        const recentRecords = attendanceRecords.slice(0, 20);
        const presentCount = recentRecords.filter(
          r => r.status === 'present' || r.status === 'late'
        ).length;
        const attendancePercent = recentRecords.length > 0
          ? Math.round((presentCount / recentRecords.length) * 100)
          : 0;

        // Calculate rating and aggregate stats
        let rating = 0;
        let totalKills = 0;
        let totalAces = 0;
        let totalBlocks = 0;

        if (gameStats.length > 0) {
          const calculatedRating = calculatePlayerRating(gameStats, primaryPosition);
          rating = calculatedRating.overall;
          totalKills = calculatedRating.aggregatedStats.totalKills;
          totalAces = calculatedRating.aggregatedStats.totalAces;
          totalBlocks = calculatedRating.aggregatedStats.totalBlockSolos + calculatedRating.aggregatedStats.totalBlockAssists;

          // Store the rating data for the FIFA card
          setPlayerRating(calculatedRating);
        }

        setStats({
          attendancePercent,
          totalKills,
          totalAces,
          totalBlocks,
          gamesPlayed: gameStats.length,
          rating,
        });
      } catch (statsError) {
        console.error('Error loading player stats:', statsError);
        setStats(null);
      } finally {
        setIsLoadingStats(false);
      }
    } catch (error) {
      console.error('Error loading player data:', error);
      setIsLoading(false);
      setIsLoadingStats(false);
    }
  };

  const handleCreateNote = async () => {
    if (!id || !user?.id || !noteContent.trim()) return;

    setIsSavingNote(true);
    try {
      const newNote = await createCoachNote({
        player_id: id,
        author_id: user.id,
        content: noteContent.trim(),
      });

      setNotes([
        {
          ...newNote,
          author: {
            id: user.id,
            full_name: user.name,
            avatar_url: user.avatarUrl,
          },
        },
        ...notes,
      ]);
      setNoteContent('');
      setShowNoteDialog(false);
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteConfirm.noteId) return;

    try {
      await deleteCoachNote(deleteNoteConfirm.noteId);
      setNotes(notes.filter((n) => n.id !== deleteNoteConfirm.noteId));
      setDeleteNoteConfirm({ open: false, noteId: null });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleAddToTeamSuccess = () => {
    if (id) {
      loadPlayerData(id);
    }
  };

  // Helper function to get position abbreviation
  const getPositionAbbr = (position: VolleyballPosition): string => {
    const abbr: Record<VolleyballPosition, string> = {
      setter: 'SET',
      outside_hitter: 'OH',
      middle_blocker: 'MB',
      opposite: 'OPP',
      libero: 'LIB',
      defensive_specialist: 'DS',
      all_around: 'ALL',
    };
    return abbr[position];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    );
  }

  const activeTeams = player.team_memberships.filter((m) => m.is_active);
  const pastTeams = player.team_memberships.filter((m) => !m.is_active);
  const primaryPosition = player.positions[0];
  const jerseyNumber = activeTeams[0]?.jersey_number;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/coach-dashboard" className="text-gray-400 hover:text-vq-teal transition-colors">
          Dashboard
        </Link>
        <span className="text-gray-500">/</span>
        <Link to="/players" className="text-gray-400 hover:text-vq-teal transition-colors">
          Players
        </Link>
        <span className="text-gray-500">/</span>
        <span className="text-white">{player.name}</span>
      </nav>

      {/* Player Hero Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* FIFA-Style Player Card */}
        <div className="flex-shrink-0">
          {isLoadingStats ? (
            <div className="w-[280px] h-[420px] rounded-lg bg-gradient-to-br from-[#2a1f0a] via-[#1a1508] to-[#2a1a05] border border-club-secondary/30 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : playerRating ? (
            <FifaPlayerCard
              playerName={player.name}
              initials={getPlayerInitials(player.name)}
              overallRating={playerRating.overall}
              position={primaryPosition ? getPositionAbbr(primaryPosition) : 'ALL'}
              tier={calculatePlayerTier(playerRating.overall)}
              clubName={activeTeams[0]?.team.name || 'Free Agent'}
              skills={mapPlayerRatingToSkills(playerRating)}
              avatarUrl={player.photo_url || undefined}
            />
          ) : (
            <div className="w-[280px] h-[420px] rounded-lg bg-gradient-to-br from-[#2a1f0a] via-[#1a1508] to-[#2a1a05] border border-club-secondary/30 flex items-center justify-center">
              <p className="text-gray-500">No stats available</p>
            </div>
          )}
        </div>

        {/* Player Info Panel */}
        <div className="flex-1">
          <h1 className="font-display font-extrabold text-[42px] uppercase tracking-tight text-white leading-none mb-2">
            {player.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
            <span>{player.positions.map((pos) => POSITION_NAMES[pos]).join(', ')}</span>
            {jerseyNumber && (
              <>
                <span>•</span>
                <span>#{jerseyNumber}</span>
              </>
            )}
            {player.birth_date && (
              <>
                <span>•</span>
                <span>Age {new Date().getFullYear() - new Date(player.birth_date).getFullYear()}</span>
              </>
            )}
            {activeTeams[0] && (
              <>
                <span>•</span>
                <span>{activeTeams[0].team.name}</span>
              </>
            )}
          </div>

          {/* Skill Ratings Panel */}
          {id && <SkillRatingsPanel playerId={id} teamId={activeTeamId || undefined} />}

          {/* Action Buttons */}
          {isCoach && (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/players/${id}/edit`)}
                className="border-white/20 text-white hover:bg-white/5 font-display font-semibold uppercase tracking-wide"
              >
                {t('common.buttons.edit')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddToTeamModal(true)}
                className="border-vq-teal/30 text-vq-teal hover:bg-vq-teal/10 font-display font-semibold uppercase tracking-wide"
              >
                {t('player.addToTeam')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-3 text-sm font-display font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px',
            activeTab === 'overview'
              ? 'border-club-primary text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('stats-history')}
          className={cn(
            'px-4 py-3 text-sm font-display font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px',
            activeTab === 'stats-history'
              ? 'border-club-primary text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          )}
        >
          Stats History
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            'px-4 py-3 text-sm font-display font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px',
            activeTab === 'attendance'
              ? 'border-club-primary text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          )}
        >
          Attendance
        </button>
        {isCoach && (
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              'px-4 py-3 text-sm font-display font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px',
              activeTab === 'notes'
                ? 'border-club-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            Notes ({notes.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Awards Row - Compact variant */}
          {id && <PlayerAwardsHighlight playerId={id} variant="compact" />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                  Contact Information
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {player.email && (
                  <div>
                    <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Email
                    </p>
                    <p className="text-sm text-white">{player.email}</p>
                  </div>
                )}
                {player.phone && (
                  <div>
                    <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Phone
                    </p>
                    <p className="text-sm text-white">{player.phone}</p>
                  </div>
                )}
                {player.birth_date && (
                  <div>
                    <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Birth Date
                    </p>
                    <p className="text-sm text-white">
                      {new Date(player.birth_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {!player.email && !player.phone && !player.birth_date && (
                  <p className="text-sm text-gray-500">No contact information available</p>
                )}
              </div>
            </div>

            {/* Player Details */}
            <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                  Player Details
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Position(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {player.positions.map((pos) => (
                      <span
                        key={pos}
                        className="font-display font-bold text-[10px] uppercase tracking-wider bg-vq-teal/10 text-vq-teal px-2 py-1 rounded"
                      >
                        {POSITION_NAMES[pos]}
                      </span>
                    ))}
                  </div>
                </div>
                {jerseyNumber && (
                  <div>
                    <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Jersey Number
                    </p>
                    <p className="font-mono font-bold text-2xl text-white">#{jerseyNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team History */}
          <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                Team History
              </h3>
            </div>
            <div>
              {activeTeams.map((membership) => (
                <div key={membership.id} className="p-5 flex items-center justify-between border-b border-white/[0.04] last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-club-primary/10 border border-club-primary/20 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-club-primary">
                        {membership.team.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm uppercase text-white">
                        {membership.team.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {membership.jersey_number && <span>#{membership.jersey_number}</span>}
                        {membership.role === 'captain' && (
                          <span className="font-display font-bold uppercase text-club-secondary bg-club-secondary/15 px-2 py-0.5 rounded-full">
                            Captain
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-display font-semibold uppercase tracking-wider text-gray-500">
                      Member since
                    </p>
                    <p className="text-sm text-white">
                      {new Date(membership.joined_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
              {pastTeams.map((membership) => (
                <div key={membership.id} className="p-5 flex items-center justify-between opacity-60 border-b border-white/[0.04] last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-gray-400">
                        {membership.team.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm uppercase text-white">
                        {membership.team.name}
                      </p>
                      {membership.jersey_number && (
                        <p className="text-xs text-gray-400">#{membership.jersey_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(membership.joined_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })} -{' '}
                      {membership.left_at ? new Date(membership.left_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : 'Present'}
                    </p>
                  </div>
                </div>
              ))}
              {activeTeams.length === 0 && pastTeams.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No team history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats-history' && id && (
        <StatsHistoryTabContent playerId={id} teamId={activeTeamId || undefined} />
      )}

      {activeTab === 'attendance' && id && (
        <AttendanceTabContent playerId={id} teamId={activeTeamId || undefined} />
      )}

      {activeTab === 'notes' && isCoach && (
        <div className="space-y-6">
          {/* Add Note Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowNoteDialog(true)}
              className="bg-club-primary hover:bg-club-primary-dim text-white font-display font-semibold uppercase tracking-wide"
            >
              {t('player.addNote')}
            </Button>
          </div>

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-8 text-center">
              <p className="text-gray-500">No notes yet. Add your first note to track observations and progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.04] flex items-start justify-between">
                    <div>
                      <p className="font-display font-bold text-sm text-white">{note.author.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    {note.author_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteNoteConfirm({ open: true, noteId: note.id })}
                        className="text-gray-400 hover:text-club-primary text-xs"
                      >
                        {t('common.buttons.delete')}
                      </Button>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="bg-navy-90 border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl uppercase text-white">
              {t('player.addNote')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={t('player.noteContent')}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
              className="bg-navy-80 border-white/10 text-white placeholder:text-gray-500"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNoteDialog(false)}
                className="border-white/20 text-white hover:bg-white/5"
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button
                onClick={handleCreateNote}
                disabled={!noteContent.trim() || isSavingNote}
                className="bg-club-primary hover:bg-club-primary-dim"
              >
                {isSavingNote ? t('common.messages.saving') : t('common.buttons.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteNoteConfirm.open}
        onOpenChange={(open) => setDeleteNoteConfirm({ open, noteId: null })}
        title="Delete Note"
        description="Are you sure you want to delete this note?"
        onConfirm={handleDeleteNote}
        variant="destructive"
      />

      {id && (
        <AddToTeamModal
          open={showAddToTeamModal}
          onOpenChange={setShowAddToTeamModal}
          playerId={id}
          onSuccess={handleAddToTeamSuccess}
        />
      )}

    </div>
  );
}
