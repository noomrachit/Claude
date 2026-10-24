-- Minimal stand-in for the Supabase-managed schemas so migrations can run on plain Postgres.
-- Used only by supabase/tests/run.sh; never applied to a real project.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema public, auth, storage, extensions to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;

create table auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  confirmation_token text,
  recovery_token text,
  email_change text,
  email_change_token_new text,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  provider_id text,
  provider text,
  identity_data jsonb,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select string_to_array(name, '/') $$;

create publication supabase_realtime;

-- Realtime: messages table, topic() and broadcast_changes() as the Supabase service provides them.
create schema if not exists realtime;
grant usage on schema realtime to authenticated;
create table realtime.messages (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  extension text not null default 'broadcast',
  event text,
  payload jsonb
);
alter table realtime.messages enable row level security;
grant select on realtime.messages to authenticated;
create function realtime.topic() returns text language sql stable as
  $$ select nullif(current_setting('realtime.topic', true), '') $$;
grant execute on function realtime.topic() to authenticated;
create function realtime.broadcast_changes(
  topic_name text, event_name text, operation text, table_name text, table_schema text,
  new record, old record, level text default 'ROW'
) returns void language plpgsql as $$
begin
  insert into realtime.messages (topic, event, payload)
  values (topic_name, event_name, jsonb_build_object(
    'id', gen_random_uuid(), 'schema', table_schema, 'table', table_name,
    'operation', operation, 'record', to_jsonb(new), 'old_record', to_jsonb(old)));
end $$;
