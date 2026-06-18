-- ============================================================
-- Troubadour — Supabase SQL Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "uuid-ossp";

-- ── 1. PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. AUDIO ASSETS ──────────────────────────────────────────
-- One row per unique file per user (deduplicated by hash)
create table public.audio_assets (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  storage_path text not null,          -- path in Supabase Storage bucket
  file_hash    text not null,          -- SHA-256 of the file for dedup
  mime_type    text not null default 'audio/mpeg',
  duration_sec numeric,
  file_size    bigint,
  created_at   timestamptz default now(),
  unique (user_id, file_hash)           -- prevent duplicate uploads per user
);

alter table public.audio_assets enable row level security;
create policy "Users manage their own audio assets"
  on public.audio_assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. PLAYLISTS ─────────────────────────────────────────────
create table public.playlists (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text not null default '',
  has_intensities boolean not null default true,
  intensity_count int     not null default 3,    -- how many intensity levels
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Migration for existing databases (run if table already exists):
-- ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS description text not null default '';

alter table public.playlists enable row level security;
create policy "Users manage their own playlists"
  on public.playlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 4. PLAYLIST TRACKS ───────────────────────────────────────
-- Each row links an audio_asset into a specific intensity level of a playlist
create table public.playlist_tracks (
  id              uuid primary key default uuid_generate_v4(),
  playlist_id     uuid not null references public.playlists(id) on delete cascade,
  asset_id        uuid not null references public.audio_assets(id) on delete cascade,
  intensity_level int  not null default 0,       -- 0-based index (0=Low,1=Med,2=High)
  position        int  not null default 0,       -- order within the intensity level
  created_at      timestamptz default now()
);

alter table public.playlist_tracks enable row level security;
create policy "Users manage tracks via playlist ownership"
  on public.playlist_tracks for all
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

-- ── 5. SFX PANELS ────────────────────────────────────────────
-- Represents named panel groups: 'global', 'player', 'encounter'
create table public.sfx_panels (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  panel_type text not null check (panel_type in ('global','player','encounter')),
  name       text not null,   -- e.g. player character name or encounter name
  position   int  not null default 0,
  created_at timestamptz default now()
);

alter table public.sfx_panels enable row level security;
create policy "Users manage their own sfx panels"
  on public.sfx_panels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 6. SFX BUTTONS ───────────────────────────────────────────
create table public.sfx_buttons (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  panel_id   uuid references public.sfx_panels(id) on delete set null,
  name       text not null,
  color      text not null default '#c0392b',
  icon       text,
  position   int  not null default 0,
  created_at timestamptz default now()
);

alter table public.sfx_buttons enable row level security;
create policy "Users manage their own sfx buttons"
  on public.sfx_buttons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 7. SFX BUTTON FILES ──────────────────────────────────────
-- Junction: one button → many audio_assets (random pick on trigger)
-- CRUCIAL: duplicating a button creates a new sfx_button row but reuses
--          the same asset_id rows here — no re-upload occurs.
create table public.sfx_button_files (
  id         uuid primary key default uuid_generate_v4(),
  button_id  uuid not null references public.sfx_buttons(id) on delete cascade,
  asset_id   uuid not null references public.audio_assets(id) on delete cascade,
  created_at timestamptz default now(),
  unique (button_id, asset_id)
);

alter table public.sfx_button_files enable row level security;
create policy "Users manage sfx files via button ownership"
  on public.sfx_button_files for all
  using (
    exists (
      select 1 from public.sfx_buttons b
      where b.id = button_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sfx_buttons b
      where b.id = button_id and b.user_id = auth.uid()
    )
  );

-- ── 8. STORAGE BUCKET ────────────────────────────────────────
-- Create via Supabase Dashboard → Storage → New Bucket named "audio"
-- Or run (requires service_role key, not available in SQL editor):
--   insert into storage.buckets (id, name, public) values ('audio', 'audio', false);

-- RLS policy for storage (run in SQL editor):
create policy "Users can upload their own audio"
  on storage.objects for insert
  with check (
    bucket_id = 'audio' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own audio"
  on storage.objects for select
  using (
    bucket_id = 'audio' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own audio"
  on storage.objects for delete
  using (
    bucket_id = 'audio' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
