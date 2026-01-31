import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { statEntrySchema, type StatEntryFormData } from '@/lib/validations/statEntry';
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
import { useTranslation } from 'react-i18next';

interface StatEntryFormProps {
  defaultValues?: Partial<StatEntryFormData>;
  onSubmit: (data: StatEntryFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * StatEntryForm - Form for recording player game statistics
 */
export function StatEntryForm({ defaultValues, onSubmit, onCancel, isSubmitting }: StatEntryFormProps) {
  const { t } = useTranslation();

  const form = useForm<StatEntryFormData>({
    resolver: zodResolver(statEntrySchema),
    defaultValues: {
      kills: 0,
      attack_errors: 0,
      attack_attempts: 0,
      aces: 0,
      service_errors: 0,
      serve_attempts: 0,
      digs: 0,
      block_solos: 0,
      block_assists: 0,
      block_touches: 0,
      set_attempts: 0,
      set_sum: 0,
      setting_errors: 0,
      ball_handling_errors: 0,
      pass_attempts: 0,
      pass_sum: 0,
      rotation: null,
      sets_played: 0,
      rotations_played: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Rotation selector */}
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.rotation')}</h3>
          </div>
          <FormField
            control={form.control}
            name="rotation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('stats.fields.rotation')}</FormLabel>
                <FormDescription className="text-xs">
                  {t('stats.fields.rotationDescription')}
                </FormDescription>
                <Select
                  value={field.value?.toString() ?? 'none'}
                  onValueChange={(val) => field.onChange(val === 'none' ? null : parseInt(val))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('stats.fields.rotationPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t('stats.fields.rotationNone')}</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.attack')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="kills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.kills')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attack_errors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.attackErrors')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attack_attempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.attackAttempts')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.serve')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="aces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.aces')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service_errors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.serviceErrors')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serve_attempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.serveAttempts')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.defense')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="digs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.digs')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_solos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.blockSolos')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_assists"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.blockAssists')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="block_touches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.blockTouches')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.passing')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="pass_attempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.passAttempts')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pass_sum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.passSum')}</FormLabel>
                  <FormDescription className="text-xs">
                    {t('stats.fields.passSumDescription')}
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ball_handling_errors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.ballHandlingErrors')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Setting section */}
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.setting')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="set_attempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.setAttempts')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="set_sum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.setSum')}</FormLabel>
                  <FormDescription className="text-xs">
                    {t('stats.fields.setSumDescription')}
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="setting_errors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.settingErrors')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Playing Time section */}
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-sm text-muted-foreground">{t('stats.categories.playingTime')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sets_played"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.setsPlayed')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rotations_played"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stats.fields.rotationsPlayed')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.buttons.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
            {isSubmitting || form.formState.isSubmitting ? t('common.messages.saving') : t('common.buttons.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
