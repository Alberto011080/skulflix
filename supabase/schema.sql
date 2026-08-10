-- SKULFLIX — esquema inicial de Supabase.
-- Pega esto entero en el SQL Editor de tu proyecto (supabase.com -> tu proyecto -> SQL Editor -> New query -> Run).

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  genre text not null,
  synopsis text,
  cover_url text,
  file_url text,
  pages int,
  reads int default 0,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- RLS: sin esto, cualquiera con la anon key podría leer/escribir libremente
-- en las tablas. Con RLS activado, todo queda bloqueado salvo lo que
-- permitan las policies de abajo.
alter table books enable row level security;
alter table profiles enable row level security;

-- Catálogo público de lectura (lo que hoy hace getBooks() contra Open Library).
create policy "books son visibles para cualquiera"
  on books for select
  using (true);

-- Cada usuario ve y edita solo su propio perfil.
create policy "el usuario ve su propio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "el usuario crea su propio perfil al registrarse"
  on profiles for insert
  with check (auth.uid() = id);

create policy "el usuario actualiza su propio perfil"
  on profiles for update
  using (auth.uid() = id);
