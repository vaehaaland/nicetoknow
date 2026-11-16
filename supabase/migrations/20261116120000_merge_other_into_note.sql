-- Slår saman «Anna» (other) med «Kjekt å vite» (note).

alter table public.entries drop constraint entries_category_check;

update public.entries set category = 'note' where category = 'other';

alter table public.entries
  add constraint entries_category_check
  check (category in ('discount', 'membership', 'insurance', 'product', 'note'));
