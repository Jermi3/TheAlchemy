/*
  # Staff Management Tables

  1. Staff Profiles
    - Links Supabase Auth users to staff metadata (role, status, display name)
    - Automatically provisions default component permissions for each new staff

  2. Component Permissions
    - Stores per-component view/manage flags for admin dashboard sections

  3. Security & Policies
    - RLS enforcement so only authenticated staff can read
    - Only owners can manage other staff records and permissions
*/

create table if not exists staff_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  display_name text not null,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_staff_profiles_email on staff_profiles(email);
create index if not exists idx_staff_profiles_auth_user_id on staff_profiles(auth_user_id);

create table if not exists staff_permissions (
  staff_id uuid references staff_profiles(id) on delete cascade,
  component text not null,
  can_view boolean not null default false,
  can_manage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_permissions_component_check check (
    component in ('dashboard', 'items', 'orders', 'categories', 'payments', 'settings', 'staff')
  ),
  primary key (staff_id, component)
);

alter table staff_profiles enable row level security;
alter table staff_permissions enable row level security;

create or replace function public.staff_has_role(roles text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from staff_profiles sp
    where sp.auth_user_id = auth.uid()
      and sp.active
      and sp.role = any(roles)
  );
$$;

revoke all on function public.staff_has_role(text[]) from public;
grant execute on function public.staff_has_role(text[]) to authenticated;

create or replace function public.ensure_staff_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into staff_permissions (staff_id, component, can_view, can_manage)
  select new.id as staff_id,
         component,
         component in ('dashboard', 'items', 'orders', 'categories', 'payments', 'settings'),
         component in ('items', 'orders', 'categories', 'payments', 'settings')
  from unnest(array['dashboard', 'items', 'orders', 'categories', 'payments', 'settings', 'staff']) as component
  on conflict (staff_id, component) do nothing;
  return new;
end;
$$;

drop trigger if exists ensure_staff_permissions_after_insert on staff_profiles;
create trigger ensure_staff_permissions_after_insert
  after insert on staff_profiles
  for each row execute function public.ensure_staff_permissions();

-- updated_at triggers reuse the existing helper
create trigger update_staff_profiles_updated_at
  before update on staff_profiles
  for each row execute function update_updated_at_column();

create trigger update_staff_permissions_updated_at
  before update on staff_permissions
  for each row execute function update_updated_at_column();

-- Policies for staff_profiles
create policy "Staff can view profiles"
  on staff_profiles
  for select
  to authenticated
  using (true);

create policy "Staff can update their own profile"
  on staff_profiles
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy "Owners manage staff profiles"
  on staff_profiles
  for all
  to authenticated
  using (public.staff_has_role(array['owner']))
  with check (public.staff_has_role(array['owner']));

-- Policies for staff_permissions
create policy "Staff can view permissions"
  on staff_permissions
  for select
  to authenticated
  using (
    public.staff_has_role(array['owner','manager'])
    or exists (
      select 1
      from staff_profiles sp
      where sp.id = staff_permissions.staff_id
        and sp.auth_user_id = auth.uid()
    )
  );

create policy "Owners manage staff permissions"
  on staff_permissions
  for all
  to authenticated
  using (public.staff_has_role(array['owner']))
  with check (public.staff_has_role(array['owner']));

-- Owners should always retain manage access
insert into staff_permissions (staff_id, component, can_view, can_manage)
select sp.id,
       'staff' as component,
       true,
       true
from staff_profiles sp
where sp.role = 'owner'
on conflict (staff_id, component) do nothing;
