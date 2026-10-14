-- Applied to Supabase project hzvuzhrdxenmotuehnpz (eu-west-1) on 2026-10-14.
-- Saved planner scenarios with link-based access (view link / secret edit link).
-- The table is closed to the API; all access goes through these functions.
create table public.scenarios (
  id          uuid primary key default gen_random_uuid(),
  edit_token  uuid not null default gen_random_uuid(),
  name        text not null default 'Untitled plan' check (char_length(name) between 1 and 80),
  data        jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 100000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.scenarios enable row level security;
revoke all on public.scenarios from anon, authenticated;

create function public.create_scenario(p_name text, p_data jsonb)
returns table (id uuid, edit_token uuid, updated_at timestamptz)
language sql security definer set search_path = '' as $$
  insert into public.scenarios (name, data)
  values (coalesce(nullif(trim(p_name), ''), 'Untitled plan'), p_data)
  returning scenarios.id, scenarios.edit_token, scenarios.updated_at;
$$;

create function public.get_scenario(p_id uuid)
returns table (id uuid, name text, data jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.data, s.updated_at from public.scenarios s where s.id = p_id;
$$;

create function public.update_scenario(p_id uuid, p_token uuid, p_name text, p_data jsonb)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare v_updated timestamptz;
begin
  update public.scenarios
     set name = coalesce(nullif(trim(p_name), ''), name), data = p_data, updated_at = now()
   where id = p_id and edit_token = p_token
  returning updated_at into v_updated;
  if v_updated is null then
    raise exception 'Scenario not found or edit link invalid' using errcode = '42501';
  end if;
  return v_updated;
end;
$$;

create function public.delete_scenario(p_id uuid, p_token uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.scenarios where id = p_id and edit_token = p_token;
  return found;
end;
$$;

revoke execute on function public.create_scenario(text, jsonb), public.get_scenario(uuid),
  public.update_scenario(uuid, uuid, text, jsonb), public.delete_scenario(uuid, uuid) from public;
grant execute on function public.create_scenario(text, jsonb), public.get_scenario(uuid),
  public.update_scenario(uuid, uuid, text, jsonb), public.delete_scenario(uuid, uuid) to anon, authenticated;
