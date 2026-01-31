import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { drillSchema, type DrillFormData, skillTags } from '@/lib/validations/drill';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getDrills } from '@/services/drills.service';
import type { Drill } from '@/types/database.types';

interface DrillFormProps {
  defaultValues?: Partial<DrillFormData>;
  onSubmit: (data: DrillFormData) => void;
  onCancel?: () => void;
}

/**
 * DrillForm component
 * Form for creating and editing drills
 */
export function DrillForm({ defaultValues, onSubmit, onCancel }: DrillFormProps) {
  const { t } = useTranslation();
  const [availableDrills, setAvailableDrills] = useState<Drill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(defaultValues?.skill_tags || []);

  const form = useForm<DrillFormData>({
    resolver: zodResolver(drillSchema),
    defaultValues: {
      name: '',
      description: '',
      skill_tags: [],
      custom_tags: [],
      progression_level: 1,
      parent_drill_id: null,
      min_players: null,
      max_players: null,
      equipment_needed: [],
      duration_minutes: null,
      video_url: '',
      ...defaultValues,
    },
  });

  // Load available drills for parent selection
  useEffect(() => {
    getDrills()
      .then(setAvailableDrills)
      .catch((error) => console.error('Error loading drills:', error));
  }, []);

  // Update form when selected skills change
  useEffect(() => {
    form.setValue('skill_tags', selectedSkills);
  }, [selectedSkills, form]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.labels.name')} *</FormLabel>
              <FormControl>
                <Input placeholder="Drill name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.labels.description')} *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the drill..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skill_tags"
          render={() => (
            <FormItem>
              <FormLabel>{t('drill.skillTags')} *</FormLabel>
              <FormDescription>Select all applicable skills</FormDescription>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {skillTags.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-input'
                    }`}
                  >
                    {t(`drill.skills.${skill.replace('-', '')}` as any)}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="progression_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('drill.progressionLevel')} *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_drill_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Drill (Progression)</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  defaultValue={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None (standalone drill)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableDrills.map((drill) => (
                      <SelectItem key={drill.id} value={drill.id}>
                        {drill.name} (L{drill.progression_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a drill this builds upon
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="min_players"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('drill.minPlayers')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="2"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_players"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('drill.maxPlayers')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="12"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('practice.duration')} (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="15"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="equipment_needed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('drill.equipment')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Balls, cones, net (comma separated)"
                  value={field.value?.join(', ') || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                Separate items with commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://youtube.com/..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Link to a demonstration video (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.buttons.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('common.messages.saving') : t('common.buttons.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
