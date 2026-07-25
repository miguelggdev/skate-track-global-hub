
-- 1) Ensure auth -> profiles triggers exist so profiles/roles are created automatically

-- Drop and recreate the trigger for new users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- Drop and recreate the trigger for user confirmation updates
drop trigger if exists on_auth_user_confirmed on auth.users;

create trigger on_auth_user_confirmed
after update of email_confirmed_at on auth.users
for each row
when (
  new.email_confirmed_at is not null
  and (old.email_confirmed_at is distinct from new.email_confirmed_at)
)
execute procedure public.handle_user_confirmed();

-- 2) Backfill profiles for existing users missing a profile row
insert into public.profiles (id, email, first_name, last_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'first_name', ''),
  coalesce(u.raw_user_meta_data ->> 'last_name', ''),
  coalesce((u.raw_user_meta_data ->> 'role')::user_role, 'athlete'::user_role)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3) If there is no admin yet, promote the earliest auth user to admin (bootstrap)
do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles p
      set role = 'admin'
    from (
      select id
      from auth.users
      order by created_at asc
      limit 1
    ) fu
    where p.id = fu.id;
  end if;
end$$;

-- 4) Ensure there is at least one club_settings row to avoid nulls in the config page
insert into public.club_settings (club_name, timezone, currency, language)
select 'Mi Club', 'Europe/Madrid', 'EUR', 'es'
where not exists (select 1 from public.club_settings);
