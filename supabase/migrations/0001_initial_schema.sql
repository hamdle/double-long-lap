-- Double Long Lap — initial schema
-- Multi-tenant: every race/standing/rider is scoped to a series (MotoAmerica in Phase 1;
-- WSBK, BSB, Moto2/3 in Year 2+). Adding a series should not require schema changes.

create extension if not exists "pgcrypto";

create table series (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,                -- 'motoamerica', 'wsbk', 'bsb'
  name        text not null,                       -- 'MotoAmerica'
  country     text,                                -- ISO-ish, freeform for now
  website_url text,
  created_at  timestamptz not null default now()
);

create table manufacturers (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,                 -- 'ducati', 'yamaha'
  name       text not null,
  created_at timestamptz not null default now()
);

create table teams (
  id              uuid primary key default gen_random_uuid(),
  series_id       uuid not null references series(id) on delete cascade,
  slug            text not null,
  name            text not null,
  logo_url        text,
  manufacturer_id uuid references manufacturers(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (series_id, slug)
);

-- A class is scoped to a series (MotoAmerica Superbike is not the same entity as WSBK Superbike,
-- even though the name collides). Keep classes series-scoped.
create table classes (
  id          uuid primary key default gen_random_uuid(),
  series_id   uuid not null references series(id) on delete cascade,
  slug        text not null,                       -- 'superbike', 'supersport', 'stock-1000'
  name        text not null,
  description text,
  sort_order  int not null default 0,              -- display order on UI
  created_at  timestamptz not null default now(),
  unique (series_id, slug)
);

create table seasons (
  id         uuid primary key default gen_random_uuid(),
  series_id  uuid not null references series(id) on delete cascade,
  year       int not null,
  created_at timestamptz not null default now(),
  unique (series_id, year)
);

create table venues (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,              -- venues are cross-series (Road America hosts many)
  name           text not null,                     -- 'Road America'
  location       text,                              -- 'Elkhart Lake, WI'
  country        text,
  track_length_m int,                               -- in meters, nullable
  turn_count     int,
  description    text,
  travel_guide   text,                              -- MDX-ish content; render as markdown
  track_day_info text,
  created_at     timestamptz not null default now()
);

create table riders (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null,     -- 'sean-dylan-kelly'
  first_name              text not null,
  last_name               text not null,
  number                  int,
  nationality             text,                     -- freeform; ISO codes later
  photo_url               text,
  bio                     text,
  career_highlights       text,
  current_team_id         uuid references teams(id) on delete set null,
  current_class_id        uuid references classes(id) on delete set null,
  current_manufacturer_id uuid references manufacturers(id) on delete set null,
  created_at              timestamptz not null default now()
);

-- A race weekend can have multiple races per class ("Race 1", "Race 2").
-- Each row here is one race (one class, one session, one winner).
create table races (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references seasons(id) on delete cascade,
  class_id     uuid not null references classes(id) on delete cascade,
  venue_id     uuid not null references venues(id) on delete restrict,
  round_number int not null,                        -- 1..9 for MotoAmerica 2026
  race_number  int not null default 1,              -- Race 1, Race 2 within a weekend
  race_date    date,                                -- nullable until scheduled
  status       text not null default 'scheduled',   -- scheduled | completed | cancelled
  created_at   timestamptz not null default now(),
  unique (season_id, class_id, round_number, race_number)
);

create table race_results (
  id              uuid primary key default gen_random_uuid(),
  race_id         uuid not null references races(id) on delete cascade,
  rider_id        uuid not null references riders(id) on delete cascade,
  team_id         uuid references teams(id) on delete set null,
  manufacturer_id uuid references manufacturers(id) on delete set null,
  position        int,                               -- NULL for DNF/DNS
  points          int not null default 0,
  fastest_lap     boolean not null default false,
  pole_position   boolean not null default false,
  laps_completed  int,
  dnf_reason      text,
  created_at      timestamptz not null default now(),
  unique (race_id, rider_id)
);

-- Denormalized season-level standings. Rebuilt from race_results after each weekend.
-- Kept as a table (not a view) so scrapers can write authoritative numbers from
-- the official standings page — those can differ from computed sums when penalties apply.
create table standings (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references seasons(id) on delete cascade,
  class_id       uuid not null references classes(id) on delete cascade,
  rider_id       uuid not null references riders(id) on delete cascade,
  position       int not null,
  total_points   int not null default 0,
  wins           int not null default 0,
  podiums        int not null default 0,
  poles          int not null default 0,
  fastest_laps   int not null default 0,
  updated_at     timestamptz not null default now(),
  unique (season_id, class_id, rider_id)
);

create index races_season_class_idx on races (season_id, class_id);
create index race_results_rider_idx on race_results (rider_id);
create index race_results_race_idx on race_results (race_id);
create index standings_season_class_idx on standings (season_id, class_id, position);
create index riders_current_class_idx on riders (current_class_id);

-- Users, fantasy tables deferred to Phase 2. Supabase Auth will supply auth.users;
-- our app-level user profile and fantasy_teams/fantasy_picks/fantasy_scores land
-- in migration 0002 when fantasy is built.
