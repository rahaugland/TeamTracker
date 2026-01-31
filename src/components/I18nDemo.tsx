import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * I18nDemo demonstrates the internationalization setup
 * Shows how translations work with language switching
 */
export function I18nDemo() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">{t('app.name')}</h1>
        <p className="text-muted-foreground">{t('app.tagline')}</p>
      </div>

      <div className="flex justify-center">
        <LanguageSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('common.buttons.save')}</CardTitle>
            <CardDescription>
              {t('common.labels.actions')} - Button translations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button>{t('common.buttons.save')}</Button>
            <Button variant="secondary">{t('common.buttons.cancel')}</Button>
            <Button variant="destructive">{t('common.buttons.delete')}</Button>
            <Button variant="outline">{t('common.buttons.edit')}</Button>
            <Button variant="ghost">{t('common.buttons.add')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('navigation.dashboard')}</CardTitle>
            <CardDescription>Navigation translations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">{t('navigation.teams')}</div>
              <div className="text-sm font-medium">{t('navigation.players')}</div>
              <div className="text-sm font-medium">{t('navigation.schedule')}</div>
              <div className="text-sm font-medium">{t('navigation.practices')}</div>
              <div className="text-sm font-medium">{t('navigation.drills')}</div>
              <div className="text-sm font-medium">{t('navigation.analytics')}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('player.plural')}</CardTitle>
            <CardDescription>Player-related translations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">{t('player.position')}:</span>
              <ul className="ml-4 mt-2 space-y-1">
                <li>{t('player.positions.setter')}</li>
                <li>{t('player.positions.libero')}</li>
                <li>{t('player.positions.outside_hitter')}</li>
                <li>{t('player.positions.middle_blocker')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('drill.plural')}</CardTitle>
            <CardDescription>Drill skill translations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">{t('drill.skillTags')}:</span>
              <ul className="ml-4 mt-2 space-y-1">
                <li>{t('drill.skills.passing')}</li>
                <li>{t('drill.skills.setting')}</li>
                <li>{t('drill.skills.serving')}</li>
                <li>{t('drill.skills.blocking')}</li>
                <li>{t('drill.skills.defense')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Type-Safe Translations</CardTitle>
          <CardDescription>
            All translation keys are type-checked at compile time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            The i18n infrastructure is configured with TypeScript types that
            provide autocomplete and type safety for translation keys. Try
            switching the language using the selector above to see translations
            in action.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <code className="text-xs">
              {`const { t } = useTranslation();`}
              <br />
              {`t('player.positions.setter') // Type-safe!`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
