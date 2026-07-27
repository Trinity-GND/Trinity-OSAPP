-- Adds Online/Offline order type distinction.
-- All existing orders (marketplace orders migrated from the old system)
-- default to 'online' since that's what they are.
alter table orders
  add column order_type text not null default 'online'
  check (order_type in ('online', 'offline'));

create index orders_order_type_idx on orders (order_type);
