-- Realtime via database-triggered Broadcast on private channels (replaces Postgres Changes).
--
-- Why: Postgres Changes cannot filter DELETE events (with RLS on, the old row only carries primary
-- keys, so a `board_id=eq.…` filter never matches) and RLS is not applied to them. Broadcast from a
-- trigger carries the full old row and is authorised per channel with a policy on realtime.messages.
--
-- Topics:  board:<board_id>  every change of that board (members only)
--          user:<user_id>    that user's membership changes and renames/archiving of their boards

-- Postgres Changes is no longer used: stop publishing the tables and restore default replica identity.
do $$
declare
  t text;
begin
  foreach t in array array[
    'boards', 'board_members', 'lists', 'cards', 'labels', 'card_labels',
    'card_assignees', 'checklist_items', 'attachments', 'comments'
  ] loop
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
    execute format('alter table public.%I replica identity default', t);
  end loop;
end;
$$;

create or replace function private.broadcast_board_change() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_row    jsonb := to_jsonb(coalesce(new, old));
  v_board  uuid;
  v_member uuid;
begin
  v_board := case when tg_table_name = 'boards' then (v_row ->> 'id')::uuid else (v_row ->> 'board_id')::uuid end;

  perform realtime.broadcast_changes('board:' || v_board::text, tg_op, tg_op, tg_table_name, tg_table_schema, new, old);

  if tg_table_name = 'board_members' then
    -- Board list: someone was added, removed or changed role.
    perform realtime.broadcast_changes('user:' || (v_row ->> 'user_id'), tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  elsif tg_table_name = 'boards' and tg_op = 'UPDATE' then
    -- Board list: rename / archive. (Deleting a board removes its membership rows, which notifies above.)
    for v_member in select m.user_id from public.board_members m where m.board_id = v_board loop
      perform realtime.broadcast_changes('user:' || v_member::text, tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
    end loop;
  end if;

  return null;
end;
$$;

revoke all on function private.broadcast_board_change() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'boards', 'board_members', 'lists', 'cards', 'labels', 'card_labels',
    'card_assignees', 'checklist_items', 'attachments', 'comments'
  ] loop
    execute format(
      'create trigger broadcast_changes after insert or update or delete on public.%I
         for each row execute function private.broadcast_board_change()', t);
  end loop;
end;
$$;

-- Who may listen. Only the server (triggers) sends; clients get no INSERT policy.
-- Authorisation is evaluated when a client joins a channel, so the app also re-checks
-- membership itself when it sees its own membership change.
create policy realtime_receive_board_and_user_topics on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (
      (
        (select realtime.topic()) like 'board:%'
        and private.is_board_member(private.try_uuid(substr((select realtime.topic()), 7)))
      )
      or (select realtime.topic()) = 'user:' || (select auth.uid())::text
    )
  );
