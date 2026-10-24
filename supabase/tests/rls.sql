-- RLS / constraint tests. Runs against the database prepared by tests/run.sh (after seed.sql).
-- Seed users: alice (owner), bob (editor) on board aaaaaaaa-...-0001.

create schema t;
grant usage on schema t to anon, authenticated;

create function t.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', p_uid::text, false);
  execute 'set role authenticated';
end $$;

create function t.as_anon() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', false);
  execute 'set role anon';
end $$;

create function t.as_admin() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;

create function t.count_is(p_sql text, p_expected bigint, p_label text) returns void language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  if n is distinct from p_expected then
    raise exception 'FAIL [%]: expected % rows, got %', p_label, p_expected, n;
  end if;
  raise notice 'ok - %', p_label;
end $$;

-- Passes only if the statement raises an error.
create function t.fails(p_sql text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok - % (%)', p_label, sqlerrm;
    return;
  end;
  raise exception 'FAIL [%]: statement succeeded but should have failed', p_label;
end $$;

-- Passes only if the statement succeeds and affects exactly p_rows rows.
create function t.affects(p_sql text, p_rows bigint, p_label text) returns void language plpgsql as $$
declare n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  if n <> p_rows then
    raise exception 'FAIL [%]: expected % affected rows, got %', p_label, p_rows, n;
  end if;
  raise notice 'ok - %', p_label;
end $$;

grant execute on all functions in schema t to anon, authenticated;


-- sanity: schema-level guarantees ------------------------------------------------
select t.count_is($q$ select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $q$, 0, 'RLS enabled on every public table');
select t.count_is($q$ select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' $q$, 10, 'realtime publishes 10 tables');
select t.count_is($q$ select 1 from public.profiles $q$, 2, 'seed trigger created profiles');

-- anon gets nothing ---------------------------------------------------------------
select t.as_anon();
select t.fails($q$ select * from public.boards $q$, 'anon cannot read boards');
select t.fails($q$ select private.is_board_member('aaaaaaaa-0000-0000-0000-000000000001') $q$, 'anon cannot reach the private helper schema');

-- a stranger (carol) sees nothing ---------------------------------------------------
select t.as_admin();
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('33333333-3333-3333-3333-333333333333', 'Carol@Example.com', now(), '{}');
select t.as_user('33333333-3333-3333-3333-333333333333');
select t.count_is('select 1 from public.boards', 0, 'stranger sees no boards');
select t.count_is('select 1 from public.lists', 0, 'stranger sees no lists');
select t.count_is('select 1 from public.cards', 0, 'stranger sees no cards');
select t.count_is('select 1 from public.comments', 0, 'stranger sees no comments');
select t.count_is('select 1 from public.board_members', 0, 'stranger sees no memberships');
select t.count_is('select 1 from public.profiles', 1, 'stranger sees only own profile');
select t.fails($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'a5') $q$, 'stranger cannot add list');
select t.affects($q$ update public.boards set title = 'hacked' $q$, 0, 'stranger cannot rename board');
select t.affects($q$ delete from public.cards $q$, 0, 'stranger cannot delete cards');
select t.fails($q$ insert into public.board_members (board_id, user_id, role) values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'owner') $q$, 'stranger cannot self-join as owner');
select t.fails($q$ select public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'x@y.com') $q$, 'stranger cannot invite');
select t.affects($q$ update public.profiles set display_name = 'pwned' where id = '11111111-1111-1111-1111-111111111111' $q$, 0, 'cannot edit others profile');
select t.count_is($q$ select 1 from public.profiles where lower(email) = 'carol@example.com' $q$, 1, 'profile email lower-cased');

-- creating a board ----------------------------------------------------------------
do $$ declare v uuid; begin
  insert into public.boards (title) values ('Carol board') returning id into v;
  if v is null then raise exception 'FAIL: insert returning'; end if;
  raise notice 'ok - insert ... returning works for new board (owner_id default)';
end $$;
select t.count_is($q$ select 1 from public.board_members where role = 'owner' $q$, 1, 'creator became owner member');
select t.fails($q$ insert into public.boards (title, owner_id) values ('spoof', '11111111-1111-1111-1111-111111111111') $q$, 'cannot create board owned by someone else');
select t.fails($q$ update public.boards set owner_id = '11111111-1111-1111-1111-111111111111' $q$, 'owner_id immutable');
select t.fails($q$ delete from public.board_members where user_id = '33333333-3333-3333-3333-333333333333' $q$, 'owner cannot remove own owner membership');

-- editor (bob) ---------------------------------------------------------------------
select t.as_user('22222222-2222-2222-2222-222222222222');
select t.count_is('select 1 from public.cards', 4, 'editor sees cards');
select t.count_is('select 1 from public.profiles', 2, 'editor sees co-members profiles only (not carol)');
select t.count_is('select 1 from public.boards', 1, 'editor does not see carols board');
select t.affects($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Backlog', 'Zz') $q$, 1, 'editor can add list');
select t.affects($q$ insert into public.cards (board_id, list_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'bob card', 'a2') $q$, 1, 'editor can add card (created_by default)');
select t.fails($q$ insert into public.cards (board_id, list_id, title, position, created_by) values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'forged', 'a3', '11111111-1111-1111-1111-111111111111') $q$, 'editor cannot forge created_by');
select t.affects($q$ update public.cards set list_id = 'bbbbbbbb-0000-0000-0000-000000000002', position = 'a1' where id = 'dddddddd-0000-0000-0000-000000000001' $q$, 1, 'editor can move card to another list');
select t.affects($q$ update public.boards set title = 'renamed' $q$, 0, 'editor cannot rename board');
select t.affects($q$ delete from public.boards $q$, 0, 'editor cannot delete board');
select t.fails($q$ insert into public.board_members (board_id, user_id, role) values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'viewer') $q$, 'editor cannot add members');
select t.fails($q$ select public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'x@y.com') $q$, 'editor cannot invite');
select t.affects($q$ update public.board_members set role = 'owner' where user_id = '22222222-2222-2222-2222-222222222222' $q$, 0, 'editor cannot promote self');
select t.affects($q$ insert into public.comments (card_id, board_id, body) values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'hi') $q$, 1, 'editor can comment (user_id default)');
select t.fails($q$ insert into public.comments (card_id, board_id, user_id, body) values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'as alice') $q$, 'editor cannot comment as someone else');
select t.fails($q$ insert into public.card_assignees (card_id, user_id, board_id) values ('dddddddd-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001') $q$, 'cannot assign a non-member');
select t.affects($q$ insert into public.card_assignees (card_id, user_id, board_id) values ('dddddddd-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001') $q$, 1, 'can assign a member');
select t.affects($q$ insert into public.attachments (card_id, board_id, storage_path, file_name, size_bytes) values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001/dddddddd-0000-0000-0000-000000000001/a.png', 'a.png', 10) $q$, 1, 'editor can attach file row');
select t.fails($q$ insert into public.attachments (card_id, board_id, storage_path, file_name, size_bytes) values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'other/path/a.png', 'a.png', 10) $q$, 'attachment path must match board/card');
select t.affects($q$ insert into storage.objects (bucket_id, name) values ('attachments', 'aaaaaaaa-0000-0000-0000-000000000001/dddddddd-0000-0000-0000-000000000001/a.png') $q$, 1, 'editor can upload to own board folder');
select t.fails($q$ insert into storage.objects (bucket_id, name) values ('attachments', 'garbage/a.png') $q$, 'malformed storage path rejected');
select t.fails($q$ update public.profiles set email = 'evil@example.com' where id = '22222222-2222-2222-2222-222222222222' $q$, 'cannot edit profile email column');
select t.affects($q$ update public.profiles set display_name = 'Bobby' where id = '22222222-2222-2222-2222-222222222222' $q$, 1, 'can edit own display name');

-- cross-board integrity + owner (alice) ------------------------------------------------
select t.as_user('11111111-1111-1111-1111-111111111111');
select t.affects($q$ insert into public.boards (id, title) values ('aaaaaaaa-0000-0000-0000-000000000002', 'Second') $q$, 1, 'owner creates a second board');
select t.fails($q$ insert into public.cards (board_id, list_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'x', 'a0') $q$, 'card cannot reference a list from another board');
select t.fails($q$ insert into public.card_labels (card_id, label_id, board_id) values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002') $q$, 'card_label board_id must match parents');
select t.fails($q$ delete from public.board_members where user_id = '11111111-1111-1111-1111-111111111111' and board_id = 'aaaaaaaa-0000-0000-0000-000000000001' $q$, 'owner membership protected');
select t.fails($q$ update public.board_members set role = 'editor' where user_id = '11111111-1111-1111-1111-111111111111' and board_id = 'aaaaaaaa-0000-0000-0000-000000000001' $q$, 'owner cannot be demoted');
select t.affects($q$ delete from public.boards where id = 'aaaaaaaa-0000-0000-0000-000000000002' $q$, 1, 'owner can delete board (cascade past protected membership)');
select t.affects($q$ update public.boards set archived_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000001' $q$, 1, 'owner can archive board');
select t.affects($q$ update public.boards set archived_at = null, title = 'Website project' where id = 'aaaaaaaa-0000-0000-0000-000000000001' $q$, 1, 'owner can rename/unarchive board');

-- archived boards are read-only for everyone but the owner --------------------------------
select t.affects($q$ update public.boards set archived_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000001' $q$, 1, 'owner archives board');
select t.as_user('22222222-2222-2222-2222-222222222222');
select t.count_is('select 1 from public.cards', 5, 'editor can still read an archived board');
select t.fails($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'a7') $q$, 'editor cannot add list to archived board');
select t.affects($q$ update public.cards set title = 'blocked' $q$, 0, 'editor cannot edit cards on archived board');
select t.fails($q$ insert into public.comments (card_id, board_id, body) values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'x') $q$, 'editor cannot comment on archived board');
select t.as_user('11111111-1111-1111-1111-111111111111');
select t.fails($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'a7') $q$, 'even the owner cannot edit content while archived');
select t.affects($q$ update public.boards set archived_at = null where id = 'aaaaaaaa-0000-0000-0000-000000000001' $q$, 1, 'owner can unarchive');
select t.affects($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'again', 'a7') $q$, 1, 'editing works again after unarchive');

-- helper functions are no longer part of the public API ------------------------------------
select t.count_is($q$ select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                      where n.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute') $q$, 1,
                  'only invite_to_board is an executable SECURITY DEFINER function in public');

-- invitations ----------------------------------------------------------------------
select t.fails($q$ select public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'x@y.com', 'owner') $q$, 'cannot invite as owner');
select t.fails($q$ select public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'not-an-email') $q$, 'invalid email rejected');
do $$ begin
  if public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', ' CAROL@example.com ', 'viewer') <> 'added' then
    raise exception 'FAIL: existing confirmed user should be added directly'; end if;
  if public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'carol@example.com', 'viewer') <> 'already_member' then
    raise exception 'FAIL: second invite should report already_member'; end if;
  if public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'Dave@Example.com', 'viewer') <> 'invited' then
    raise exception 'FAIL: unknown email should create invitation'; end if;
  raise notice 'ok - invite_to_board returns added / already_member / invited';
end $$;
select t.count_is('select 1 from public.board_invitations', 1, 'owner sees pending invitation');

select t.as_user('33333333-3333-3333-3333-333333333333');
select t.count_is('select 1 from public.board_invitations', 0, 'non-owner cannot see invitations');
select t.count_is('select 1 from public.cards', 5, 'invited existing user (viewer) now sees cards');
select t.affects($q$ update public.cards set title = 'viewer edit' $q$, 0, 'viewer cannot edit cards');
select t.fails($q$ insert into public.comments (card_id, board_id, body) values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'viewer comment') $q$, 'viewer cannot comment');
select t.fails($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'v', 'a9') $q$, 'viewer cannot add list');
select t.count_is('select 1 from storage.objects', 1, 'viewer can read attachments');
select t.fails($q$ insert into storage.objects (bucket_id, name) values ('attachments', 'aaaaaaaa-0000-0000-0000-000000000001/dddddddd-0000-0000-0000-000000000001/v.png') $q$, 'viewer cannot upload');

-- signup flow: pending invitation is claimed only after email confirmation ----------------
select t.as_admin();
insert into auth.users (id, email, email_confirmed_at) values ('44444444-4444-4444-4444-444444444444', 'dave@example.com', null);
select t.count_is($q$ select 1 from public.board_members where user_id = '44444444-4444-4444-4444-444444444444' $q$, 0, 'unconfirmed signup does not claim invitation');
update auth.users set email_confirmed_at = now() where id = '44444444-4444-4444-4444-444444444444';
select t.count_is($q$ select 1 from public.board_members where user_id = '44444444-4444-4444-4444-444444444444' and role = 'viewer' $q$, 1, 'confirming email claims invitation with its role');
select t.count_is('select 1 from public.board_invitations', 0, 'claimed invitation removed');

-- role changes + removal -----------------------------------------------------------------
select t.as_user('11111111-1111-1111-1111-111111111111');
select t.affects($q$ update public.board_members set role = 'viewer' where user_id = '22222222-2222-2222-2222-222222222222' $q$, 1, 'owner can demote editor to viewer');
select t.as_user('22222222-2222-2222-2222-222222222222');
select t.fails($q$ insert into public.lists (board_id, title, position) values ('aaaaaaaa-0000-0000-0000-000000000001', 'now viewer', 'a8') $q$, 'demoted member loses write access');
select t.as_user('11111111-1111-1111-1111-111111111111');
select t.affects($q$ delete from public.board_members where user_id = '22222222-2222-2222-2222-222222222222' $q$, 1, 'owner can remove member');
select t.as_admin();
select t.count_is($q$ select 1 from public.card_assignees where user_id = '22222222-2222-2222-2222-222222222222' $q$, 0, 'removing member clears their assignments');
select t.as_user('22222222-2222-2222-2222-222222222222');
select t.count_is('select 1 from public.cards', 0, 'removed member loses all access');
select t.count_is('select 1 from storage.objects', 0, 'removed member loses storage access');

-- member can leave on their own -------------------------------------------------------------
select t.as_user('11111111-1111-1111-1111-111111111111');
do $$ begin
  if public.invite_to_board('aaaaaaaa-0000-0000-0000-000000000001', 'bob@example.com', 'editor') <> 'added' then
    raise exception 'FAIL: re-adding bob'; end if;
end $$;
select t.as_user('22222222-2222-2222-2222-222222222222');
select t.affects($q$ delete from public.board_members where user_id = '22222222-2222-2222-2222-222222222222' $q$, 1, 'member can leave board');

select t.as_admin();
\echo ALL RLS TESTS PASSED
