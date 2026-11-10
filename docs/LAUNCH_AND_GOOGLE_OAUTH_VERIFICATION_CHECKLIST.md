# Production Launch & Google OAuth Verification Checklist

This comprehensive guide covers everything required to deploy **Lena Dena Hisaab** to production, pass **Google Cloud OAuth verification**, configure **Razorpay Subscriptions**, and launch on **Vercel + Supabase**.

---

## 1. Google Cloud OAuth Verification Guide

Because Lena Dena Hisaab requests access to the Google Drive AppData folder (`https://www.googleapis.com/auth/drive.appdata`), Google requires OAuth verification before making the app public to external users.

### 1.1 Why `drive.appdata` is the Easiest Scope to Verify
* **Restricted vs Non-Sensitive Scopes**: General Google Drive scopes (`drive`, `drive.file`, `drive.readonly`) require costly Third-Party CASA security audits ($3,000–$15,000).
* **The `drive.appdata` Advantage**: `drive.appdata` has strict isolation: it gives access **only** to files created by our app inside the hidden application data folder. It **cannot** read or view the user's personal documents, spreadsheets, or photos.
* Google approves `drive.appdata` with a straightforward video demonstration and domain verification.

### 1.2 Preparation Checklist
1. **Custom Domain & HTTPS**:
   * Deploy the frontend to your custom domain (e.g., `https://lenadenahisaab.com` or `https://app.lenadenahisaab.com`).
   * Ensure HTTPS is active (automatic on Vercel).
2. **Domain Ownership Verification**:
   * Add your domain to [Google Search Console](https://search.google.com/search-console).
   * Verify ownership via DNS TXT record.
3. **Public Legal Pages**:
   * Privacy Policy URL: `https://your-domain.com#privacy` (renders [`LegalModal.tsx`](file:///e:/Calculator/src/components/LegalModal.tsx))
   * Terms of Service URL: `https://your-domain.com#terms`
   * Data Deletion Instructions URL: `https://your-domain.com#deletion`
4. **OAuth Consent Screen Configuration**:
   * App name: `Lena Dena Hisaab`
   * User support email: `support@your-domain.com`
   * App Logo: 120x120 PNG with transparent background.
   * Authorized domains: `your-domain.com`, `supabase.co`
   * Scopes requested: `https://www.googleapis.com/auth/drive.appdata`, `email`, `profile`, `openid`.

### 1.3 YouTube Demo Video Requirements (Mandatory for Reviewers)
Record a 2-to-3 minute unlisted YouTube video showing the exact OAuth flow:
1. **Show the URL Bar**: Ensure the browser URL bar clearly shows your Google Client ID parameter (`client_id=...`).
2. **Demonstrate Google Sign-In**: Click "Continue with Google" on the onboarding or settings modal.
3. **Explain Data Storage**: Show the user logging in, creating daily Lena and Dena entries, and saving.
4. **Demonstrate Drive Sync**: Show that the file is synced to Google Drive AppData (explain that our server stores zero financial data).
5. **Demonstrate Data Deletion**: Open the Data Deletion section and show that the user can erase all files from Drive with one click.
6. Submit the unlisted YouTube link in the Google Cloud Console verification form.

---

## 2. Supabase Backend Production Checklist

1. **Database Schema**:
   * Run [`supabase/migrations/20261110_init_auth_subscriptions.sql`](file:///e:/Calculator/supabase/migrations/20261110_init_auth_subscriptions.sql).
   * Confirm RLS is enabled on `profiles` and `subscriptions`:
     ```sql
     SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
     ```
2. **Google OAuth Provider**:
   * In Supabase Dashboard -> **Authentication** -> **Providers** -> **Google**:
     * Client ID: `<from-google-cloud>`
     * Client Secret: `<from-google-cloud>`
     * Scopes: `https://www.googleapis.com/auth/drive.appdata`
3. **Deploy Razorpay Webhook Edge Function**:
   * Install Supabase CLI:
     ```bash
     supabase login
     supabase link --project-ref your-project-ref
     supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
     supabase functions deploy razorpay-webhook
     ```

---

## 3. Razorpay Go-Live Checklist

1. **Activate Live Account**:
   * Complete business KYC on [dashboard.razorpay.com](https://dashboard.razorpay.com/).
   * Enable **UPI AutoPay** and **Subscriptions**.
2. **Create Subscription Plans in Razorpay**:
   * Plan 1 (Monthly): ₹299 (or your finalized rate), Interval: Monthly.
   * Plan 2 (Yearly): ₹2,499 (or your finalized rate), Interval: Yearly.
3. **Configure Webhook**:
   * Webhook URL: `https://<your-project-ref>.supabase.co/functions/v1/razorpay-webhook`
   * Secret: Enter a strong random secret.
   * Events to subscribe:
     * `subscription.authenticated`
     * `subscription.activated`
     * `subscription.charged`
     * `subscription.paused`
     * `subscription.pending`
     * `subscription.cancelled`

---

## 4. Vercel Deployment Checklist

1. **Connect Git Repository**:
   * Push code to GitHub/GitLab.
   * Import project into Vercel.
2. **Environment Variables**:
   In Vercel Project Settings -> **Environment Variables**:
   * `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   * `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
   * `VITE_GOOGLE_CLIENT_ID`: `your-client-id.apps.googleusercontent.com`
   * `VITE_RAZORPAY_KEY_ID`: `rzp_live_your_key`
   * `VITE_MONTHLY_PRICE_INR`: `299` (or finalized rate)
   * `VITE_YEARLY_PRICE_INR`: `2499` (or finalized rate)
3. **Security Headers (`vercel.json`)**:
   * Verified strict CSP headers, HSTS, X-Content-Type-Options, and Frame-Options configured in [`vercel.json`](file:///e:/Calculator/vercel.json).

---

## 5. Pre-Launch Quality Assurance & Fixture Validation

Run the automated test suite before every release:
```bash
npm test
```
All 20 tests verify:
* Arithmetic expression parser handling commas, currency signs, and negatives (`1570+3135`).
* Calculator engine balance, upline, cash charge steppers, and Farak verdict.
* Web Crypto AES-GCM 256-bit passphrase encryption & decryption.
* Multi-day monthly and yearly reports aggregation with top debtors/creditors.
* 7-day trial calculation and paywall permission gating.
