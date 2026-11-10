# Step-by-Step Setup Guide: Google Cloud OAuth & Supabase

This guide walks you through configuring **Google Cloud OAuth (drive.appdata scope)** and **Supabase** for *Lena Dena Hisaab*.

---

## 1. Google Cloud Console Setup (Google Sign-In + Drive AppData)

### Step 1.1: Create Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** > **New Project**.
3. Name it: `Lena Dena Hisaab` and click **Create**.

### Step 1.2: Enable Google Drive API
1. In the sidebar, navigate to **APIs & Services** > **Library**.
2. Search for **Google Drive API**.
3. Click **Enable**.

### Step 1.3: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select User Type: **External** and click **Create**.
3. Fill in the App Information:
   * **App name**: `Lena Dena Hisaab`
   * **User support email**: your support email
   * **App logo**: upload app icon
   * **Developer contact email**: your email
4. Click **Save and Continue**.
5. In the **Scopes** step, click **Add or Remove Scopes**:
   * Add: `https://www.googleapis.com/auth/drive.appdata`
   * *(Note: This scope provides access ONLY to the hidden Application Data folder created by this app. It CANNOT read or write any of the user's personal documents, photos, or sheets).*
6. Click **Save and Continue** > **Back to Dashboard**.

### Step 1.4: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Lena Dena Hisaab Web Client`.
5. **Authorized JavaScript origins**:
   * `http://localhost:5173`
   * `https://your-app.vercel.app`
6. **Authorized redirect URIs**:
   * `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
   * `http://localhost:5173/auth/callback`
7. Click **Create**.
8. Copy your **Client ID** and **Client Secret**.

---

## 2. Supabase Setup (Accounts & Subscriptions Only)

### Step 2.1: Run Database Migrations
1. Open your Supabase dashboard at [supabase.com](https://supabase.com/).
2. Navigate to the **SQL Editor**.
3. Paste the contents of `supabase/migrations/20261110_init_auth_subscriptions.sql`.
4. Click **Run**.
5. This sets up:
   * `profiles` table with Row-Level Security (RLS)
   * `subscriptions` table with RLS and automatic 7-day trial creation
   * `handle_new_user` trigger for automated provisioning

### Step 2.2: Configure Google Provider in Supabase
1. Go to **Authentication** > **Providers** > **Google**.
2. Toggle **Enable Google provider**.
3. Enter your **Client ID** and **Client Secret** from Google Cloud Console.
4. In **Scopes**, enter:
   `https://www.googleapis.com/auth/drive.appdata`
5. Click **Save**.

---

## 3. Configure Local Environment (`.env`)

Create `.env` in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 4. How Cloud Sync Works
1. **Zero Financial Data on Server**: Our Supabase database stores only account authentication and subscription status. All ledger details stay strictly in the user's private Google Drive.
2. **Monthly Partitioning**: Data is stored as `YYYY-MM.json` inside the isolated `appDataFolder`.
3. **Offline-First**: You can work completely offline; changes are saved to browser local storage and queued. Once internet connectivity is restored, the queue auto-syncs to Google Drive.
4. **Client-Side AES-GCM Encryption**: Users can optionally enter a private passphrase in Settings. The browser uses Web Crypto AES-GCM to encrypt the file before uploading.
