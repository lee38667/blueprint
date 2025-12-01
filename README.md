# Blueprint — Personal Life Management

This repo scaffolds a Next.js + TypeScript application wired to Supabase. It's an opinionated starter for the "Blueprint" personal life-management system.

Quick start

1. Install dependencies:

```cmd
cd "c:\Users\PC\Documents\GIT Projects\blueprint"
npm install
```

2. Create a Supabase project and copy credentials into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional for server tasks)
```

3. Run database migrations: paste `supabase/schema.sql` into Supabase SQL editor and run.

4. Start dev server:

```cmd
npm run dev
```

What this scaffold includes
- Pages: auth (`/login`, `/register`), `/dashboard`, and modules for Notes, Life Areas, Gym, Finance, Skills, Content, Settings.
- Components: `Sidebar`, `Navbar`, `Card`, `Modal`, `Button`, `FloatingActionButton`, `DailyFocusCard`, `VSCodeSearch`.
- Hooks for data fetching using the Supabase client in `lib/supabaseClient.ts`.
- TailwindCSS + global styles, Framer Motion installed for animations.
- `supabase/schema.sql` - table definitions to paste into Supabase.

Next steps
- Implement RLS policies in Supabase so each user only sees their own data.
- Add 2FA / OTP flows via Supabase auth or a custom service.
- Wire storage buckets for CV and media attachments and enable encryption for sensitive files.
- Expand AI Copilot to call your preferred AI endpoint for insights.
