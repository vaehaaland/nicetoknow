-- Nye kategoriar: ting me eig (product) og kjekt å vite (note),
-- pluss kjøpsdato for ting. Trygg å køyre fleire gonger.

alter table public.entries drop constraint if exists entries_category_check;

-- Ei tidlegare utgåve av denne fila kalla kategorien «measurement»
update public.entries set category = 'note' where category = 'measurement';

alter table public.entries
  add constraint entries_category_check
  check (category in ('discount', 'membership', 'insurance', 'product', 'note', 'other'));

alter table public.entries add column if not exists purchased_at date;
