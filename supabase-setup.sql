-- Run once in this project's Supabase SQL Editor.
-- No account data, passwords, tokens, or secret keys belong in this file.
begin;
create table if not exists public.sepuede_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  constraint sepuede_workspace_object check (jsonb_typeof(data) = 'object')
);
alter table public.sepuede_workspaces enable row level security;
alter table public.sepuede_workspaces force row level security;
revoke all on public.sepuede_workspaces from anon;
revoke all on public.sepuede_workspaces from authenticated;
grant select, insert, update on public.sepuede_workspaces to authenticated;
drop policy if exists sepuede_read_own on public.sepuede_workspaces;
create policy sepuede_read_own on public.sepuede_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists sepuede_insert_own on public.sepuede_workspaces;
create policy sepuede_insert_own on public.sepuede_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists sepuede_update_own on public.sepuede_workspaces;
create policy sepuede_update_own on public.sepuede_workspaces for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.sepuede_save_workspace(expected_revision bigint, payload jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare result_revision bigint;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception 'Invalid revision' using errcode = '22023';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 2097152
    or jsonb_typeof(payload->'projects') is distinct from 'array'
    or jsonb_typeof(payload->'tasks') is distinct from 'array'
    or jsonb_typeof(payload->'jobs') is distinct from 'array'
    or jsonb_typeof(payload->'goals') is distinct from 'array'
    or jsonb_typeof(payload->'logs') is distinct from 'array'
    or jsonb_typeof(payload->'papers') is distinct from 'array'
    or jsonb_typeof(payload->'dailyNotes') is distinct from 'object' then
    raise exception 'Invalid workspace or workspace larger than 2 MB' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.sepuede_workspaces(user_id,data,revision) values(auth.uid(),payload,1)
    on conflict (user_id) do nothing returning revision into result_revision;
  else
    update public.sepuede_workspaces set data=payload, revision=revision+1, updated_at=now()
    where user_id=auth.uid() and revision=expected_revision returning revision into result_revision;
  end if;
  if result_revision is null then
    raise exception 'Workspace changed on another device. Load the account copy before saving.' using errcode='40001';
  end if;
  return result_revision;
end;
$$;
revoke all on function public.sepuede_save_workspace(bigint,jsonb) from public, anon;
grant execute on function public.sepuede_save_workspace(bigint,jsonb) to authenticated;
commit;
