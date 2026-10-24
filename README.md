# Kanban

เว็บแอปจัดการงานแบบคัมบัง (ทางเลือกแทน Trello) สร้างด้วย React + TypeScript + Vite และ Supabase
สเปกตั้งต้นของโปรเจกต์อยู่ที่ [`docs/SPEC.md`](docs/SPEC.md)

## ฟีเจอร์

- สมัคร/เข้าสู่ระบบด้วยอีเมลและ Google รวมถึงลืมรหัสผ่าน/ตั้งรหัสผ่านใหม่ (Supabase Auth)
- บอร์ด: สร้าง เปลี่ยนชื่อ ลบ เก็บเข้าคลัง (บอร์ดในคลังเป็นแบบอ่านอย่างเดียวจนกว่าจะนำกลับมาใช้)
- ลิสต์และการ์ด: เพิ่ม แก้ไข ลบ ลากเรียงและลากย้ายข้ามลิสต์ (optimistic update ย้อนกลับเมื่อผิดพลาด)
- รายละเอียดการ์ด: คำอธิบาย วันครบกำหนด ป้ายสี (สร้าง/แก้ไข/ลบ) เช็คลิสต์ (แก้ข้อความ/ลากเรียง) ผู้รับผิดชอบ (หลายคน) ไฟล์แนบ คอมเมนต์
- สมาชิกบอร์ด: เชิญด้วยอีเมล บทบาทเจ้าของ / แก้ไขได้ / ดูอย่างเดียว
- อัปเดตเรียลไทม์เมื่อสมาชิกคนอื่นแก้ไขบอร์ด (รวมถึงการลบ) และรายการบอร์ดอัปเดตเองเมื่อมีคนเพิ่ม/ถอดคุณหรือเปลี่ยนชื่อบอร์ด
- ค้นหาการ์ดและกรองตามป้ายสี/ผู้รับผิดชอบ (เก็บตัวกรองไว้ใน URL)
- รองรับมือถือและโหมดมืด

## เทคโนโลยี

| ส่วน | เครื่องมือ |
|---|---|
| หน้าบ้าน | React 19, TypeScript, Vite, Tailwind CSS 4, React Router |
| ข้อมูลฝั่งเซิร์ฟเวอร์ | TanStack Query |
| ลากและวาง | dnd-kit |
| ส่วนหลัง | Supabase: Postgres + RLS, Auth, Realtime, Storage |
| ทดสอบ / ตรวจโค้ด | Vitest, oxlint, `tsc` |

## โครงสร้างโค้ด

```
src/
  components/      UI กลาง (Modal, Spinner, ErrorBanner, EmptyState, ThemeToggle ฯลฯ)
  features/
    auth/          AuthProvider, ฟอร์มเข้าสู่ระบบ, ProtectedRoute
    boards/        รายการบอร์ด, สมาชิก/คำเชิญ, BoardView (ลากวาง), cache ของบอร์ด
    lists/         คอลัมน์ลิสต์
    cards/         การ์ด + หน้าต่างรายละเอียด (detail/)
    filters/       ค้นหา/กรอง
    realtime/      Supabase Realtime (Broadcast แบบ private) -> อัปเดต cache
  hooks/           useTheme
  lib/             supabase client + ชนิดข้อมูลที่ generate, fractional indexing, วันที่, ข้อความ UI (strings.ts)
  pages/           Login, Boards, Board, NotFound
  types/           ชื่อย่อของชนิดข้อมูลตาราง
supabase/
  migrations/      สคีมา, RLS, ดัชนี + Storage, ความปลอดภัยเพิ่มเติม, Realtime (Broadcast)
  seed.sql         ข้อมูลตัวอย่างสำหรับพัฒนา (ห้ามใช้บนโปรดักชัน)
  tests/           ทดสอบ RLS บน Postgres ชั่วคราว
```

## เริ่มต้นใช้งาน

### สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป (ทดสอบกับ 22)
- บัญชี [Supabase](https://supabase.com) และ [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 1) ติดตั้ง

```bash
npm install
```

### 2) สร้างโปรเจกต์ Supabase และรัน migration

1. สร้างโปรเจกต์ใหม่ที่ Supabase Dashboard จดค่า **Project ref** (ส่วนหน้า `.supabase.co` ของ URL)
2. ผูกโปรเจกต์ในเครื่องแล้วรัน migration ทั้ง 6 ไฟล์ตามลำดับ:

   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   ถ้าไม่ใช้ CLI เปิด **SQL Editor** แล้วรันไฟล์ใน `supabase/migrations/` ทีละไฟล์ตามลำดับชื่อไฟล์
3. migration จะสร้างให้ครบ: ตาราง + RLS ทุกตาราง, ฟังก์ชัน `invite_to_board`, ฟังก์ชันช่วยตรวจสิทธิ์ใน schema `private`, bucket `attachments` (private) พร้อม policy, และ trigger ที่ส่งการเปลี่ยนแปลงผ่าน Realtime Broadcast พร้อม policy บน `realtime.messages`

> `supabase db push` ไม่รัน `seed.sql` ข้อมูลตัวอย่างมีไว้ใช้กับฐานข้อมูลในเครื่องเท่านั้น (ดู "พัฒนาด้วย Supabase ในเครื่อง")

### 3) ตั้งค่า Authentication

ที่ Dashboard ไปที่ **Authentication**:

1. **URL Configuration**
   - Site URL: URL ของแอป (เช่น `http://localhost:5173` ตอนพัฒนา)
   - Redirect URLs: เพิ่มทุก URL ที่แอปรันอยู่ รวมหน้ารีเซ็ตรหัสผ่าน เช่น `http://localhost:5173/**` และ `https://<โดเมนจริง>/**` (ลิงก์ในอีเมลลืมรหัสผ่านพาไป `/reset-password`)
2. **Providers → Email**: เลือกเปิดหรือปิด *Confirm email* ได้ ทั้งสองแบบใช้งานได้
   - ถ้าเปิด ผู้ใช้ต้องกดลิงก์ในอีเมลก่อนเข้าสู่ระบบ และ **คำเชิญเข้าบอร์ดจะมีผลหลังยืนยันอีเมลเท่านั้น**
   - อีเมลที่ Supabase ส่งให้โดยค่าเริ่มต้นมีโควตาต่ำ สำหรับใช้งานจริงควรตั้ง SMTP ของตัวเอง
3. **Providers → Google** (ไม่บังคับ):
   1. ที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials) สร้าง *OAuth client ID* ชนิด *Web application*
   2. ใส่ *Authorized redirect URI* เป็น `https://<project-ref>.supabase.co/auth/v1/callback`
   3. คัดลอก Client ID และ Client Secret ไปใส่ที่ Supabase แล้วเปิดใช้งาน Google

### 4) ตั้งค่า `.env`

```bash
cp .env.example .env
```

ใส่ค่าจาก **Project Settings → API**:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

ใช้เฉพาะ anon (publishable) key เท่านั้น ห้ามใส่ `service_role` key ในโปรเจกต์นี้ คีย์ฝั่งหน้าบ้านเปิดเผยได้โดยการป้องกันข้อมูลอยู่ที่ RLS ไฟล์ `.env` ถูกใส่ใน `.gitignore` แล้ว

### 5) รัน

```bash
npm run dev
```

เปิด `http://localhost:5173`

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | เปิดเซิร์ฟเวอร์พัฒนา |
| `npm run build` | ตรวจชนิดข้อมูลแล้ว build ไปที่ `dist/` |
| `npm run preview` | ดูผล build |
| `npm run typecheck` | ตรวจชนิดข้อมูล |
| `npm run lint` | ตรวจโค้ดด้วย oxlint |
| `npm test` | เทสต์หน้าบ้าน (Vitest) |
| `npm run test:db` | ทดสอบ migration + RLS + Realtime Broadcast บน Postgres ชั่วคราว |
| `SUPABASE_PROJECT_ID=<ref> npm run gen:types` | สร้างไฟล์ชนิดข้อมูลจากสคีมาใหม่ (ต้องมี Supabase CLI) |

หลังแก้สคีมาให้เพิ่มไฟล์ migration ใหม่ใน `supabase/migrations/` (อย่าแก้ไฟล์เดิมที่ push ไปแล้ว) รัน `supabase db push` แล้วรัน `gen:types`

### ทดสอบ RLS (`npm run test:db`)

สคริปต์สร้างฐานข้อมูล `kanban_test` ชั่วคราวบน Postgres ในเครื่อง จำลอง schema `auth`/`storage`/`realtime` ของ Supabase แล้วรัน migration, seed และ `supabase/tests/rls.sql` (เจ้าของ/editor/viewer/คนนอก, คำเชิญ, Storage ฯลฯ)
ต้องมี `psql` และผู้ใช้ Postgres ที่เป็น superuser ตั้งค่าผ่านตัวแปร `PGHOST`, `PGUSER`, `PGPASSWORD` ได้ เช่น

```bash
PGHOST=localhost PGUSER=postgres PGPASSWORD=... npm run test:db
```

### พัฒนาด้วย Supabase ในเครื่อง (ทางเลือก)

ต้องมี Docker

```bash
supabase init        # ครั้งแรก สร้าง supabase/config.toml (ไม่แตะ migrations)
supabase start
supabase db reset    # รัน migrations + seed.sql
```

ใช้ URL และ anon key ที่ `supabase start` แสดงใส่ใน `.env` ผู้ใช้ตัวอย่าง: `alice@example.com` (เจ้าของบอร์ด) และ `bob@example.com` (editor) รหัสผ่านทั้งคู่ `password123`

## สิทธิ์และความปลอดภัย

- ทุกตารางเปิด RLS สมาชิกบอร์ดเท่านั้นที่อ่านข้อมูลของบอร์ดนั้นได้ ผู้ใช้ที่ไม่ได้ล็อกอินเข้าถึงตารางไม่ได้เลย
- ฟังก์ชันช่วยตรวจสิทธิ์ (`SECURITY DEFINER`) อยู่ใน schema `private` ซึ่งไม่เปิดผ่าน Data API เหลือเพียง `invite_to_board` ที่เรียกผ่าน RPC และตรวจว่าผู้เรียกเป็นเจ้าของบอร์ด
- บอร์ดที่เก็บเข้าคลังแก้เนื้อหาไม่ได้ในระดับฐานข้อมูล (เจ้าของยังนำกลับมาใช้ได้)
- **เจ้าของ**: จัดการบอร์ดและสมาชิกได้ **editor**: อ่าน/เขียนเนื้อหา **viewer**: อ่านอย่างเดียว
- ไฟล์แนบอยู่ใน bucket private ที่ path `<board_id>/<card_id>/…` เปิดผ่านลิงก์ชั่วคราว 60 วินาที ขนาดไม่เกิน 10 MB
- เรียลไทม์ใช้ Broadcast แบบ private: trigger ในฐานข้อมูลส่งทุกการเปลี่ยนแปลง (รวมการลบ) ไปที่ช่อง `board:<id>` และ `user:<id>` และมี policy บน `realtime.messages` ให้เฉพาะสมาชิกฟังได้ ไม่ใช้ Postgres Changes เพราะกรองเหตุการณ์ลบไม่ได้
- สิทธิ์ของช่องตรวจตอนเข้าร่วมช่อง ผู้ที่ถูกถอดจากบอร์ดระหว่างเปิดหน้าอยู่อาจได้รับเหตุการณ์ต่อจนกว่าจะเชื่อมต่อใหม่ แอปจึงตรวจสิทธิ์ซ้ำและพาออกจากบอร์ดเมื่อเห็นว่าสมาชิกภาพของตัวเองถูกลบ
- ผู้ใช้ที่เป็นเจ้าของบอร์ดลบบัญชีไม่ได้จนกว่าจะลบบอร์ดของตัวเองก่อน (`boards.owner_id` เป็น `ON DELETE RESTRICT`)

## Deploy

`npm run build` ได้ไฟล์ static ใน `dist/` นำไปวางบนโฮสต์ static ใดก็ได้ (Netlify, Vercel, Cloudflare Pages ฯลฯ) โดย:

- ตั้งตัวแปร `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ตอน build
- ตั้ง rewrite ให้ทุกเส้นทางส่งไป `index.html` (แอปใช้ client-side routing)
- เพิ่มโดเมนจริงใน Supabase **Redirect URLs** และ Site URL

## ข้อจำกัดที่ทราบ

- คำเชิญสำหรับอีเมลที่ยังไม่สมัครจะถูกบันทึกไว้และให้สิทธิ์เมื่อยืนยันอีเมล แต่ **ระบบไม่ส่งอีเมลแจ้งเชิญ** เจ้าของต้องแจ้งผู้ถูกเชิญเอง
- ขณะกรองอยู่จะปิดการลากชั่วคราว
- บอร์ดจะโหลดการ์ดทั้งหมดในครั้งเดียว (ยังไม่มี pagination)

## CI

`.github/workflows/ci.yml` รัน typecheck, lint, เทสต์, build และ `test:db` (บน Postgres 16 ใน GitHub Actions) ทุก pull request

## แก้ปัญหาเบื้องต้น

| อาการ | สาเหตุที่พบบ่อย |
|---|---|
| หน้าเว็บขึ้น "ยังไม่ได้ตั้งค่า Supabase" | ยังไม่มี `.env` หรือค่าว่าง ตั้งค่าแล้วรีสตาร์ท `npm run dev` |
| ล็อกอินด้วย Google แล้ววนกลับหน้า login | URL ของแอปยังไม่อยู่ใน Redirect URLs หรือ redirect URI ฝั่ง Google ไม่ตรง |
| สมัครแล้วเข้าสู่ระบบไม่ได้ | เปิด *Confirm email* ไว้ ต้องกดลิงก์ในอีเมลก่อน |
| ไม่เห็นการแก้ไขของคนอื่นทันที / ขึ้นแถบ "ขาดการเชื่อมต่อแบบเรียลไทม์" | ยังไม่ได้รัน migration ไฟล์ที่ 6 (`…_realtime_broadcast.sql`) หรือเครือข่ายบล็อก WebSocket |
| อัปโหลดไฟล์แนบไม่ได้ | ยังไม่ได้รัน migration ไฟล์ที่ 3 (สร้าง bucket `attachments`) หรือไฟล์ใหญ่เกิน 10 MB |
| ลิงก์ในอีเมลลืมรหัสผ่านใช้ไม่ได้ | `/reset-password` ยังไม่อยู่ใน Redirect URLs ของ Supabase หรือลิงก์หมดอายุ |
| เห็นบอร์ดว่าง ทั้งที่มีข้อมูล | บัญชีนั้นไม่ได้เป็นสมาชิกบอร์ด (RLS ซ่อนข้อมูลไว้ตามที่ออกแบบ) |
