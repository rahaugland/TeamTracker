import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createAnnouncement } from '@/services/announcements.service';
import type { CreateAnnouncementInput } from '@/services/announcements.service';

interface AnnouncementComposerProps {
  teamId: string;
  authorId: string;
  onCreated: () => void;
  onCancel: () => void;
}

/**
 * AnnouncementComposer component
 * Form for coaches to create team announcements
 */
export function AnnouncementComposer({
  teamId,
  authorId,
  onCreated,
  onCancel,
}: AnnouncementComposerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const input: CreateAnnouncementInput = {
        team_id: teamId,
        author_id: authorId,
        title: title.trim(),
        content: content.trim(),
        pinned,
      };

      await createAnnouncement(input);
      onCreated();
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playerExperience.announcements.create')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="announcement-title">
            {t('playerExperience.announcements.title')}
          </Label>
          <Input
            id="announcement-title"
            type="text"
            placeholder={t('playerExperience.announcements.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-content">
            {t('playerExperience.announcements.content')}
          </Label>
          <Textarea
            id="announcement-content"
            placeholder={t('playerExperience.announcements.contentPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSaving}
            rows={5}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="announcement-pinned"
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            disabled={isSaving}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
          />
          <Label htmlFor="announcement-pinned" className="cursor-pointer">
            {t('playerExperience.announcements.pinned')}
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('common.buttons.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !title.trim() || !content.trim()}
        >
          {isSaving ? t('common.messages.saving') : t('common.buttons.save')}
        </Button>
      </CardFooter>
    </Card>
  );
}
