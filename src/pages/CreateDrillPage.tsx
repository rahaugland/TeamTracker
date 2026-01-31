import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { createDrill } from '@/services/drills.service';
import { DrillForm } from '@/components/forms/DrillForm';
import type { DrillFormData } from '@/lib/validations/drill';
import { Button } from '@/components/ui/button';

/**
 * CreateDrillPage
 * Page for creating a new drill
 */
export function CreateDrillPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (data: DrillFormData) => {
    if (!user?.id) return;

    try {
      const newDrill = await createDrill({
        name: data.name,
        description: data.description,
        skill_tags: data.skill_tags,
        custom_tags: data.custom_tags,
        progression_level: data.progression_level as 1 | 2 | 3 | 4 | 5,
        parent_drill_id: data.parent_drill_id || undefined,
        min_players: data.min_players || undefined,
        max_players: data.max_players || undefined,
        equipment_needed: data.equipment_needed,
        duration_minutes: data.duration_minutes || undefined,
        video_url: data.video_url || undefined,
        created_by: user.id,
      });

      navigate(`/drills/${newDrill.id}`);
    } catch (error) {
      console.error('Error creating drill:', error);
    }
  };

  const handleCancel = () => {
    navigate('/drills');
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={handleCancel} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('drill.addDrill')}</h1>
        <p className="text-muted-foreground">
          Create a new drill for your library
        </p>
      </div>

      <DrillForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
