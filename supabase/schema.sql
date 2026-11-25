-- Skema SisaJadi (sudah diterapkan ke project Supabase SisaJadiProject)
create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text, created_at timestamptz default now());
create table public.listings(
  id bigint generated always as identity primary key,
  owner uuid references public.profiles(id) default auth.uid(),
  title text not null,
  category text not null check (category in ('Organik','Tekstil','Kemasan','Kayu','Botol')),
  kind text not null check (kind in ('Jual','Barter','Donasi')),
  qty_kg numeric not null, price int default 0, city text,
  created_at timestamptz default now());
create index listings_owner_idx on public.listings(owner);
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
create policy "profil sendiri" on public.profiles for all
  using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy "listing dibaca publik" on public.listings for select using (true);
create policy "pemilik kelola listing" on public.listings for all
  using ((select auth.uid())=owner) with check ((select auth.uid())=owner);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,full_name,phone)
  values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone');
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
