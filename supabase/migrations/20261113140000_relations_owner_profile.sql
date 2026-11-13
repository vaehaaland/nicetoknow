-- Fordelar under medlemskap (parent_id), eigar per oppføring (owner_id) og profil (namn + bilete)

-- ---------- Profil på medlemsrada ----------
alter table public.household_members
  add column display_name text check (char_length(display_name) between 1 and 40),
  -- Lite, nedskalert bilete lagra som data-URL (ca. 5–15 kB) – ingen eigen fillagring å sikre
  add column avatar text check (avatar like 'data:image/%' and char_length(avatar) <= 200000);

-- Kvar brukar kan endre namn og bilete på si eiga rad, ingenting anna
grant update (display_name, avatar) on public.household_members to authenticated;

create policy "members edit own profile" on public.household_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- Koplingar på oppføringar ----------
-- Unike par gjer at framandnøklane under berre kan peike innanfor same husstand
alter table public.household_members
  add constraint household_members_user_household_key unique (user_id, household_id);
alter table public.entries
  add constraint entries_id_household_key unique (id, household_id);

alter table public.entries
  add column parent_id uuid,  -- medlemskapet denne fordelen høyrer til
  add column owner_id uuid,   -- kven det gjeld; null = felles
  add constraint entries_not_own_parent check (parent_id <> id),
  -- Slettar ein medlemskapet eller medlemmen, blir berre koplinga nulla ut
  add constraint entries_parent_fkey foreign key (parent_id, household_id)
    references public.entries (id, household_id) on delete set null (parent_id),
  add constraint entries_owner_fkey foreign key (owner_id, household_id)
    references public.household_members (user_id, household_id) on delete set null (owner_id);

create index entries_parent_id_idx on public.entries (parent_id);
create index entries_owner_id_idx on public.entries (owner_id);
