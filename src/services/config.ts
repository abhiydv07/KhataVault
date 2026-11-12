/**
 * KhataVault Application Configuration & Mode Controller
 *
 * Implements strict, failsafe mode management:
 * - 'demo': Local-only browser storage, no mock claims, billing disabled, no fake Drive sync.
 * - 'production': Requires real Supabase, Google Drive, and Razorpay configuration.
 *   Fails closed with setup checklist if required credentials are missing.
 */

export type AppMode = 'production' | 'demo';

export interface AppConfig {
  mode: AppMode;
  isDemo: boolean;
  isProduction: boolean;
  isMisconfigured: boolean;
  missingConfig: string[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleClientId: string;
  razorpayKeyId: string;
  supportEmail: string;
  isRealAuthAvailable: boolean;
  isRealDriveAvailable: boolean;
  isRealPaymentsAvailable: boolean;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed.includes('placeholder') ||
    trimmed.includes('your-') ||
    trimmed.includes('your_') ||
    trimmed.includes('example.com')
  );
}

export function resolveAppConfig(): AppConfig {
  const envMode = (import.meta.env.VITE_APP_MODE || '').toLowerCase();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@khatavault.app';

  const isRealSupabase = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);
  const isRealGoogle = !isPlaceholder(googleClientId);
  const isRealRazorpay = !isPlaceholder(razorpayKeyId);

  const missing: string[] = [];
  if (!isRealSupabase) {
    if (isPlaceholder(supabaseUrl)) missing.push('VITE_SUPABASE_URL');
    if (isPlaceholder(supabaseAnonKey)) missing.push('VITE_SUPABASE_ANON_KEY');
  }
  if (!isRealGoogle) missing.push('VITE_GOOGLE_CLIENT_ID');
  if (!isRealRazorpay) missing.push('VITE_RAZORPAY_KEY_ID');

  // If explicitly requested production, verify credentials
  if (envMode === 'production') {
    if (missing.length > 0) {
      return {
        mode: 'production',
        isDemo: false,
        isProduction: true,
        isMisconfigured: true,
        missingConfig: missing,
        supabaseUrl,
        supabaseAnonKey,
        googleClientId,
        razorpayKeyId,
        supportEmail,
        isRealAuthAvailable: isRealSupabase,
        isRealDriveAvailable: isRealSupabase,
        isRealPaymentsAvailable: isRealRazorpay,
      };
    }

    return {
      mode: 'production',
      isDemo: false,
      isProduction: true,
      isMisconfigured: false,
      missingConfig: [],
      supabaseUrl,
      supabaseAnonKey,
      googleClientId,
      razorpayKeyId,
      supportEmail,
      isRealAuthAvailable: true,
      isRealDriveAvailable: true,
      isRealPaymentsAvailable: true,
    };
  }

  // Safe default: Demo mode (all data stored locally in browser, no fake sync or mock claims)
  return {
    mode: 'demo',
    isDemo: true,
    isProduction: false,
    isMisconfigured: false,
    missingConfig: [],
    supabaseUrl: isRealSupabase ? supabaseUrl : '',
    supabaseAnonKey: isRealSupabase ? supabaseAnonKey : '',
    googleClientId: isRealGoogle ? googleClientId : '',
    razorpayKeyId: isRealRazorpay ? razorpayKeyId : '',
    supportEmail,
    isRealAuthAvailable: isRealSupabase,
    isRealDriveAvailable: isRealSupabase,
    isRealPaymentsAvailable: isRealRazorpay,
  };
}

export const appConfig = resolveAppConfig();
