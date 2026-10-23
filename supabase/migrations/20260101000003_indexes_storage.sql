-- Indexes for foreign keys, ordering and search, plus the private attachments bucket.

-- Membership lookups happen in every RLS check (PK already covers board_id, user_id).
create index board_members_user_id_idx on public.board_members (user_id);
create index board_invitations_email_idx on public.board_invitations (email);
create index boards_owner_id_idx on public.boards (owner_id);

create index lists_board_position_idx on public.lists (board_id, position);
create index cards_list_position_idx on public.cards (list_id, position);
create index cards_board_id_idx on public.cards (board_id);
create index cards_due_date_idx on public.cards (board_id, due_date) where due_date is not null;
create index cards_title_trgm_idx on public.cards using gin (title extensions.gin_trgm_ops);
create index labels_board_id_idx on public.labels (board_id);

create index card_labels_label_id_idx on public.card_labels (label_id);
create index card_labels_board_id_idx on public.card_labels (board_id);
create index card_assignees_board_user_idx on public.card_assignees (board_id, user_id);
create index checklist_items_card_position_idx on public.checklist_items (card_id, position);
create index checklist_items_board_id_idx on public.checklist_items (board_id);
create index attachments_card_id_idx on public.attachments (card_id);
create index attachments_board_id_idx on public.attachments (board_id);
create index comments_card_created_idx on public.comments (card_id, created_at);
create index comments_board_id_idx on public.comments (board_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket, objects stored as <board_id>/<card_id>/<file>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10 * 1024 * 1024)
on conflict (id) do nothing;

create policy attachments_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.is_board_member(public.try_uuid((storage.foldername(name))[1])));

create policy attachments_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and public.can_edit_board(public.try_uuid((storage.foldername(name))[1])));

create policy attachments_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and public.can_edit_board(public.try_uuid((storage.foldername(name))[1])));
