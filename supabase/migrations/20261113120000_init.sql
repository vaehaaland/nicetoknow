-- NiceToKnow: husstandar, medlemmer og oppføringar (rabattkodar, medlemskap, forsikringar ...)

-- Privat skjema: hjelpefunksjonar som ikkje er eksponerte via Data API-et
create schema if not exists private;

-- ---------- Tabellar ----------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  -- 12 tilfeldige hex-teikn som partnaren brukar for å bli med
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_at timestamptz not null default now()
);

-- Ein brukar høyrer til nøyaktig éin husstand (user_id er primærnøkkel)
create table public.household_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index household_members_household_id_idx on public.household_members (household_id);

-- Husstanden til innlogga brukar. SECURITY DEFINER for å unngå rekursiv RLS på household_members.
create function private.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.household_members where user_id = (select auth.uid());
$$;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default private.my_household_id() references public.households (id) on delete cascade,
  category text not null check (category in ('discount', 'membership', 'insurance', 'other')),
  title text not null check (char_length(title) between 1 and 200),
  provider text,
  code text,          -- rabattkode / medlemsnummer / polisenummer / referanse
  url text,
  notes text,
  expires_at date,    -- utløp / fornying
  tags text[] not null default '{}',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index entries_household_id_idx on public.entries (household_id);
create index entries_created_by_idx on public.entries (created_by);

-- Held updated_at ved like
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger entries_touch_updated_at
before update on public.entries
for each row execute function private.touch_updated_at();

-- ---------- RPC: opprett / bli med i husstand ----------
-- SECURITY DEFINER er med vilje: brukaren har ingen rad å lene RLS på før hen er medlem.
-- Begge sjekkar auth.uid() og er berre køyrbare for innlogga brukarar.

create function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_household uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.household_members where user_id = v_user) then
    raise exception 'already_member';
  end if;

  insert into public.households (name) values (trim(p_name)) returning id into v_household;
  insert into public.household_members (user_id, household_id) values (v_user, v_household);
  return v_household;
end;
$$;

create function public.join_household(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_household uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.household_members where user_id = v_user) then
    raise exception 'already_member';
  end if;

  select id into v_household from public.households where invite_code = lower(trim(p_code));
  if v_household is null then
    raise exception 'invalid_code';
  end if;

  insert into public.household_members (user_id, household_id) values (v_user, v_household);
  return v_household;
end;
$$;

-- ---------- Tilgangar ----------

revoke execute on function private.my_household_id() from public;
revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.my_household_id() to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

revoke all on public.households, public.household_members, public.entries from anon, authenticated;
grant select, update (name) on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, insert, update, delete on public.entries to authenticated;

-- ---------- Row Level Security: alt er avgrensa til eigen husstand ----------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.entries enable row level security;

create policy "members read own household" on public.households
  for select to authenticated
  using (id = (select private.my_household_id()));

create policy "members rename own household" on public.households
  for update to authenticated
  using (id = (select private.my_household_id()))
  with check (id = (select private.my_household_id()));

create policy "members see fellow members" on public.household_members
  for select to authenticated
  using (household_id = (select private.my_household_id()));

create policy "members read entries" on public.entries
  for select to authenticated
  using (household_id = (select private.my_household_id()));

create policy "members add entries" on public.entries
  for insert to authenticated
  with check (household_id = (select private.my_household_id()));

create policy "members edit entries" on public.entries
  for update to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

create policy "members delete entries" on public.entries
  for delete to authenticated
  using (household_id = (select private.my_household_id()));
