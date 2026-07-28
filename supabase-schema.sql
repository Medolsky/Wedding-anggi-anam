-- ============================================
-- Supabase Database Schema for Wedding App
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- 1. Tabel Tamu Undangan (Guests)
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  category TEXT DEFAULT 'Tamu VIP',
  template TEXT DEFAULT 'Formal',
  status TEXT DEFAULT 'pending',
  checked_in BOOLEAN DEFAULT FALSE,
  check_in_time TEXT,
  pax INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel RSVP (Konfirmasi Kehadiran)
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Hadir',
  pax INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  checked_in BOOLEAN DEFAULT FALSE,
  check_in_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Ucapan & Doa (Wishes)
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT DEFAULT '',
  relationship TEXT DEFAULT 'Kerabat',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Config (Token Fonnte, dll)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) - tapi allow semua akses via service role
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (karena akses via server-side service role key)
CREATE POLICY "Allow all for service role" ON guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON rsvps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON wishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON config FOR ALL USING (true) WITH CHECK (true);

-- 6. Insert default config
INSERT INTO config (key, value) VALUES (
  'bot_config',
  '{"provider": "fonnte", "waToken": "", "customServerUrl": ""}'::jsonb
) ON CONFLICT (key) DO NOTHING;
