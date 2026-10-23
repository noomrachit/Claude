-- Publish board tables to Supabase Realtime. REPLICA IDENTITY FULL makes DELETE
-- events carry board_id so clients can filter on it (RLS is not applied to DELETE events).

do $$
declare
  t text;
begin
  foreach t in array array[
    'boards', 'board_members', 'lists', 'cards', 'labels', 'card_labels',
    'card_assignees', 'checklist_items', 'attachments', 'comments'
  ] loop
    execute format('alter table public.%I replica identity full', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end;
$$;
