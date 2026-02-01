import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@teamtracker.app';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

serve(async (req) => {
  try {
    const { userIds, title, body, url } = await req.json();

    if (!userIds?.length || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get push subscriptions for the target users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      throw error;
    }

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });

    // Send push notifications using Web Push API
    // Note: In production, use a web-push compatible library for Deno
    // For now, we use the Web Push protocol directly
    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Use the Web Push API endpoint directly
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            TTL: '86400',
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          sent++;
        } else if (response.status === 410) {
          // Subscription expired, remove it
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        } else {
          errors.push(`Failed for ${sub.id}: ${response.status}`);
        }
      } catch (err) {
        errors.push(`Error for ${sub.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
