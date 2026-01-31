import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, type EventFormData, eventTypes } from '@/lib/validations/event';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

interface EventFormProps {
  defaultValues?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  onCancel?: () => void;
}

/**
 * EventForm - Example form with conditional validation
 * Shows how opponent field becomes required when type is "game"
 */
export function EventForm({ defaultValues, onSubmit, onCancel }: EventFormProps) {
  const { t } = useTranslation();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      type: 'practice',
      startTime: '',
      endTime: '',
      location: '',
      opponent: '',
      notes: '',
      isRecurring: false,
      recurringDays: [],
      recurringWeeks: 4,
      ...defaultValues,
    },
  });

  const eventType = form.watch('type');
  const isRecurring = form.watch('isRecurring');
  const recurringDays = form.watch('recurringDays') || [];
  const recurringWeeks = form.watch('recurringWeeks') || 4;
  const startTime = form.watch('startTime');

  // Calculate preview dates for recurring events
  const recurringPreview = useMemo(() => {
    if (!isRecurring || !startTime || recurringDays.length === 0) {
      return null;
    }

    const startDate = new Date(startTime);
    const dates: Date[] = [];
    const weeksToGenerate = recurringWeeks;

    // Generate dates for selected days
    for (let week = 0; week < weeksToGenerate; week++) {
      recurringDays.forEach((dayOfWeek) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() - date.getDay() + dayOfWeek + (week * 7));

        // Only include dates that are on or after the start date
        if (date >= startDate) {
          dates.push(date);
        }
      });
    }

    // Sort dates chronologically
    dates.sort((a, b) => a.getTime() - b.getTime());

    return dates;
  }, [isRecurring, startTime, recurringDays, recurringWeeks]);

  const formatPreviewDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleRecurringDay = (day: number) => {
    const currentDays = recurringDays || [];
    if (currentDays.includes(day)) {
      form.setValue('recurringDays', currentDays.filter(d => d !== day));
    } else {
      form.setValue('recurringDays', [...currentDays, day].sort());
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.labels.title')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('event.singular') + ' ' + t('common.labels.title')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('event.form.type')} *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`event.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('event.startTime')} *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('event.endTime')} *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.labels.location')}</FormLabel>
              <FormControl>
                <Input placeholder={t('event.form.locationPlaceholder')} {...field} />
              </FormControl>
              {field.value && (
                <FormDescription>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.value)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {t('event.form.previewOnMaps')}
                  </a>
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {(eventType === 'game' || eventType === 'tournament') && (
          <>
            <FormField
              control={form.control}
              name="opponent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('event.opponent')} *</FormLabel>
                  <FormDescription>
                    {t('event.form.requiredForGames')}
                  </FormDescription>
                  <FormControl>
                    <Input placeholder={t('event.form.opponentPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opponentTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('event.opponentTier.label')}</FormLabel>
                  <FormDescription>
                    {t('event.opponentTier.description')}
                  </FormDescription>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('event.opponentTier.placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t('event.opponentTier.tier1')}</SelectItem>
                      <SelectItem value="2">{t('event.opponentTier.tier2')}</SelectItem>
                      <SelectItem value="3">{t('event.opponentTier.tier3')}</SelectItem>
                      <SelectItem value="4">{t('event.opponentTier.tier4')}</SelectItem>
                      <SelectItem value="5">{t('event.opponentTier.tier5')}</SelectItem>
                      <SelectItem value="6">{t('event.opponentTier.tier6')}</SelectItem>
                      <SelectItem value="7">{t('event.opponentTier.tier7')}</SelectItem>
                      <SelectItem value="8">{t('event.opponentTier.tier8')}</SelectItem>
                      <SelectItem value="9">{t('event.opponentTier.tier9')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.labels.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('event.form.notesPlaceholder')}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {eventType === 'practice' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('event.recurring.enable')}
                  </label>
                </FormItem>
              )}
            />

            {isRecurring && (
              <>
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('event.recurring.selectDays')}
                  </label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      { day: 0, key: 'calendar.days.sun' as const },
                      { day: 1, key: 'calendar.days.mon' as const },
                      { day: 2, key: 'calendar.days.tue' as const },
                      { day: 3, key: 'calendar.days.wed' as const },
                      { day: 4, key: 'calendar.days.thu' as const },
                      { day: 5, key: 'calendar.days.fri' as const },
                      { day: 6, key: 'calendar.days.sat' as const },
                    ].map(({ day, key }) => (
                      <Button
                        key={day}
                        type="button"
                        variant={recurringDays.includes(day) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleRecurringDay(day)}
                      >
                        {t(key)}
                      </Button>
                    ))}
                  </div>
                  {recurringDays.length === 0 && (
                    <p className="text-sm text-destructive mt-2">{t('event.recurring.selectAtLeastOneDay')}</p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="recurringWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('event.recurring.duration')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 4)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('event.recurring.weeksDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recurringPreview && recurringPreview.length > 0 && (
                  <div className="p-3 bg-background rounded-md border">
                    <p className="text-sm font-medium mb-2">
                      {t('event.recurring.preview', { count: recurringPreview.length })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {recurringPreview.slice(0, 5).map(formatPreviewDate).join(', ')}
                      {recurringPreview.length > 5 && ` ${t('event.recurring.andMore', { count: recurringPreview.length - 5 })}`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
