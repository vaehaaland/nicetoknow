-- Nye kategoriar: ting me eig (product) og kroppsmål/storleikar (measurement),
-- pluss kjøpsdato for ting.

alter table public.entries drop constraint if exists entries_category_check;
alter table public.entries
  add constraint entries_category_check
  check (category in ('discount', 'membership', 'insurance', 'product', 'measurement', 'other'));

alter table public.entries add column if not exists purchased_at date;
