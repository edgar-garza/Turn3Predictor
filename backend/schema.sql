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
