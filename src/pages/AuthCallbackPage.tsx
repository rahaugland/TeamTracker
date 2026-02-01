import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Auth callback page
 * Handles OAuth redirect from Google
 * Processes auth code and establishes session
 */
export function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { syncSession } = useAuth();
  const { addNotification } = useUI();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Listen for auth state changes - this fires when Supabase processes the OAuth tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session) {
        try {
          // Ensure profile row exists (DB trigger is unreliable for OAuth)
          const meta = session.user.user_metadata ?? {};
          await supabase.from('profiles').upsert(
            {
              id: session.user.id,
              email: session.user.email,
              full_name: meta.full_name ?? meta.name ?? '',
              avatar_url: meta.avatar_url ?? meta.picture ?? '',
            },
            { onConflict: 'id', ignoreDuplicates: true },
          );

          // Sync session to our store
          await syncSession();

          // Check if user has a profile with role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          setIsProcessing(false);

          if (!profile?.role) {
            // New user - needs to select role
            navigate('/select-role', { replace: true });
          } else {
            // Existing user - go to dashboard
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
          setIsProcessing(false);
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            message: t('auth.callback.error'),
            duration: 5000,
          });
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        setIsProcessing(false);
        navigate('/login', { replace: true });
      }
    });

    // Timeout fallback - if nothing happens in 10 seconds, redirect to login
    const timeout = setTimeout(() => {
      if (isProcessing) {
        console.error('Auth callback timeout');
        setIsProcessing(false);
        navigate('/login', { replace: true });
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t('auth.callback.processing')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <svg
              className="animate-spin h-12 w-12 text-primary"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
