-- ─────────────────────────────────────────────────────────────
-- RLS verification — run in the Supabase SQL editor after applying
-- schema.sql AND security-and-performance.sql.
--
-- BOTH result sets should return ZERO rows. Any row is a privacy hole:
-- a table that authenticated users (incl. the other account) could read
-- or write without restriction.
-- ─────────────────────────────────────────────────────────────

-- 1) public tables that do NOT have Row Level Security enabled
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by 1;

-- 2) public tables that have NO policies (RLS on + no policy = deny-all;
--    RLS off + no policy = wide open — cross-check with query 1)
select t.tablename as table_without_policies
from pg_tables t
left join pg_policies p
  on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename
having count(p.policyname) = 0
order by 1;
