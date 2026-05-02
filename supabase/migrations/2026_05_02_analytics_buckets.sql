create or replace function public.get_analytics_buckets(
  p_user_id uuid,
  p_start   date,
  p_end     date,
  p_bucket  text
)
returns table(
  bucket_date     date,
  profit_items    bigint,
  profit_dump     bigint,
  profit_referral bigint,
  profit_bonds    bigint,
  gp_traded       bigint,
  by_category     jsonb,
  sells_count     int,
  wins_count      int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'invalid bucket: %', p_bucket;
  end if;

  return query
  with sells as (
    select
      date_trunc(p_bucket, coalesce(t.date, ph.created_at))::date as bucket_date,
      coalesce(s.category, 'Uncategorized') as category,
      ph.amount as profit,
      coalesce(t.total, 0) as turnover,
      1 as sells_count,
      case when ph.amount > 0 then 1 else 0 end as is_win
    from profit_history ph
    left join transactions t on t.id = ph.transaction_id and t.user_id = ph.user_id
    left join stocks s on s.id = coalesce(ph.stock_id, t.stock_id) and s.user_id = ph.user_id
    where ph.user_id = p_user_id
      and ph.profit_type = 'stock'
      and coalesce(t.date, ph.created_at) >= p_start
      and coalesce(t.date, ph.created_at) < p_end + interval '1 day'
  ),
  buys as (
    select
      date_trunc(p_bucket, t.date)::date as bucket_date,
      t.total as turnover
    from transactions t
    where t.user_id = p_user_id
      and t.type = 'buy'
      and t.date >= p_start
      and t.date < p_end + interval '1 day'
  ),
  other_profit as (
    select
      date_trunc(p_bucket, ph.created_at)::date as bucket_date,
      ph.profit_type,
      ph.amount
    from profit_history ph
    where ph.user_id = p_user_id
      and ph.profit_type in ('dump', 'referral', 'bonds')
      and ph.created_at >= p_start
      and ph.created_at < p_end + interval '1 day'
  ),
  sells_agg as (
    select
      bucket_date,
      sum(profit)::bigint as profit_items,
      sum(turnover)::bigint as turnover,
      sum(sells_count)::int as sells_count,
      sum(is_win)::int as wins_count,
      jsonb_object_agg(category, cat_profit) as by_category
    from (
      select
        bucket_date,
        category,
        sum(profit) as cat_profit,
        sum(turnover) as turnover,
        sum(sells_count) as sells_count,
        sum(is_win) as is_win
      from sells
      group by bucket_date, category
    ) per_cat
    group by bucket_date
  ),
  buys_agg as (
    select bucket_date, sum(turnover)::bigint as turnover
    from buys
    group by bucket_date
  ),
  other_agg as (
    select
      bucket_date,
      sum(case when profit_type = 'dump' then amount else 0 end)::bigint as profit_dump,
      sum(case when profit_type = 'referral' then amount else 0 end)::bigint as profit_referral,
      sum(case when profit_type = 'bonds' then amount else 0 end)::bigint as profit_bonds
    from other_profit
    group by bucket_date
  ),
  all_buckets as (
    select bucket_date from sells_agg
    union
    select bucket_date from buys_agg
    union
    select bucket_date from other_agg
  )
  select
    b.bucket_date,
    coalesce(s.profit_items, 0)::bigint,
    coalesce(o.profit_dump, 0)::bigint,
    coalesce(o.profit_referral, 0)::bigint,
    coalesce(o.profit_bonds, 0)::bigint,
    (coalesce(s.turnover, 0) + coalesce(bu.turnover, 0))::bigint as gp_traded,
    coalesce(s.by_category, '{}'::jsonb),
    coalesce(s.sells_count, 0)::int,
    coalesce(s.wins_count, 0)::int
  from all_buckets b
  left join sells_agg s on s.bucket_date = b.bucket_date
  left join buys_agg bu on bu.bucket_date = b.bucket_date
  left join other_agg o on o.bucket_date = b.bucket_date
  order by b.bucket_date asc;
end;
$$;

grant execute on function public.get_analytics_buckets(uuid, date, date, text) to authenticated;
