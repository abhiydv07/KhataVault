import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { appConfig } from './config';

export interface AuthState {
  user: User | null;
  session: Session | null;
  providerToken: string | null;
  isLoading: boolean;
}

export const isSupabaseConfigured = appConfig.isRealAuthAvailable;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Strictly keep Google provider token in-memory only (never in localStorage)
let inMemoryProviderToken: string | null = null;

export const authService = {
  /**
   * Sign in with Google OAuth requesting strictly the drive.appdata scope
   */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: new Error(
          'Google Sign-In is unavailable in Demo Mode. Real Google OAuth requires VITE_SUPABASE_URL and VITE_GOOGLE_CLIENT_ID to be configured.'
        ),
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'https://www.googleapis.com/auth/drive.appdata',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    inMemoryProviderToken = null;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    // Clean any legacy tokens if they existed
    localStorage.removeItem('google_drive_access_token');
    localStorage.removeItem('google_drive_mock_connected');
    localStorage.removeItem('lena_dena_mock_user');
    window.dispatchEvent(new Event('auth_state_change'));
  },

  /**
   * Get current session and token (in-memory provider token only)
   */
  async getSession(): Promise<{ user: User | null; session: Session | null; providerToken: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session?.provider_token) {
          inMemoryProviderToken = session.provider_token;
        }
        return {
          user: session?.user || null,
          session,
          providerToken: inMemoryProviderToken,
        };
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    }

    return { user: null, session: null, providerToken: null };
  },

  /**
   * Protected server-side deletion of user account
   */
  async deleteAccount(): Promise<{ error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) {
          console.warn('RPC delete_user_account error (fallback to signOut):', error);
        }
        await this.signOut();
        return { error: null };
      } catch (err: any) {
        await this.signOut();
        return { error: err };
      }
    }
    await this.signOut();
    return { error: null };
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null, providerToken: string | null) => void): () => void {
    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.provider_token) {
          inMemoryProviderToken = session.provider_token;
        } else if (!session) {
          inMemoryProviderToken = null;
        }
        callback(session?.user || null, inMemoryProviderToken);
      });
      return () => subscription.unsubscribe();
    }

    // Default: no user in unconfigured mode
    callback(null, null);
    return () => {};
  },
};
