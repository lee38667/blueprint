# Google Calendar Integration Setup

## Prerequisites
- Google Cloud Console account
- Supabase project with Blueprint schema

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Calendar API"
   - Click **Enable**

4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Configure OAuth consent screen if prompted:
     - User Type: **External**
     - App name: **Blueprint**
     - User support email: Your email
     - Developer contact: Your email
     - Scopes: Add `.../auth/calendar.readonly`
     - Test users: Add your Google account
   - Application type: **Web application**
   - Name: **Blueprint Calendar Integration**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback` (for local dev)
     - `https://your-production-domain.com/api/calendar/callback` (for production)
   - Click **Create**

5. Copy the **Client ID** and **Client Secret**

## Step 2: Update Database Schema

Run this SQL in your Supabase SQL editor:

```sql
create table if not exists calendar_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- Enable RLS
alter table calendar_connections enable row level security;

-- RLS policy: users can only see their own connections
create policy "Users can view own calendar connections"
  on calendar_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own calendar connections"
  on calendar_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own calendar connections"
  on calendar_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own calendar connections"
  on calendar_connections for delete
  using (auth.uid() = user_id);
```

## Step 3: Configure Environment Variables

Add to your `.env.local`:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production, update to:
# GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback
# NEXT_PUBLIC_APP_URL=https://your-domain.com

# Encryption key for storing tokens (use a strong random string)
ENCRYPTION_KEY=your-random-32-character-string-here
```

Generate a strong encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Install Dependencies

```bash
npm install googleapis
```

## Step 5: Test the Integration

1. Start your dev server: `npm run dev`
2. Navigate to **Settings** page
3. Click **Connect Calendar** in the Integrations section
4. Authorize with your Google account
5. You should be redirected back with "Connected" status

## How It Works

1. **OAuth Flow**:
   - User clicks "Connect Calendar" → redirects to `/api/calendar/auth`
   - Google OAuth consent screen appears
   - After authorization → redirects to `/api/calendar/callback`
   - Tokens are encrypted and stored in `calendar_connections` table

2. **AI Integration**:
   - When using "Get Advice" in focus mode, the AI copilot:
   - Fetches today's and tomorrow's events from your calendar
   - Includes them in the prompt context
   - Provides schedule-aware advice

3. **Security**:
   - Access tokens are encrypted using AES encryption
   - Refresh tokens are stored for automatic token renewal
   - Tokens are decrypted only when making API calls
   - RLS policies ensure users only access their own connections

## API Endpoints

- `GET /api/calendar/auth` - Initiates OAuth flow
- `GET /api/calendar/callback` - Handles OAuth callback
- `GET /api/calendar/events` - Fetches upcoming events (requires auth)
- `DELETE /api/calendar/disconnect` - Removes calendar connection

## Troubleshooting

**"Calendar not connected" error:**
- Check that OAuth credentials are correct in `.env.local`
- Verify redirect URI matches exactly in Google Console
- Ensure calendar_connections table exists in Supabase

**Token expired:**
- Integration automatically refreshes tokens using refresh_token
- If refresh fails, disconnect and reconnect calendar

**Events not showing in AI:**
- Check that events exist in your Google Calendar
- Verify calendar connection in Settings
- Check browser console for API errors

## Production Deployment

1. Update redirect URI in Google Console to production URL
2. Update environment variables in Vercel/hosting platform
3. Ensure `NEXT_PUBLIC_APP_URL` points to production domain
4. Generate a new strong `ENCRYPTION_KEY` for production
5. Never commit `.env.local` or expose credentials
