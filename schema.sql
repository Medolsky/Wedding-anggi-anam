-- ============================================================
-- SQL SCHEMA FOR WEDDING INVITATION CLOUD DATABASE
-- Support: PostgreSQL / Supabase / Neon / CockroachDB
-- ============================================================

-- 1. Table Guests (Daftar Tamu Undangan & Barcode Check-In)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup on barcode scan
CREATE INDEX IF NOT EXISTS idx_guests_code ON guests(code);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(name);

-- 2. Table RSVPs (Konfirmasi Kehadiran)
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Hadir',
  pax INTEGER DEFAULT 1,
  notes TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  check_in_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup on RSVP name
CREATE INDEX IF NOT EXISTS idx_rsvps_name ON rsvps(name);

-- 3. Table Wishes (Ucapan & Doa)
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  relationship TEXT DEFAULT 'Kerabat',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table Config (Pengaturan WA Bot & Server Tunnel)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample Initial Data Config
INSERT INTO config (key, value)
VALUES (
  'bot_config',
  '{"waToken": "4Sf3SH6toe8ztYykjmMV", "provider": "fonnte", "customServerUrl": "https://wedding-anam-bot.loca.lt"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
