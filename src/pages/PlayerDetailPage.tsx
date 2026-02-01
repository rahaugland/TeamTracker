import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getPlayer } from '@/services/players.service';
import { getPlayerNotes, createCoachNote, deleteCoachNote } from '@/services/coach-notes.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { POSITION_NAMES } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { CoachNoteWithAuthor } from '@/services/coach-notes.service';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AddToTeamModal } from '@/components/modals/AddToTeamModal';
import { PlayerAwardsHighlight } from '@/components/player-stats/PlayerAwardsHighlight';
import { WriteReviewModal } from '@/components/player/WriteReviewModal';
import { SkillRatingWidget } from '@/components/player/SkillRatingWidget';

/**
 * PlayerDetailPage component
 * Shows player profile, history, coach notes, reviews, and skill ratings
 */
export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [player, setPlayer] = useState<PlayerWithMemberships | null>(null);
  const [notes, setNotes] = useState<CoachNoteWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<{ open: boolean; noteId: string | null }>({
    open: false,
    noteId: null,
  });
  const [showAddToTeamModal, setShowAddToTeamModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  useEffect(() => {
    if (id) {
      loadPlayerData(id);
    }
  }, [id]);

  const loadPlayerData = async (playerId: string) => {
    setIsLoading(true);
    try {
      const [playerData, notesData] = await Promise.all([
        getPlayer(playerId),
        isCoach ? getPlayerNotes(playerId) : Promise.resolve([]),
      ]);

      setPlayer(playerData);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    );
  }

  const activeTeams = player.team_memberships.filter((m) => m.is_active);
  const pastTeams = player.team_memberships.filter((m) => !m.is_active);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate('/players')} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
            <p className="text-muted-foreground">
              {player.positions.map((pos) => POSITION_NAMES[pos]).join(', ')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/players/${id}/stats`)}>
              View Stats
            </Button>
            {isCoach && (
              <>
                <Button variant="outline" onClick={() => navigate(`/players/${id}/edit`)}>
                  {t('common.buttons.edit')}
                </Button>
                <Button onClick={() => setShowAddToTeamModal(true)}>
                  {t('player.addToTeam')}
                </Button>
                <Button variant="outline" onClick={() => setShowReviewModal(true)}>
                  {t('playerExperience.reviews.writeReviewAction')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {id && <PlayerAwardsHighlight playerId={id} />}

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          {isCoach && <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {player.email && (
                <div>
                  <span className="text-sm font-medium">Email:</span>
                  <p className="text-sm text-muted-foreground">{player.email}</p>
                </div>
              )}
              {player.phone && (
                <div>
                  <span className="text-sm font-medium">Phone:</span>
                  <p className="text-sm text-muted-foreground">{player.phone}</p>
                </div>
              )}
              {player.birth_date && (
                <div>
                  <span className="text-sm font-medium">Birth Date:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(player.birth_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {player.photo_url && (
                <div>
                  <span className="text-sm font-medium">Photo:</span>
                  <p className="text-sm text-muted-foreground break-all">{player.photo_url}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {activeTeams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('player.currentTeams')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeTeams.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{membership.team.name}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        {membership.jersey_number && <span>#{membership.jersey_number}</span>}
                        {membership.role === 'captain' && (
                          <span className="font-medium text-primary">{t('player.roles.captain')}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Since {new Date(membership.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {pastTeams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('player.pastTeams')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pastTeams.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between p-2 border rounded opacity-60">
                    <div>
                      <p className="font-medium">{membership.team.name}</p>
                      {membership.jersey_number && (
                        <p className="text-sm text-muted-foreground">#{membership.jersey_number}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(membership.joined_at).toLocaleDateString()} -{' '}
                      {membership.left_at ? new Date(membership.left_at).toLocaleDateString() : 'Present'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isCoach && (
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowNoteDialog(true)}>
                {t('player.addNote')}
              </Button>
            </div>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No notes yet. Add your first note to track observations and progress.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{note.author.full_name}</CardTitle>
                          <CardDescription>
                            {new Date(note.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        {note.author_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteNoteConfirm({ open: true, noteId: note.id })}
                          >
                            {t('common.buttons.delete')}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('player.addNote')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={t('player.noteContent')}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                {t('common.buttons.cancel')}
              </Button>
              <Button onClick={handleCreateNote} disabled={!noteContent.trim() || isSavingNote}>
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

      {id && player && user && isCoach && (
        <>
          <WriteReviewModal
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            playerId={id}
            playerName={player.name}
            teamId={player.team_memberships?.[0]?.team_id || ''}
            authorId={user.id}
            onSaved={() => setShowReviewModal(false)}
          />

          <div className="mt-6">
            <SkillRatingWidget
              playerId={id}
              teamId={player.team_memberships?.[0]?.team_id || ''}
              authorId={user.id}
              onSaved={() => {}}
            />
          </div>
        </>
      )}
    </div>
  );
}
