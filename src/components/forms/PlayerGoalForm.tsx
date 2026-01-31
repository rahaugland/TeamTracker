import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerGoalSchema, type PlayerGoalFormData } from '@/lib/validations/playerGoal';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface PlayerGoalFormProps {
  defaultValues?: Partial<PlayerGoalFormData>;
  onSubmit: (data: PlayerGoalFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function PlayerGoalForm({ defaultValues, onSubmit, onCancel, isSubmitting }: PlayerGoalFormProps) {
  const { t } = useTranslation();

  const form = useForm<PlayerGoalFormData>({
    resolver: zodResolver(playerGoalSchema),
    defaultValues: {
      title: '',
      description: '',
      metric_type: 'custom',
      target_value: 0,
      deadline: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goals.fields.title')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('goals.fields.titlePlaceholder')} />
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
              <FormLabel>{t('goals.fields.description')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('goals.fields.descriptionPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metric_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goals.fields.metricType')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="kill_pct">{t('goals.metricTypes.kill_pct')}</SelectItem>
                  <SelectItem value="pass_rating">{t('goals.metricTypes.pass_rating')}</SelectItem>
                  <SelectItem value="serve_pct">{t('goals.metricTypes.serve_pct')}</SelectItem>
                  <SelectItem value="attendance">{t('goals.metricTypes.attendance')}</SelectItem>
                  <SelectItem value="custom">{t('goals.metricTypes.custom')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goals.fields.targetValue')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('goals.fields.deadline')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.buttons.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.messages.saving') : t('common.buttons.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
