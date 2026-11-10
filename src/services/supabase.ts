import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Mock user for local testing when Supabase env vars are not configured
const MOCK_STORAGE_KEY = 'lena_dena_mock_user';

export interface AuthState {
  user: User | null;
  session: Session | null;
  providerToken: string | null;
  isLoading: boolean;
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const authService = {
  /**
   * Sign in with Google OAuth requesting strictly the drive.appdata scope
   */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured || !supabase) {
      // In dev/demo without Supabase credentials, enable Mock Google Sign-In
      const mockUser: any = {
        id: 'usr_demo_8832',
        email: 'hisaab.owner@gmail.com',
        user_metadata: {
          full_name: 'Demo Hisaab Owner',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hisaab',
        },
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem('google_drive_mock_connected', 'true');
      window.dispatchEvent(new Event('auth_state_change'));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(MOCK_STORAGE_KEY);
    localStorage.removeItem('google_drive_mock_connected');
    localStorage.removeItem('google_drive_access_token');
    window.dispatchEvent(new Event('auth_state_change'));
  },

  /**
   * Get current session and token
   */
  async getSession(): Promise<{ user: User | null; session: Session | null; providerToken: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const providerToken = session?.provider_token || localStorage.getItem('google_drive_access_token') || null;
      return {
        user: session?.user || null,
        session,
        providerToken,
      };
    }

    // Dev/Mock fallback
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        return {
          user,
          session: null,
          providerToken: 'mock_google_token_valid',
        };
      } catch {
        // invalid JSON
      }
    }

    return { user: null, session: null, providerToken: null };
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null, providerToken: string | null) => void): () => void {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const token = session?.provider_token || localStorage.getItem('google_drive_access_token') || null;
        callback(session?.user || null, token);
      });
      return () => subscription.unsubscribe();
    }

    // Dev listener
    const handler = () => {
      this.getSession().then(({ user, providerToken }) => {
        callback(user, providerToken);
      });
    };

    window.addEventListener('auth_state_change', handler);
    return () => window.removeEventListener('auth_state_change', handler);
  },
};

