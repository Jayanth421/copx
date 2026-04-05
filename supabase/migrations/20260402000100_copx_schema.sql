create extension if not exists "pgcrypto";

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  group_code text not null,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'college', 'student')),
  college_id uuid references public.colleges (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  registration_deadline timestamptz,
  visibility text not null check (visibility in ('local', 'global')),
  category text not null check (category in ('tech', 'non-tech')),
  status text not null check (status in ('pending', 'approved', 'rejected', 'published')) default 'pending',
  poster_url text,
  capacity integer check (capacity is null or capacity > 0),
  college_id uuid not null references public.colleges (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  registered_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  otp_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_college_id on public.profiles (college_id);
create index if not exists idx_colleges_group_code on public.colleges (group_code);
create index if not exists idx_events_college_status on public.events (college_id, status);
create index if not exists idx_events_start_at on public.events (start_at);
create index if not exists idx_registrations_event_id on public.registrations (event_id);
create index if not exists idx_registrations_student_id on public.registrations (student_id);
create index if not exists idx_email_otps_email on public.email_otps (email);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_college_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select college_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.current_user_college_id() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.email_otps enable row level security;

drop policy if exists "Anyone can view colleges" on public.colleges;
create policy "Anyone can view colleges"
  on public.colleges
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Profile readable by owner or admin" on public.profiles;
create policy "Profile readable by owner or admin"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Profile updatable by owner or admin" on public.profiles;
create policy "Profile updatable by owner or admin"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "Anon can read global published events" on public.events;
create policy "Anon can read global published events"
  on public.events
  for select
  to anon
  using (status = 'published' and visibility = 'global');

drop policy if exists "Authenticated event read policy" on public.events;
create policy "Authenticated event read policy"
  on public.events
  for select
  to authenticated
  using (
    public.is_admin()
    or (
      public.current_user_role() = 'college'
      and college_id = public.current_user_college_id()
    )
    or (
      status = 'published'
      and (
        visibility = 'global'
        or (
          visibility = 'local'
          and exists (
            select 1
            from public.profiles viewer
            join public.colleges viewer_college on viewer_college.id = viewer.college_id
            join public.colleges event_college on event_college.id = events.college_id
            where viewer.id = auth.uid()
              and viewer_college.group_code = event_college.group_code
          )
        )
      )
    )
  );

drop policy if exists "College and admin can insert events" on public.events;
create policy "College and admin can insert events"
  on public.events
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      public.current_user_role() = 'college'
      and college_id = public.current_user_college_id()
      and created_by = auth.uid()
    )
  );

drop policy if exists "College owner and admin can update events" on public.events;
create policy "College owner and admin can update events"
  on public.events
  for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.current_user_role() = 'college'
      and college_id = public.current_user_college_id()
    )
  )
  with check (
    public.is_admin()
    or (
      public.current_user_role() = 'college'
      and college_id = public.current_user_college_id()
    )
  );

drop policy if exists "College owner and admin can delete events" on public.events;
create policy "College owner and admin can delete events"
  on public.events
  for delete
  to authenticated
  using (
    public.is_admin()
    or (
      public.current_user_role() = 'college'
      and college_id = public.current_user_college_id()
    )
  );

drop policy if exists "Users can read registrations based on role" on public.registrations;
create policy "Users can read registrations based on role"
  on public.registrations
  for select
  to authenticated
  using (
    public.is_admin()
    or student_id = auth.uid()
    or (
      public.current_user_role() = 'college'
      and exists (
        select 1
        from public.events e
        where e.id = registrations.event_id
          and e.college_id = public.current_user_college_id()
      )
    )
  );

drop policy if exists "Students can register once for visible events" on public.registrations;
create policy "Students can register once for visible events"
  on public.registrations
  for insert
  to authenticated
  with check (
    public.current_user_role() = 'student'
    and student_id = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = registrations.event_id
        and e.status = 'published'
        and (
          e.visibility = 'global'
          or exists (
            select 1
            from public.profiles viewer
            join public.colleges viewer_college on viewer_college.id = viewer.college_id
            join public.colleges event_college on event_college.id = e.college_id
            where viewer.id = auth.uid()
              and viewer_college.group_code = event_college.group_code
          )
        )
    )
  );

drop policy if exists "Students and admins can delete registrations" on public.registrations;
create policy "Students and admins can delete registrations"
  on public.registrations
  for delete
  to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "No direct OTP access for clients" on public.email_otps;
create policy "No direct OTP access for clients"
  on public.email_otps
  for all
  to anon, authenticated
  using (false)
  with check (false);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'registrations'
  ) then
    alter publication supabase_realtime add table public.registrations;
  end if;
end
$$;
