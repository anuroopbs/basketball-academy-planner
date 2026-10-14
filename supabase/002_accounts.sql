-- Applied to hzvuzhrdxenmotuehnpz on 2026-10-14.
-- Plans belong to a signed-in account. Creating/listing requires sign-in;
-- owners can update/delete from any device. View links stay public and
-- existing edit tokens keep working.
alter table public.scenarios add column owner uuid references auth.users(id) on delete cascade;
create index scenarios_owner_idx on public.scenarios(owner);

create or replace function public.create_scenario(p_name text, p_data jsonb)
returns table (id uuid, edit_token uuid, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to save plans' using errcode = '42501';
  end if;
  return query
    insert into public.scenarios (name, data, owner)
    values (coalesce(nullif(trim(p_name), ''), 'Untitled plan'), p_data, auth.uid())
    returning scenarios.id, scenarios.edit_token, scenarios.updated_at;
end;
$$;

create or replace function public.update_scenario(p_id uuid, p_token uuid, p_name text, p_data jsonb)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare v_updated timestamptz;
begin
  update public.scenarios
     set name = coalesce(nullif(trim(p_name), ''), name), data = p_data, updated_at = now()
   where id = p_id
     and (edit_token = p_token or (auth.uid() is not null and owner = auth.uid()))
  returning updated_at into v_updated;
  if v_updated is null then
    raise exception 'Scenario not found or no permission to edit' using errcode = '42501';
  end if;
  return v_updated;
end;
$$;

create or replace function public.delete_scenario(p_id uuid, p_token uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.scenarios
   where id = p_id
     and (edit_token = p_token or (auth.uid() is not null and owner = auth.uid()));
  return found;
end;
$$;

create function public.list_my_scenarios()
returns table (id uuid, name text, edit_token uuid, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.edit_token, s.updated_at
    from public.scenarios s
   where auth.uid() is not null and s.owner = auth.uid()
   order by s.updated_at desc;
$$;

revoke execute on function public.create_scenario(text, jsonb), public.list_my_scenarios() from public, anon;
grant execute on function public.create_scenario(text, jsonb), public.list_my_scenarios() to authenticated;
