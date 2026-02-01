import { supabase } from '@/lib/supabase';
import type { PushSubscription } from '@/types/database.types';

/**
 * Push notifications service
 * Handles all Supabase operations for push notification subscriptions
 */

/**
 * Subscribe a user to push notifications
 * Extracts endpoint, p256dh, and auth from the PushSubscription object
 */
export async function subscribeToPush(
  userId: string,
  subscription: PushSubscriptionJSON
): Promise<PushSubscription> {
  if (!subscription.endpoint || !subscription.keys) {
    throw new Error('Invalid push subscription format');
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      {
        onConflict: 'user_id,endpoint',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }

  return data;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId: string, endpoint: string): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Send push notification to specific users
 * Calls the Supabase edge function 'send-push'
 */
export async function sendPushNotification(
  userIds: string[],
  title: string,
  body: string,
  url?: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      userIds,
      title,
      body,
      url,
    },
  });

  if (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}
