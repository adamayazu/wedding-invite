-- Reference copy of what was already applied to the Supabase project (iwcorotlopnuizzwftwx).
-- You do NOT need to run this again unless you move to a new Supabase project.

create table if not exists public.invite_config (
  id int primary key default 1 check (id = 1),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000),
  updated_at timestamptz not null default now()
);
create table if not exists public.invite_admin (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.invite_config enable row level security;
alter table public.invite_admin enable row level security;

create schema if not exists invite_private;
grant usage on schema invite_private to authenticated;
create or replace function invite_private.is_admin() returns boolean
  language sql stable security definer set search_path = '' as
  $$ select exists (select 1 from public.invite_admin where user_id = (select auth.uid())) $$;
revoke all on function invite_private.is_admin() from public, anon;
grant execute on function invite_private.is_admin() to authenticated;

create policy "anyone can read the invitation" on public.invite_config for select to anon, authenticated using (true);
create policy "admins can add" on public.invite_config for insert to authenticated with check ((select invite_private.is_admin()));
create policy "admins can change" on public.invite_config for update to authenticated using ((select invite_private.is_admin())) with check ((select invite_private.is_admin()));
create policy "see own admin row" on public.invite_admin for select to authenticated using (user_id = (select auth.uid()));

-- Give someone else edit access (they need a Supabase Auth account first):
-- insert into public.invite_admin (user_id) select id from auth.users where email = 'her@email.com';
