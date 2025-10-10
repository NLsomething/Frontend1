# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for your ClassroomInsight application.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/login
3. Click "New Project"
4. Fill in your project details:
   - **Project Name**: ClassroomInsight (or your preferred name)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait for setup to complete

### 2. Get Your API Keys

1. In your Supabase dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **API** under Project Settings
3. You'll find two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### 3. Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit your `.env` file to version control!

### 4. Configure Supabase Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and password reset emails if needed
4. (Optional) Configure **URL Configuration**:
   - Go to **Authentication** → **URL Configuration**
   - Add your site URL: `http://localhost:5173` (for development)
   - Add redirect URLs if needed

### 5. Email Confirmation Settings

By default, Supabase requires email confirmation. You can change this:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle "Confirm email" on/off based on your needs
3. For development, you might want to disable it temporarily

### 6. Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Try registering a new user:
   - Fill in username, email, and password
   - Click "Register"
   - Check your email for confirmation (if enabled)

3. Try logging in with your credentials

## 📁 Project Structure

```
src/
├── lib/
│   └── supabaseClient.js       # Supabase client initialization
├── services/
│   └── authService.js          # Authentication functions
├── context/
│   └── AuthContext.jsx         # Auth state management
└── pages/
    ├── LoginPage.jsx           # Login/Register UI
    └── HomePage.jsx            # Protected route with logout
```

## 🔧 Available Authentication Functions

### `signUp(email, password, metadata)`
Register a new user with email and password.

```javascript
import { signUp } from './services/authService'

const { user, session, error } = await signUp(
  'user@example.com',
  'password123',
  { username: 'johndoe' }
)
```

### `signIn(email, password)`
Sign in an existing user.

```javascript
import { signIn } from './services/authService'

const { user, session, error } = await signIn(
  'user@example.com',
  'password123'
)
```

### `signOut()`
Sign out the current user.

```javascript
import { signOut } from './services/authService'

const { error } = await signOut()
```

### `getCurrentUser()`
Get the currently authenticated user.

```javascript
import { getCurrentUser } from './services/authService'

const { user, error } = await getCurrentUser()
```

### `getSession()`
Get the current session.

```javascript
import { getSession } from './services/authService'

const { session, error } = await getSession()
```

### `resetPassword(email)`
Send password reset email.

```javascript
import { resetPassword } from './services/authService'

const { error } = await resetPassword('user@example.com')
```

## 🎣 Using the Auth Hook

The `useAuth` hook provides easy access to authentication state:

```javascript
import { useAuth } from './context/AuthContext'

function MyComponent() {
  const { user, session, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return <div>Welcome, {user.email}!</div>
}
```

## 🔒 Protected Routes

The `HomePage` component is automatically protected. Users will be redirected to login if not authenticated.

To protect additional routes:

```javascript
import { useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProtectedPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  if (loading) return <div>Loading...</div>

  return <div>Protected Content</div>
}
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure your `.env` file is in the project root
- Restart your development server after changing `.env`
- Check that variable names start with `VITE_`

### "Invalid login credentials" Error
- Verify email confirmation is disabled or the user has confirmed their email
- Check that the password meets minimum requirements (6+ characters)
- Ensure you're using the correct email/password combination

### Email Not Received
- Check your spam/junk folder
- Verify email provider settings in Supabase dashboard
- For development, consider disabling email confirmation temporarily

### Session Not Persisting
- Check browser console for errors
- Ensure cookies are enabled in your browser
- Clear browser cache and try again

## 📊 Role Based Access Setup

To split users into Student, Teacher, Building Manager, and Administrator roles, configure your database once:

1. In the Supabase dashboard open **SQL Editor** and run:

```sql
-- 1) Create an enum for roles (run once)
create type user_role as enum (
  'student',
  'teacher',
  'building_manager',
  'administrator'
);

-- 2) Create or replace the profiles table with role support
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  role user_role not null default 'student',
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

> 🛠️ Migrating an existing table: if you created `profiles` before roles were added, double-check the column type with `select column_name, data_type from information_schema.columns where table_name = 'profiles';`. If `id` shows up as `bigint`, run the following once to convert it and reapply the foreign key:

```sql
alter table profiles
  alter column id type uuid using id::uuid;

alter table profiles
  add constraint profiles_id_fkey
    foreign key (id)
    references auth.users (id)
    on delete cascade;
```

> ❗ If the cast fails with `cannot cast type bigint to uuid`, it means the existing IDs were generated by a serial/sequence and do not match the real `auth.users` IDs. In that case the quickest fix is to drop and recreate the table:

```sql
drop table if exists profiles cascade;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  role user_role not null default 'student',
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);
```

Any missing rows will be repopulated the next time users sign in because the frontend always upserts the profile record from the session metadata.
```

2. (Optional) Add a simple trigger to keep `updated_at` fresh:

```sql
create or replace function handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_profiles_updated_at();
```

3. Enable Row Level Security for `profiles` (if not already enabled) and add policies:

```sql
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can read their profile" on profiles
  for select using (auth.uid() = id);

-- Users can insert their own profile row on first login
create policy "Users can insert their profile" on profiles
  for insert with check (auth.uid() = id);

-- Users can update their own profile data
create policy "Users can update their profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

4. (Optional) Allow privileged roles to manage profiles. For example, to let Administrators edit any profile:

```sql
create policy "Admins manage profiles" on profiles
  for all using (
    auth.jwt()->>'role' = 'administrator'
  ) with check (
    auth.jwt()->>'role' = 'administrator'
  );
```

> ℹ️ The frontend stores each user's role inside Supabase `user_metadata` and mirrors it in the `profiles` table for queries. Make sure the JWT includes the `role` claim by adding it under **Authentication → Policies → JWT Custom Claims** if you plan to secure PostgREST endpoints with roles.

### ✅ Create the Default Administrator

1. Open **Authentication → Users** in Supabase and click **Add user**.
2. Provide the administrator email and a strong password, tick **Auto confirm user**, and submit.
3. After the user is created, open the user details panel and add the following JSON to **User Metadata**:

```json
{
  "username": "admin",
  "role": "administrator"
}
```

4. Save the metadata. The next time the admin signs in, the frontend sync process will populate/refresh the `profiles` row with the administrator role.

### 🗓️ Room Schedule Storage

Create the table that powers the schedule panel and grant access:

```sql
create table if not exists room_schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_date date not null,
  room_number text not null,
  slot_hour smallint not null check (slot_hour between 0 and 23),
  status text not null check (status in ('empty', 'occupied', 'maintenance')) default 'empty',
  course_name text,
  booked_by text,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  unique (schedule_date, room_number, slot_hour)
);

create or replace function handle_room_schedules_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists room_schedules_updated_at on room_schedules;

create trigger room_schedules_updated_at
  before update on room_schedules
  for each row execute procedure handle_room_schedules_updated_at();

alter table room_schedules enable row level security;

-- Anyone signed in can read the schedule
create policy "Schedules are viewable" on room_schedules
  for select using (auth.role() = 'authenticated');

-- Only building managers and administrators can modify
create policy "Schedule managers can change" on room_schedules
  for all using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role in ('administrator', 'building_manager')
    )
  ) with check (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role in ('administrator', 'building_manager')
    )
  );
```

> 🔐 If you need visitors without a role to view the grid, adjust the select policy accordingly.

> ♻️ Updating policies: if you created earlier versions that relied on JWT custom claims, run `drop policy if exists ...` before re-creating them with the `profiles` lookup shown above.

### 📝 Teacher Room Requests

Teachers submit multi-week room requests while Building Managers / Administrators review them. Create the storage table and RLS policies:

```sql
create table if not exists room_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users on delete cascade,
  requester_name text,
  requester_email text,
  room_number text not null,
  base_date date not null,
  start_hour smallint not null check (start_hour between 0 and 23),
  end_hour smallint not null check (end_hour between 0 and 23),
  week_count smallint not null check (week_count between 1 and 12),
  course_name text,
  booked_by text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewer_id uuid references auth.users on delete set null,
  reviewer_name text,
  reviewed_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

create or replace function handle_room_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists room_requests_updated_at on room_requests;

create trigger room_requests_updated_at
  before update on room_requests
  for each row execute procedure handle_room_requests_updated_at();

alter table room_requests enable row level security;

-- Teachers can manage their own requests
create policy "Teachers manage own requests" on room_requests
  for all using (auth.uid() = requester_id)
  with check (auth.uid() = requester_id);

-- Building managers & admins can view everything
create policy "Managers view requests" on room_requests
  for select using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role in ('administrator', 'building_manager')
    )
  );

-- Building managers & admins can update / decide requests
create policy "Managers decide requests" on room_requests
  for update using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role in ('administrator', 'building_manager')
    )
  ) with check (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role in ('administrator', 'building_manager')
    )
  );
```

### ➕ Adding Additional Users

When registering through the app, new users can choose between **Student**, **Teacher**, or **Building Manager** roles. If you need to promote a user later:

1. Update the user's metadata role inside Supabase (`Authentication → Users → User Metadata`).
2. Alternatively, edit the `profiles.role` column directly in Table Editor (the frontend will keep both sources in sync on the next login).

## 🚀 Production Deployment

Before deploying to production:

1. Update environment variables with production Supabase credentials
2. Add your production URL to Supabase **URL Configuration**
3. Enable email confirmation for security
4. Review and customize email templates
5. Consider adding additional security policies
6. Enable RLS (Row Level Security) on all database tables

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

## 🆘 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Consult the [Supabase Discord community](https://discord.supabase.com)
4. Check [GitHub issues](https://github.com/supabase/supabase/issues)
