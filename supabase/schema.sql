-- Kitap Alıntılarım — Supabase şeması
-- Supabase panelinde: SQL Editor → bu dosyanın içeriğini yapıştır → Run

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  author text,
  status text not null default 'reading' check (status in ('reading', 'finished', 'want')),
  rating smallint check (rating between 1 and 5),
  color text not null default '#7a3e2b',
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  book_id uuid not null references public.books on delete cascade,
  text text not null,
  page text,
  note text,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists quotes_book_idx on public.quotes (book_id);

-- Herkes yalnızca kendi kitaplarını ve alıntılarını görebilir/değiştirebilir
alter table public.books enable row level security;
alter table public.quotes enable row level security;

drop policy if exists "own books" on public.books;
create policy "own books" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own quotes" on public.quotes;
create policy "own quotes" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
