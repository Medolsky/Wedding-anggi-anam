-- Fix: Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Allow all for service role" ON guests;
DROP POLICY IF EXISTS "Allow all for service role" ON rsvps;
DROP POLICY IF EXISTS "Allow all for service role" ON wishes;
DROP POLICY IF EXISTS "Allow all for service role" ON config;

CREATE POLICY "Allow all for service role" ON guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON rsvps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON wishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON config FOR ALL USING (true) WITH CHECK (true);

-- Insert default config (skip if exists)
INSERT INTO config (key, value) VALUES (
  'bot_config',
  '{"provider": "fonnte", "waToken": "", "customServerUrl": ""}'::jsonb
) ON CONFLICT (key) DO NOTHING;
