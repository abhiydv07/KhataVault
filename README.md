# Lena Dena Hisaab (लेना देना हिसाब)

> **Professional, 100% Private Ledger Calculator & Financial Reporting Web App**  
> Designed for small business owners and individuals to track peer receivables (**Lena**) and payables (**Dena**).  
> **Privacy Architecture**: All hisaab data is stored directly in the customer's **OWN Google Drive** (`drive.appdata`). Our backend stores strictly account and subscription status — zero financial ledger numbers!

---

## 🌟 Key Highlights

* **Mobile-First Ledger**: Dual-sided daily entry (Lena & Dena) with large touch targets, numeric keypads, and Indian numbering system formatting (`1,06,988.50`).
* **Smart Math Parser**: Type expressions like `1570+3135`, `120000+15000-5000`, or negatives (`-500`) with live evaluation badges (`= ₹4,705`).
* **Dena Upline ($U/L$)**: Supports positive and negative adjustments with live subtotals.
* **Hisaab Adjustments Block**:
  * Cash Charge: default `3.00%` with `+0.25%` and `-0.25%` steppers, applied on configurable bases (*Dena Total*, *Lena Total*, *Net*, *Avl. Balance*).
  * Old CB, Bonus, Avl. Balance (auto = Lena total), Kharcha, Confirmation, RTGS, and Custom Items.
* **Instant Farak Verdict**: Live Green (Lena / to receive) or Red (Dena / to pay) verdict banner.
* **Google Drive Sync (`drive.appdata`)**: Monthly JSON partitioning (`YYYY-MM.json`) stored in Google Drive's isolated application folder with conflict handling and backup snapshots.
* **Offline-First PWA**: Work completely offline with automatic sync queue when internet reconnects.
* **Optional Client-Side AES-GCM Encryption**: Browser-level Web Crypto encryption with PBKDF2 passphrase before upload.
* **Party / Friend Directory**: Track running balances and transaction counts for all parties.
* **Monthly & Yearly Reports**:
  * Dual-bar visual cash turnover chart.
  * Top debtors and top creditors.
  * **Export to Excel (`.xlsx`)**: Structured multi-tab workbook with Summary, Daily Ledger, and Party Balances.
  * **Export to PDF (`.pdf`)**: Print-ready statement with brand header, KPI grids, and daily tables.
* **Subscriptions & Paywall**:
  * 7-day free trial on signup.
  * Monthly & Yearly plans with UPI AutoPay & Cards via Razorpay.
  * Paywall rule: Expired users retain permanent access to view and export their records, while adding entries and viewing reports requires an active plan.
* **Bilingual UI**: Full English & Hindi toggle with Hindi financial labels.
* **Security & Privacy**: Strict Content-Security-Policy (CSP), Row-Level Security (RLS) on Supabase, and self-serve Data Deletion.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS, Lucide Icons, PWA
* **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
* **Storage**: Google Drive API v3 (`drive.appdata` scope)
* **Encryption**: Web Crypto API (AES-GCM 256-bit, PBKDF2, SHA-256)
* **Payments**: Razorpay Subscriptions (UPI AutoPay & Cards)
* **Exports**: SheetJS (`xlsx`), `jspdf`, `jspdf-autotable`
* **Testing**: Vitest (20 automated unit tests)
* **Hosting**: Vercel (Frontend) & Supabase (Backend)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
├── docs/
│   ├── GOOGLE_OAUTH_AND_SUPABASE_SETUP.md            # Step-by-step setup guide
│   └── LAUNCH_AND_GOOGLE_OAUTH_VERIFICATION_CHECKLIST.md # Verification & launch guide
├── public/
│   ├── favicon.ico
│   └── pwa-*.png
├── src/
│   ├── components/
│   │   ├── BillingModal.tsx           # Subscription plans, UPI AutoPay, invoices
│   │   ├── FriendDirectoryModal.tsx   # Searchable party running balances
│   │   ├── Header.tsx                 # Navigation, date picker, sync status, lang
│   │   ├── HisaabBlockCard.tsx        # Cash charge stepper, Old CB, Kharcha, RTGS
│   │   ├── LedgerTable.tsx            # Lena and Dena list inputs, math expressions
│   │   ├── LegalModal.tsx             # Privacy Policy, Terms, Data Deletion, FAQ
│   │   ├── OnboardingModal.tsx        # 3-step first-time user tour
│   │   ├── PaywallBanner.tsx          # Expired trial warning banner
│   │   ├── ReportsModal.tsx           # Monthly & Yearly statements with SVG chart
│   │   ├── UndoToast.tsx              # Instant undo banner for deleted rows
│   │   └── VerdictCard.tsx            # Live Farak balance hero banner
│   ├── services/
│   │   ├── crypto.ts                  # Web Crypto AES-GCM client-side encryption
│   │   ├── googleDrive.ts             # Google Drive appDataFolder API client
│   │   ├── supabase.ts                # Supabase Auth & Google OAuth
│   │   ├── subscriptionService.ts     # Paywall access & Razorpay checkout
│   │   └── syncManager.ts             # Offline-first sync manager & queue
│   ├── types/
│   │   ├── hisaab.ts                  # Day sheet, Ledger entry & Hisaab block types
│   │   └── subscription.ts            # Subscription plans & billing types
│   ├── utils/
│   │   ├── calculatorEngine.ts        # Pure calculation logic (Lena, Dena, Farak)
│   │   ├── currencyFormatter.ts       # Indian numbering system (1,06,988)
│   │   ├── exportExcel.ts             # SheetJS Excel (.xlsx) generator
│   │   ├── exportPdf.ts               # jsPDF statement generator
│   │   ├── i18n.ts                    # English & Hindi translation dictionaries
│   │   ├── mathParser.ts              # Safe math expression parser (no eval)
│   │   ├── reportsEngine.ts           # Monthly and yearly aggregation engine
│   │   └── storage.ts                 # Partitioned monthly JSON local storage
│   ├── App.tsx                        # Root app orchestrator
│   ├── main.tsx                       # React DOM entry
│   └── index.css                      # Tailwind base & custom mobile styles
├── supabase/
│   ├── functions/
│   │   └── razorpay-webhook/          # Edge Function with HMAC SHA-256 verification
│   └── migrations/
│       └── 20261110_init_auth_subscriptions.sql # RLS-protected database schema
├── .env.example                       # Template for environment variables
├── vercel.json                        # CSP, HSTS, and security headers
├── vite.config.ts                     # Vite + PWA service worker config
└── package.json
```

---

## 🔒 Security & Privacy Commitments

1. **Zero-Server Financial Storage**: Your hisaab numbers exist only on your phone/browser and in your private Google Drive (`appDataFolder`).
2. **Minimum Google Scope**: Requests strictly `https://www.googleapis.com/auth/drive.appdata`. We cannot view, access, or touch your personal Drive files.
3. **Client-Side Encryption**: Optional AES-GCM encryption ensures data is ciphertext before it ever leaves your browser.
4. **Self-Serve Data Deletion**: Users can erase all files from Google Drive AppData with a single click in Settings.
