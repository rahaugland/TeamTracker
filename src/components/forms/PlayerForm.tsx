import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerSchemaNew, type PlayerFormDataNew, volleyballPositions } from '@/lib/validations/playerNew';
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
import { useTranslation } from 'react-i18next';

interface PlayerFormProps {
  defaultValues?: Partial<PlayerFormDataNew>;
  onSubmit: (data: PlayerFormDataNew) => void;
  onCancel?: () => void;
}

/**
 * PlayerForm - Demonstrates form validation with React Hook Form and Zod
 * Integrates with shadcn/ui components and i18n
 */
export function PlayerForm({ defaultValues, onSubmit, onCancel }: PlayerFormProps) {
  const { t } = useTranslation();

  const form = useForm<PlayerFormDataNew>({
    resolver: zodResolver(playerSchemaNew),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      positions: [],
      photoUrl: '',
      ...defaultValues,
    },
  });

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
                <Input placeholder={t('player.singular') + ' ' + t('common.labels.name')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.labels.email')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="player@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.labels.phone')}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+47 123 45 678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('player.birthDate')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('player.photoUrl')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/photo.jpg" {...field} />
              </FormControl>
              <FormDescription>
                {t('player.photoUrlDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="positions"
          render={() => (
            <FormItem>
              <FormLabel>{t('player.position')} *</FormLabel>
              <FormDescription>
                Select 1-3 positions for this player
              </FormDescription>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {volleyballPositions.map((position) => (
                  <FormField
                    key={position}
                    control={form.control}
                    name="positions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={position}
                          className="flex flex-row items-center space-x-2"
                        >
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value?.includes(position)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newValue = checked
                                  ? [...(field.value || []), position]
                                  : (field.value || []).filter((val) => val !== position);
                                field.onChange(newValue);
                              }}
                              className="h-4 w-4 rounded border-input"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {t(`player.positions.${position}` as any)}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
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
