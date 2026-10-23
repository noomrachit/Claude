-- Kanban schema: tables, constraints and triggers. RLS lives in the next migration.

create extension if not exists pg_trgm with schema extensions;

create type public.board_role as enum ('owner', 'editor', 'viewer');

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  owner_id    uuid not null references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.board_members (
  board_id   uuid not null references public.boards (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.board_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

-- Pending invitations for emails that have not signed up (or confirmed) yet.
create table public.board_invitations (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards (id) on delete cascade,
  email      text not null check (email = lower(email)),
  role       public.board_role not null default 'editor' check (role <> 'owner'),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (board_id, email)
);

-- `position` is a fractional-indexing key (see fractional-indexing npm package),
-- compared bytewise, hence COLLATE "C".
create table public.lists (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 200),
  position   text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, board_id)
);

-- Child tables carry board_id (denormalised) so RLS checks and Realtime filters
-- need no joins. Composite foreign keys guarantee it always matches the parent.
create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null,
  list_id     uuid not null,
  title       text not null check (char_length(btrim(title)) between 1 and 500),
  description text not null default '',
  due_date    timestamptz,
  position    text collate "C" not null,
  archived_at timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, board_id),
  foreign key (list_id, board_id) references public.lists (id, board_id) on delete cascade
);

create table public.labels (
  id       uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  name     text not null default '' check (char_length(name) <= 100),
  color    text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, board_id)
);

create table public.card_labels (
  card_id  uuid not null,
  label_id uuid not null,
  board_id uuid not null,
  primary key (card_id, label_id),
  foreign key (card_id, board_id)  references public.cards (id, board_id)  on delete cascade,
  foreign key (label_id, board_id) references public.labels (id, board_id) on delete cascade
);

-- Assignees must be members of the board; removing a member removes the assignment.
create table public.card_assignees (
  card_id  uuid not null,
  user_id  uuid not null,
  board_id uuid not null,
  primary key (card_id, user_id),
  foreign key (card_id, board_id)  references public.cards (id, board_id) on delete cascade,
  foreign key (board_id, user_id)  references public.board_members (board_id, user_id) on delete cascade
);

create table public.checklist_items (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null,
  board_id   uuid not null,
  content    text not null check (char_length(btrim(content)) between 1 and 500),
  done       boolean not null default false,
  position   text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (card_id, board_id) references public.cards (id, board_id) on delete cascade
);

create table public.attachments (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null,
  board_id     uuid not null,
  storage_path text not null,
  file_name    text not null,
  size_bytes   bigint not null check (size_bytes >= 0),
  mime_type    text,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  foreign key (card_id, board_id) references public.cards (id, board_id) on delete cascade,
  -- Files must live under <board_id>/<card_id>/ so Storage policies can key off the path.
  check (storage_path like board_id::text || '/' || card_id::text || '/%')
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null,
  board_id   uuid not null,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (card_id, board_id) references public.cards (id, board_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger set_updated_at before update on public.profiles        for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.boards          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.lists           for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cards           for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.checklist_items for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.comments        for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Signup: create profile; claim invitations once the email is confirmed
-- ---------------------------------------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create function public.claim_board_invitations() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null or new.email is null then
    return new;
  end if;

  insert into public.board_members (board_id, user_id, role)
  select i.board_id, new.id, i.role
  from public.board_invitations i
  where i.email = lower(new.email)
  on conflict (board_id, user_id) do nothing;

  delete from public.board_invitations where email = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_confirmed_insert
  after insert on auth.users
  for each row when (new.email_confirmed_at is not null)
  execute function public.claim_board_invitations();

create trigger on_auth_user_confirmed_update
  after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.claim_board_invitations();

-- ---------------------------------------------------------------------------
-- Boards: creator becomes owner member; owner_id is immutable; the owner's
-- membership cannot be removed or demoted (unless the board itself is deleted).
-- ---------------------------------------------------------------------------
create function public.handle_new_board() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.board_members (board_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_board_created
  after insert on public.boards
  for each row execute function public.handle_new_board();

create function public.prevent_owner_change() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'boards.owner_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger prevent_owner_change
  before update on public.boards
  for each row execute function public.prevent_owner_change();

create function public.protect_board_owner_membership() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.boards b where b.id = old.board_id and b.owner_id = old.user_id) then
    if tg_op = 'DELETE' or new.role <> 'owner' then
      raise exception 'the board owner cannot be removed or demoted' using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger protect_board_owner_membership
  before update or delete on public.board_members
  for each row execute function public.protect_board_owner_membership();
