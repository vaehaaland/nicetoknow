-- Nye kategoriar: ting me eig (product) og kjekt å vite (note),
-- pluss kjøpsdato for ting.

alter table public.entries drop constraint entries_category_check;
alter table public.entries
  add constraint entries_category_check
  check (category in ('discount', 'membership', 'insurance', 'product', 'note', 'other'));

alter table public.entries add column purchased_at date;
