-- Hardening pass:
--  * RLS helper functions are SECURITY DEFINER, so they must not live in an exposed schema
--    (every function in `public` is callable through the Data API). Move them to `private`.
--  * Archived boards become read-only at the database level (owners can still unarchive).
--  * Index the remaining foreign keys.

create schema if not exists private;
grant usage on schema private to authenticated;

-- Policies and Storage policies reference these functions by OID, so they keep working after the move.
alter function public.board_role_of(uuid)     set schema private;
alter function public.is_board_member(uuid)   set schema private;
alter function public.can_edit_board(uuid)    set schema private;
alter function public.is_board_owner(uuid)    set schema private;
alter function public.shares_board_with(uuid) set schema private;
alter function public.try_uuid(text)          set schema private;

-- SQL function bodies are stored as text, so the internal references must be updated by hand.
create or replace function private.is_board_member(p_board_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$ select private.board_role_of(p_board_id) is not null $$;

create or replace function private.is_board_owner(p_board_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$ select coalesce(private.board_role_of(p_board_id) = 'owner', false) $$;

-- Owners and editors may write, unless the board is archived.
create or replace function private.can_edit_board(p_board_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(private.board_role_of(p_board_id) in ('owner', 'editor'), false)
    and not exists (select 1 from public.boards b where b.id = p_board_id and b.archived_at is not null)
$$;

create or replace function public.invite_to_board(p_board_id uuid, p_email text, p_role public.board_role default 'editor')
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email   text := lower(btrim(p_email));
  v_user_id uuid;
begin
  if not private.is_board_owner(p_board_id) then
    raise exception 'only the board owner can invite members' using errcode = '42501';
  end if;
  if p_role = 'owner' then
    raise exception 'cannot invite as owner' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  select p.id into v_user_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.email = v_email and u.email_confirmed_at is not null;

  if v_user_id is not null then
    insert into public.board_members (board_id, user_id, role)
    values (p_board_id, v_user_id, p_role)
    on conflict (board_id, user_id) do nothing;
    if not found then
      return 'already_member';
    end if;
    return 'added';
  end if;

  insert into public.board_invitations (board_id, email, role, invited_by)
  values (p_board_id, v_email, p_role, (select auth.uid()))
  on conflict (board_id, email) do update set role = excluded.role;
  return 'invited';
end;
$$;

-- Foreign keys that had no supporting index (deletes/updates of the parent row scan the child table).
create index comments_user_id_idx on public.comments (user_id);
create index cards_created_by_idx on public.cards (created_by) where created_by is not null;
create index attachments_uploaded_by_idx on public.attachments (uploaded_by) where uploaded_by is not null;
create index board_invitations_invited_by_idx on public.board_invitations (invited_by) where invited_by is not null;
