import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getClaimTokenDetails, claimPlayer } from '@/services/claim.service';
import { performSync } from '@/services/sync.service';
import type { ClaimTokenDetails } from '@/services/claim.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

type PageState =
  | 'loading'
  | 'invalid'
  | 'expired'
  | 'claimed'
  | 'unauthenticated'
  | 'ready'
  | 'success'
  | 'error';

export function ClaimPlayerPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: isAuthLoading, signInWithGoogle, syncSession } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [details, setDetails] = useState<ClaimTokenDetails | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || isAuthLoading) return;

    let cancelled = false;

    async function fetchDetails() {
      try {
        const data = await getClaimTokenDetails(token!);

        if (cancelled) return;

        if (!data) {
          setPageState('invalid');
          return;
        }

        setDetails(data);

        if (data.isClaimed) {
          setPageState('claimed');
        } else if (data.isExpired) {
          setPageState('expired');
        } else if (!isAuthenticated) {
          setPageState('unauthenticated');
        } else {
          setPageState('ready');
        }
      } catch {
        if (!cancelled) {
          setPageState('invalid');
        }
      }
    }

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, isAuthLoading]);

  const handleLogin = async () => {
    if (token) {
      sessionStorage.setItem('claimToken', token);
    }
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleClaim = async () => {
    if (!token) return;

    setIsClaiming(true);
    setErrorMessage(null);

    try {
      await claimPlayer(token);

      // Refresh the auth store so the new role ('player') is picked up
      await syncSession();

      // Pull all team/player data into IndexedDB so the dashboard has data
      if (user?.id) {
        performSync(user.id).catch((err) =>
          console.error('Post-claim sync error:', err)
        );
      }

      setPageState('success');
    } catch (err: any) {
      console.error('Claim error:', err);
      setErrorMessage(err?.message || t('common.messages.error'));
      setPageState('error');
    } finally {
      setIsClaiming(false);
    }
  };

  const renderPlayerInfo = () => {
    if (!details) return null;

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          {details.player.photo_url ? (
            <img
              src={details.player.photo_url}
              alt={details.player.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
              {details.player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="text-xl font-semibold">{details.player.name}</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('claim.team')}</span>
            <span className="font-medium">{details.team.name}</span>
          </div>
          {details.player.positions.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('claim.positions')}</span>
              <span className="font-medium">{details.player.positions.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('common.messages.loading')}</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold">{t('claim.invalidToken')}</h3>
            <p className="text-sm text-muted-foreground">{t('claim.invalidTokenDescription')}</p>
          </div>
        );

      case 'expired':
        return (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Clock className="h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-semibold">{t('claim.expired')}</h3>
            <p className="text-sm text-muted-foreground">{t('claim.expiredDescription')}</p>
            {renderPlayerInfo()}
          </div>
        );

      case 'claimed':
        return (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-semibold">{t('claim.alreadyClaimed')}</h3>
            <p className="text-sm text-muted-foreground">{t('claim.alreadyClaimedDescription')}</p>
          </div>
        );

      case 'unauthenticated':
        return (
          <div className="space-y-6">
            {renderPlayerInfo()}
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                {t('claim.loginRequiredDescription')}
              </p>
              <Button onClick={handleLogin} className="w-full" size="lg">
                {t('claim.loginToClaim')}
              </Button>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="space-y-6">
            {renderPlayerInfo()}
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full"
              size="lg"
            >
              {isClaiming ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('claim.claiming')}
                </span>
              ) : (
                t('claim.confirmClaim')
              )}
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-semibold">{t('claim.success')}</h3>
            <p className="text-sm text-muted-foreground">{t('claim.successDescription')}</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
              {t('claim.goToDashboard')}
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6">
            {renderPlayerInfo()}
            <div className="flex flex-col items-center gap-3 text-center">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button onClick={handleClaim} variant="outline" className="w-full">
                {t('errors.tryAgain')}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('claim.title')}</CardTitle>
            <CardDescription>{t('claim.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
