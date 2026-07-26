-- Trinity OS initial schema
-- Team members, orders, access log, settings, payroll, expenses.
-- Row Level Security is enabled on every table with no anon/authenticated
-- policies: only the service role key (used exclusively by our server-side
-- API routes) can read/write. This keeps the anon key harmless even if it
-- ever leaked, and enforces role-based data hiding at the app layer instead.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Team members
-- ---------------------------------------------------------------------
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  role text not null check (role in ('owner', 'employee')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;

-- ---------------------------------------------------------------------
-- Access log (login history) — name/role are snapshotted at login time
-- so the log survives a team member later being removed.
-- ---------------------------------------------------------------------
create table access_log (
  id bigserial primary key,
  team_member_id uuid references team_members(id) on delete set null,
  name text not null,
  role text not null,
  logged_in_at timestamptz not null default now()
);

alter table access_log enable row level security;

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create sequence order_job_seq start 1;

create table orders (
  id text primary key default ('JOB-' || lpad(nextval('order_job_seq')::text, 6, '0')),

  -- Order Info
  employee text,
  brand text,
  marketplace text check (marketplace in ('Etsy', 'Amazon', 'Shopify', 'Walmart', 'eBay', 'Instagram-DM', 'Other')),
  platform_order_number text,
  order_date date not null default current_date,

  -- Buyer Info
  buyer_name text,
  shipping_address text,
  address_line text,
  city text,
  state text,
  zip text,
  country text,
  contact_no text,

  -- Product Info
  category text,
  sku text,
  image_path text,
  metal_kt text check (metal_kt in ('Sterling Silver', '9KT', '10KT', '14KT', '18KT')),
  metal_color text check (metal_color in ('White', 'Rose', 'Yellow')),
  stone_quality text check (stone_quality in ('Cubic Zirconia', 'Moissanite', 'Lab Grown', 'Natural')),
  size text,
  quantity integer not null default 1,
  weight numeric,
  final_weight numeric,
  remark text,

  -- Pricing (owner-only visibility, enforced in the API layer)
  sold_price numeric,
  material_cost numeric,

  -- Production
  priority text not null default 'Normal' check (priority in ('Normal', 'High', 'Urgent')),
  ship_by date,
  stage text check (stage in ('cad', 'cam', 'casting', 'inProduction', 'readyToDispatch', 'dispatched')),
  stage_timestamps jsonb not null default '{}'::jsonb,
  cancelled boolean not null default false,
  production_notes text,

  -- Returns & Refunds
  returned boolean not null default false,
  return_reason text,
  return_date timestamptz,
  refund_type text not null default 'none' check (refund_type in ('none', 'full', 'partial')),
  refund_amount numeric,
  refund_date timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders enable row level security;

create index orders_stage_idx on orders (stage);
create index orders_order_date_idx on orders (order_date);
create index orders_cancelled_idx on orders (cancelled);

-- ---------------------------------------------------------------------
-- App settings (key/value) — seeded with the global Labor Rate
-- ---------------------------------------------------------------------
create table app_settings (
  key text primary key,
  value jsonb not null
);

alter table app_settings enable row level security;

insert into app_settings (key, value) values ('labor_rate_per_gram_usd', '280');

-- ---------------------------------------------------------------------
-- Monthly Expenses & Payroll (INR, kept separate from USD order data)
-- ---------------------------------------------------------------------
create table payroll_entries (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  name text not null,
  monthly_salary numeric not null default 0,
  days_to_be_paid numeric not null default 0,
  days_present numeric not null default 0,
  advance numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table payroll_entries enable row level security;
create index payroll_entries_month_idx on payroll_entries (year, month);

create table operating_expenses (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  category text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table operating_expenses enable row level security;
create index operating_expenses_month_idx on operating_expenses (year, month);
