import { useState, useEffect, useCallback } from 'react';
import { getAnnouncementsForTeams } from '@/services/announcements.service';
import type { AnnouncementWithAuthor } from '@/services/announcements.service';

export function useAnnouncements(teamIds: string[]) {
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!teamIds || teamIds.length === 0) {
      setAnnouncements([]);
      setPinnedAnnouncements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getAnnouncementsForTeams(teamIds);
      setAnnouncements(result);
      setPinnedAnnouncements(result.filter(announcement => announcement.pinned));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
      setPinnedAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(teamIds)]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return {
    announcements,
    pinnedAnnouncements,
    isLoading,
    refetch: fetchAnnouncements
  };
}
