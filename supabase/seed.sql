-- Development seed (applied by `supabase db reset`). Never run against production.
-- Two sample users, both with password "password123":
--   alice@example.com (board owner), bob@example.com (editor)

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'alice@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'bob@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}', '{"full_name":"Bob"}');

insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at)
select id, id::text, 'email', jsonb_build_object('sub', id::text, 'email', email), now()
from auth.users where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Board (trigger adds Alice as owner member)
insert into public.boards (id, title, owner_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'โปรเจกต์เว็บไซต์ (ตัวอย่าง)', '11111111-1111-1111-1111-111111111111');

insert into public.board_members (board_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'editor');

insert into public.lists (id, board_id, title, position) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'ต้องทำ',    'a0'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'กำลังทำ',   'a1'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'เสร็จแล้ว', 'a2');

insert into public.labels (id, board_id, name, color) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'ด่วน',   '#ef4444'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'ดีไซน์', '#8b5cf6'),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'โค้ด',   '#3b82f6');

insert into public.cards (id, board_id, list_id, title, description, due_date, position, created_by) values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   'ออกแบบหน้าแรก', 'ร่าง wireframe และเลือกสีหลัก', now() + interval '3 days', 'a0', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   'ตั้งค่าโดเมน', '', null, 'a1', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002',
   'เขียนหน้า Login', 'ใช้ Supabase Auth', now() + interval '1 day', 'a0', '22222222-2222-2222-2222-222222222222'),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003',
   'สร้างโปรเจกต์ใน Git', '', null, 'a0', '11111111-1111-1111-1111-111111111111');

insert into public.card_labels (card_id, label_id, board_id) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.card_assignees (card_id, user_id, board_id) values
  ('dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.checklist_items (card_id, board_id, content, done, position) values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'ร่าง wireframe', true,  'a0'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'เลือกฟอนต์',     false, 'a1'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'ส่งให้ทีมรีวิว', false, 'a2');

insert into public.comments (card_id, board_id, user_id, body) values
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'เริ่มทำแล้ว ใช้อีเมลก่อน แล้วค่อยเพิ่ม Google');
