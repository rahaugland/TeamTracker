import { StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

/**
 * User role types based on SPEC.md
 */
export type UserRole = 'head_coach' | 'assistant_coach' | 'player' | 'parent';

/**
 * User authentication state
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  avatarUrl?: string;
}

/**
 * Auth slice state interface
 */
export interface AuthSlice {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  syncSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

/**
 * Auth slice creator
 * Manages authentication state integrated with Supabase
 */
export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),

  setSession: (session) =>
    set({
      session,
    }),

  /**
   * Sign in with Google OAuth
   * Initiates OAuth flow with redirect
   */
  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Sign out current user
   * Clears local state and Supabase session
   */
  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Update user role in database and local state
   * Called after role selection on first login
   */
  updateUserRole: async (role: UserRole) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error('No user to update');
    }

    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update local state
      set({
        user: {
          ...currentUser,
          role,
        },
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  /**
   * Sync session and user data from Supabase
   * Called on app initialization and after OAuth callback
   */
  syncSession: async () => {
    set({ isLoading: true });
    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If profile doesn't exist, create it as a fallback
      if (profileError?.code === 'PGRST116') {
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
      }

      // Create user object
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.full_name || session.user.user_metadata?.full_name || '',
        role: profile?.role || null,
        avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
      };

      set({
        user,
        session,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Session sync error:', error);
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
});
