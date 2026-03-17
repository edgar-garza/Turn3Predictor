-- Turn3 F1 Predictor — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Stores every AI prediction made
create table if not exists predictions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  season        int not null,
  round         int not null,
  race_name     text not null,
  circuit_id    text not null,
  weather       text not null default 'dry',
  p1_driver     text not null,
  p1_code       text not null,
  p1_constructor text not null,
  p2_driver     text not null,
  p2_code       text not null,
  p2_constructor text not null,
  p3_driver     text not null,
  p3_code       text not null,
  p3_constructor text not null,
  confidence    int not null,
  reasoning     text not null
);

-- Stores actual race results (entered manually after each race weekend)
create table if not exists results (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  season        int not null,
  round         int not null,
  race_name     text not null,
  circuit_id    text not null,
  race_date     date not null,
  p1_driver     text not null,
  p1_code       text not null,
  p1_constructor text not null,
  p2_driver     text not null,
  p2_code       text not null,
  p2_constructor text not null,
  p3_driver     text not null,
  p3_code       text not null,
  p3_constructor text not null
);

-- Unique constraint so each race only has one result entry
create unique index if not exists results_season_round_idx on results (season, round);

-- Add round_count to predictions for cache invalidation
-- round_count = number of completed races at time of prediction
alter table predictions add column if not exists round_count int not null default 0;

-- Unique constraint: one cached prediction per circuit+weather+season+round_count
create unique index if not exists predictions_cache_idx
  on predictions (circuit_id, weather, season, round_count);

-- Add P4 and P5 prediction columns (nullable for backward compat with old rows)
alter table predictions add column if not exists p4_driver text;
alter table predictions add column if not exists p4_code text;
alter table predictions add column if not exists p4_constructor text;
alter table predictions add column if not exists p5_driver text;
alter table predictions add column if not exists p5_code text;
alter table predictions add column if not exists p5_constructor text;

-- Stores agree/disagree votes per circuit per season (one per IP)
create table if not exists votes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  circuit_id    text not null,
  season        int not null,
  ip_hash       text not null,
  vote          text not null check (vote in ('agree', 'disagree'))
);

-- One vote per IP per circuit per season
create unique index if not exists votes_circuit_season_ip_idx on votes (circuit_id, season, ip_hash);

-- Stores user comments on predictions
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  circuit_id    text not null,
  season        int not null,
  text          text not null check (char_length(text) between 1 and 500)
);
