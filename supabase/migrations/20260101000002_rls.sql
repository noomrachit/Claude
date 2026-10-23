-- Row Level Security: every table is locked down to members of the board.
-- Roles: owner (manage board + members), editor (read/write content), viewer (read only).

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies on board_members cannot recurse)
-- ---------------------------------------------------------------------------
create function public.board_role_of(p_board_id uuid) returns public.board_role
language sql stable security definer
set search_path = ''
as $$
  select m.role from public.board_members m
  where m.board_id = p_board_id and m.user_id = (select auth.uid())
$$;

create function public.is_board_member(p_board_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$ select public.board_role_of(p_board_id) is not null $$;

create function public.can_edit_board(p_board_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$ select coalesce(public.board_role_of(p_board_id) in ('owner', 'editor'), false) $$;

create function public.is_board_owner(p_board_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$ select coalesce(public.board_role_of(p_board_id) = 'owner', false) $$;

create function public.shares_board_with(p_user_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.board_members a
    join public.board_members b on b.board_id = a.board_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user_id
  )
$$;

-- Parse a uuid from a storage path segment without raising on garbage.
create function public.try_uuid(p_text text) returns uuid
language plpgsql immutable
set search_path = ''
as $$
begin
  return p_text::uuid;
exception when others then
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invite by email: adds an existing confirmed user directly, otherwise stores a
-- pending invitation that is claimed when that email confirms an account.
-- ---------------------------------------------------------------------------
create function public.invite_to_board(p_board_id uuid, p_email text, p_role public.board_role default 'editor')
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email   text := lower(btrim(p_email));
  v_user_id uuid;
begin
  if not public.is_board_owner(p_board_id) then
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

-- ---------------------------------------------------------------------------
-- Defaults so clients never have to send their own id
-- ---------------------------------------------------------------------------
alter table public.boards            alter column owner_id    set default auth.uid();
alter table public.board_invitations alter column invited_by  set default auth.uid();
alter table public.cards             alter column created_by  set default auth.uid();
alter table public.attachments       alter column uploaded_by set default auth.uid();
alter table public.comments          alter column user_id     set default auth.uid();

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Profiles are created only by the signup trigger; users may edit just their display fields.
revoke insert, delete, update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Trigger functions must not be callable as RPC.
revoke all on function public.set_updated_at()                from public, anon, authenticated;
revoke all on function public.handle_new_user()               from public, anon, authenticated;
revoke all on function public.claim_board_invitations()       from public, anon, authenticated;
revoke all on function public.handle_new_board()              from public, anon, authenticated;
revoke all on function public.prevent_owner_change()          from public, anon, authenticated;
revoke all on function public.protect_board_owner_membership() from public, anon, authenticated;

-- Helpers and RPC: signed-in users only.
revoke all on function public.board_role_of(uuid)       from public, anon;
revoke all on function public.is_board_member(uuid)     from public, anon;
revoke all on function public.can_edit_board(uuid)      from public, anon;
revoke all on function public.is_board_owner(uuid)      from public, anon;
revoke all on function public.shares_board_with(uuid)   from public, anon;
revoke all on function public.try_uuid(text)            from public, anon;
revoke all on function public.invite_to_board(uuid, text, public.board_role) from public, anon;
grant execute on function public.board_role_of(uuid)       to authenticated;
grant execute on function public.is_board_member(uuid)     to authenticated;
grant execute on function public.can_edit_board(uuid)      to authenticated;
grant execute on function public.is_board_owner(uuid)      to authenticated;
grant execute on function public.shares_board_with(uuid)   to authenticated;
grant execute on function public.try_uuid(text)            to authenticated;
grant execute on function public.invite_to_board(uuid, text, public.board_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.boards            enable row level security;
alter table public.board_members     enable row level security;
alter table public.board_invitations enable row level security;
alter table public.lists             enable row level security;
alter table public.cards             enable row level security;
alter table public.labels            enable row level security;
alter table public.card_labels       enable row level security;
alter table public.card_assignees    enable row level security;
alter table public.checklist_items   enable row level security;
alter table public.attachments       enable row level security;
alter table public.comments          enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_board_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- boards (creator sees the row immediately, before the owner-membership trigger is visible)
-- ---------------------------------------------------------------------------
create policy boards_select on public.boards for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_board_member(id));
create policy boards_insert on public.boards for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy boards_update on public.boards for update to authenticated
  using (public.is_board_owner(id)) with check (public.is_board_owner(id));
create policy boards_delete on public.boards for delete to authenticated
  using (public.is_board_owner(id));

-- ---------------------------------------------------------------------------
-- board_members / board_invitations
-- ---------------------------------------------------------------------------
create policy board_members_select on public.board_members for select to authenticated
  using (public.is_board_member(board_id));
create policy board_members_insert on public.board_members for insert to authenticated
  with check (public.is_board_owner(board_id));
create policy board_members_update on public.board_members for update to authenticated
  using (public.is_board_owner(board_id)) with check (public.is_board_owner(board_id));
create policy board_members_delete on public.board_members for delete to authenticated
  using (public.is_board_owner(board_id) or user_id = (select auth.uid()));

create policy board_invitations_all on public.board_invitations for all to authenticated
  using (public.is_board_owner(board_id))
  with check (public.is_board_owner(board_id) and invited_by = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Board content: members read, owner/editor write
-- ---------------------------------------------------------------------------
create policy lists_select on public.lists for select to authenticated using (public.is_board_member(board_id));
create policy lists_insert on public.lists for insert to authenticated with check (public.can_edit_board(board_id));
create policy lists_update on public.lists for update to authenticated using (public.can_edit_board(board_id)) with check (public.can_edit_board(board_id));
create policy lists_delete on public.lists for delete to authenticated using (public.can_edit_board(board_id));

create policy cards_select on public.cards for select to authenticated using (public.is_board_member(board_id));
create policy cards_insert on public.cards for insert to authenticated
  with check (public.can_edit_board(board_id) and created_by = (select auth.uid()));
create policy cards_update on public.cards for update to authenticated using (public.can_edit_board(board_id)) with check (public.can_edit_board(board_id));
create policy cards_delete on public.cards for delete to authenticated using (public.can_edit_board(board_id));

create policy labels_select on public.labels for select to authenticated using (public.is_board_member(board_id));
create policy labels_insert on public.labels for insert to authenticated with check (public.can_edit_board(board_id));
create policy labels_update on public.labels for update to authenticated using (public.can_edit_board(board_id)) with check (public.can_edit_board(board_id));
create policy labels_delete on public.labels for delete to authenticated using (public.can_edit_board(board_id));

create policy card_labels_select on public.card_labels for select to authenticated using (public.is_board_member(board_id));
create policy card_labels_insert on public.card_labels for insert to authenticated with check (public.can_edit_board(board_id));
create policy card_labels_delete on public.card_labels for delete to authenticated using (public.can_edit_board(board_id));

create policy card_assignees_select on public.card_assignees for select to authenticated using (public.is_board_member(board_id));
create policy card_assignees_insert on public.card_assignees for insert to authenticated with check (public.can_edit_board(board_id));
create policy card_assignees_delete on public.card_assignees for delete to authenticated using (public.can_edit_board(board_id));

create policy checklist_items_select on public.checklist_items for select to authenticated using (public.is_board_member(board_id));
create policy checklist_items_insert on public.checklist_items for insert to authenticated with check (public.can_edit_board(board_id));
create policy checklist_items_update on public.checklist_items for update to authenticated using (public.can_edit_board(board_id)) with check (public.can_edit_board(board_id));
create policy checklist_items_delete on public.checklist_items for delete to authenticated using (public.can_edit_board(board_id));

create policy attachments_select on public.attachments for select to authenticated using (public.is_board_member(board_id));
create policy attachments_insert on public.attachments for insert to authenticated
  with check (public.can_edit_board(board_id) and uploaded_by = (select auth.uid()));
create policy attachments_delete on public.attachments for delete to authenticated
  using (public.can_edit_board(board_id) and (uploaded_by = (select auth.uid()) or public.is_board_owner(board_id)));

create policy comments_select on public.comments for select to authenticated using (public.is_board_member(board_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (public.can_edit_board(board_id) and user_id = (select auth.uid()));
create policy comments_update on public.comments for update to authenticated
  using (user_id = (select auth.uid()) and public.can_edit_board(board_id))
  with check (user_id = (select auth.uid()) and public.can_edit_board(board_id));
create policy comments_delete on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_board_owner(board_id));
