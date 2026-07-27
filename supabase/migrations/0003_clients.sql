-- Client directory for Offline orders: a short code (e.g. "GSC") mapped
-- to a full name (e.g. "Gajanan Silver"), so the Brand field on an Offline
-- order can be a quick lookup instead of retyping the full name each time.
create table clients (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

alter table clients enable row level security;
