import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import { UserRole } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Role selection page
 * Shown to first-time users to select their role
 */
export function RoleSelectionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateUserRole, isLoading } = useAuth();
  const { addNotification } = useUI();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const roles: { value: UserRole; icon: string }[] = [
    { value: 'head_coach', icon: '👨‍🏫' },
    { value: 'assistant_coach', icon: '👩‍🏫' },
    { value: 'player', icon: '🏐' },
    { value: 'parent', icon: '👨‍👩‍👧‍👦' },
  ];

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      await updateUserRole(selectedRole);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: t('common.messages.saved'),
        duration: 3000,
      });

      // Redirect based on role
      if (selectedRole === 'player' || selectedRole === 'parent') {
        // Players and parents need to join a team
        navigate('/join-team');
      } else {
        // Coaches go to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: t('auth.roleSelection.error'),
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('auth.roleSelection.title')}</h1>
          <p className="text-muted-foreground">{t('auth.roleSelection.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {roles.map((role) => (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === role.value
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole(role.value)}
              role="radio"
              aria-checked={selectedRole === role.value}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRole(role.value); } }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{role.icon}</span>
                  <div>
                    <CardTitle className="text-xl">
                      {t(`auth.roleSelection.roles.${role.value}.title`)}
                    </CardTitle>
                    <CardDescription>
                      {t(`auth.roleSelection.roles.${role.value}.description`)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            size="lg"
            className="min-w-[200px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('common.messages.saving')}
              </span>
            ) : (
              t('auth.roleSelection.continue')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
