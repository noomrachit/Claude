// All user-facing text lives here so a second language can be added later.
export const t = {
  appName: 'Kanban',
  loading: 'กำลังโหลด…',
  errorGeneric: 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง',
  retry: 'ลองใหม่',
  notFound: 'ไม่พบหน้านี้',
  backHome: 'กลับหน้าหลัก',
  setupTitle: 'ยังไม่ได้ตั้งค่า Supabase',
  setupHint: 'คัดลอก .env.example เป็น .env แล้วใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY',
  theme: { light: 'โหมดสว่าง', dark: 'โหมดมืด' },
} as const
