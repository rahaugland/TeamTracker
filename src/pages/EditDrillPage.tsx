import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDrill, updateDrill } from '@/services/drills.service';
import { DrillForm } from '@/components/forms/DrillForm';
import type { DrillFormData } from '@/lib/validations/drill';
import type { Drill } from '@/types/database.types';
import { Button } from '@/components/ui/button';

/**
 * EditDrillPage
 * Page for editing an existing drill
 */
export function EditDrillPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDrill(id);
    }
  }, [id]);

  const loadDrill = async (drillId: string) => {
    setLoading(true);
    try {
      const drillData = await getDrill(drillId);
      setDrill(drillData);
    } catch (error) {
      console.error('Error loading drill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: DrillFormData) => {
    if (!id) return;

    try {
      await updateDrill(id, {
        name: data.name,
        description: data.description,
        skill_tags: data.skill_tags,
        custom_tags: data.custom_tags,
        progression_level: data.progression_level as 1 | 2 | 3 | 4 | 5 | undefined,
        parent_drill_id: data.parent_drill_id || undefined,
        min_players: data.min_players || undefined,
        max_players: data.max_players || undefined,
        equipment_needed: data.equipment_needed,
        duration_minutes: data.duration_minutes || undefined,
        video_url: data.video_url || undefined,
      });

      navigate(`/drills/${id}`);
    } catch (error) {
      console.error('Error updating drill:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/drills/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Drill not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={handleCancel} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('drill.editDrill')}</h1>
        <p className="text-muted-foreground">
          Update drill information
        </p>
      </div>

      <DrillForm
        defaultValues={{
          name: drill.name,
          description: drill.description,
          skill_tags: drill.skill_tags,
          custom_tags: drill.custom_tags,
          progression_level: drill.progression_level,
          parent_drill_id: drill.parent_drill_id,
          min_players: drill.min_players,
          max_players: drill.max_players,
          equipment_needed: drill.equipment_needed,
          duration_minutes: drill.duration_minutes,
          video_url: drill.video_url || '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
