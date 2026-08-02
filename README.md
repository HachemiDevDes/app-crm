# EventZone CRM

A professional CRM web application for managing your EventZone network contacts. Built with Next.js 14 and Supabase — sharing the same backend as the EventZone mobile app.

## Features

- 🔐 **Auth** — Sign in with your EventZone credentials (same account as the app)
- 📇 **Contacts** — View, search, filter all your connections
- ➕ **Add Contacts** — Manually add contacts (syncs to the app)
- 📥 **Export** — Download contacts as CSV or Excel
- 🧑 **Profile** — Edit your profile (changes reflect in the mobile app)
- 🔗 **Social Links** — Manage LinkedIn, Twitter, website, etc.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend**: Supabase (same project as the mobile app)
- **Auth**: Supabase Auth (SSR via `@supabase/ssr`)
- **Styling**: Vanilla CSS (dark theme, glassmorphism)
- **Icons**: Lucide React
- **Export**: xlsx (CSV + Excel)

## Getting Started

1. Clone this repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) — log in with your EventZone account.

## Database

The CRM uses the existing EventZone Supabase project tables:

| Table | Usage |
|---|---|
| `profiles` | User profile data (read & write) |
| `connections` | Contacts/leads (read, write, delete) |

All changes respect existing RLS policies — users only access their own data.
