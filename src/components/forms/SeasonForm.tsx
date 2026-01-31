import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { seasonSchema, type SeasonFormData } from '@/lib/validations/team';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Season } from '@/types/database.types';

interface SeasonFormProps {
  season?: Season | null;
  onSubmit: (data: SeasonFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * SeasonForm component
 * Form for creating and editing seasons
 */
export function SeasonForm({ season, onSubmit, onCancel, isLoading }: SeasonFormProps) {
  const { t } = useTranslation();

  const form = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      name: season?.name || '',
      startDate: season?.start_date?.split('T')[0] || '',
      endDate: season?.end_date?.split('T')[0] || '',
    },
  });

  const handleSubmit = async (data: SeasonFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('season.seasonName')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Fall 2024"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('season.startDate')}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('season.endDate')}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common.buttons.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.messages.saving') : t('common.buttons.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
