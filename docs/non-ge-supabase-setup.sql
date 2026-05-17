-- Non-GE tracker setup.
-- Apply manually in the Supabase SQL Editor.

-- New tables

create table if not exists public.non_ge_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint non_ge_categories_user_name_key unique (user_id, name),
  constraint non_ge_categories_user_id_id_key unique (user_id, id)
);

create table if not exists public.non_ge_custom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  wiki_url text,
  image_url text,
  source_name text not null default 'Custom',
  range_label text not null default 'Unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint non_ge_custom_items_user_id_id_key unique (user_id, id)
);

create table if not exists public.non_ge_stocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_key text,
  custom_item_id uuid,
  name_snapshot text not null,
  category_id uuid,
  shares numeric not null default 0,
  total_cost numeric not null default 0,
  shares_sold numeric not null default 0,
  total_cost_sold numeric not null default 0,
  total_cost_basis_sold numeric not null default 0,
  target_buy_price numeric,
  target_sell_price numeric,
  notes text,
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint non_ge_stocks_user_id_id_key unique (user_id, id),
  constraint non_ge_stocks_custom_item_owner_fk
    foreign key (user_id, custom_item_id)
    references public.non_ge_custom_items(user_id, id)
    on delete restrict,
  constraint non_ge_stocks_category_owner_fk
    foreign key (user_id, category_id)
    references public.non_ge_categories(user_id, id)
    on delete set null (category_id),
  constraint non_ge_stocks_catalog_or_custom_check check (
    (catalog_item_key is not null and custom_item_id is null)
    or (catalog_item_key is null and custom_item_id is not null)
  )
);

-- Alter existing tables

alter table public.transactions
  add column if not exists market text not null default 'ge',
  add column if not exists non_ge_stock_id uuid;

alter table public.transactions
  alter column stock_id drop not null;

alter table public.profit_history
  add column if not exists market text not null default 'ge',
  add column if not exists non_ge_stock_id uuid;

alter table public.profit_history
  alter column stock_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_market_check'
  ) then
    alter table public.transactions
      add constraint transactions_market_check
      check (market in ('ge', 'non_ge'))
      not valid;
  end if;
end $$;

alter table public.transactions
  validate constraint transactions_market_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profit_history'::regclass
      and conname = 'profit_history_market_check'
  ) then
    alter table public.profit_history
      add constraint profit_history_market_check
      check (market in ('ge', 'non_ge'))
      not valid;
  end if;
end $$;

alter table public.profit_history
  validate constraint profit_history_market_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_non_ge_stock_owner_fk'
  ) then
    alter table public.transactions
      add constraint transactions_non_ge_stock_owner_fk
      foreign key (user_id, non_ge_stock_id)
      references public.non_ge_stocks(user_id, id)
      on delete set null (non_ge_stock_id)
      not valid;
  end if;
end $$;

alter table public.transactions
  validate constraint transactions_non_ge_stock_owner_fk;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profit_history'::regclass
      and conname = 'profit_history_non_ge_stock_owner_fk'
  ) then
    alter table public.profit_history
      add constraint profit_history_non_ge_stock_owner_fk
      foreign key (user_id, non_ge_stock_id)
      references public.non_ge_stocks(user_id, id)
      on delete set null (non_ge_stock_id)
      not valid;
  end if;
end $$;

alter table public.profit_history
  validate constraint profit_history_non_ge_stock_owner_fk;

-- Indexes

create index if not exists idx_non_ge_categories_user_position
  on public.non_ge_categories(user_id, position);

create unique index if not exists non_ge_categories_user_id_id_key
  on public.non_ge_categories(user_id, id);

create index if not exists idx_non_ge_custom_items_user_name
  on public.non_ge_custom_items(user_id, name);

create unique index if not exists non_ge_custom_items_user_id_id_key
  on public.non_ge_custom_items(user_id, id);

create unique index if not exists idx_non_ge_custom_items_user_lower_name
  on public.non_ge_custom_items(user_id, lower(name));

create index if not exists idx_non_ge_stocks_user_archived_position
  on public.non_ge_stocks(user_id, archived, position);

create unique index if not exists non_ge_stocks_user_id_id_key
  on public.non_ge_stocks(user_id, id);

create index if not exists idx_transactions_market_user_date
  on public.transactions(user_id, market, date desc);

create index if not exists idx_transactions_non_ge_stock_id
  on public.transactions(non_ge_stock_id);

create index if not exists idx_profit_history_market_user_created
  on public.profit_history(user_id, market, created_at desc);

-- Data API grants

grant select, insert, update, delete
on table public.non_ge_categories
to authenticated;

grant select, insert, update, delete
on table public.non_ge_custom_items
to authenticated;

grant select, insert, update, delete
on table public.non_ge_stocks
to authenticated;

-- Row level security

alter table public.non_ge_categories enable row level security;
alter table public.non_ge_custom_items enable row level security;
alter table public.non_ge_stocks enable row level security;

drop policy if exists "Users can manage their own non-ge categories"
on public.non_ge_categories;

create policy "Users can manage their own non-ge categories"
on public.non_ge_categories
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own non-ge custom items"
on public.non_ge_custom_items;

create policy "Users can manage their own non-ge custom items"
on public.non_ge_custom_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own non-ge stocks"
on public.non_ge_stocks;

create policy "Users can manage their own non-ge stocks"
on public.non_ge_stocks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- View-definition inspection note
--
-- Before replacing transactions_view, inspect the current definition:
-- select pg_get_viewdef('public.transactions_view'::regclass, true);
--
-- Then replace it with the same existing GE columns plus:
-- market,
-- non_ge_stock_id,
-- stock_name resolved from non_ge_stocks.name_snapshot when market = 'non_ge',
-- category resolved from non_ge_categories.name when market = 'non_ge'.
--
-- Keep the existing profit and margin formulas intact for GE rows.
-- Apply the same formulas to Non-GE rows using non_ge_stocks.total_cost_basis_sold.
--
-- The exact transactions_view replacement must preserve the current production
-- view definition. Fetch the current view SQL from Supabase before writing the
-- final replacement because this local repo does not contain the authoritative
-- view definition.
