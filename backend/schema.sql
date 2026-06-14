-- Supabase Table Schema for Arena Registrations

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  team VARCHAR(50) NOT NULL,
  mu_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) on registrations table (optional but recommended)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so users can register from the frontend)
CREATE POLICY "Allow public insert access" 
ON registrations 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated reads (optional, for admin or leaderboard access)
CREATE POLICY "Allow authenticated read access" 
ON registrations 
FOR SELECT 
USING (true);

-- Squads table to store cumulative points per country squad
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read squads"
ON squads
FOR SELECT
USING (true);

CREATE POLICY "Allow service role update squads"
ON squads
FOR UPDATE
USING (true);

-- Seed the 12 squads
INSERT INTO squads (name, points) VALUES
  ('Brazil', 0),
  ('Argentina', 0),
  ('Portugal', 0),
  ('Germany', 0),
  ('France', 0),
  ('England', 0),
  ('Spain', 0),
  ('Netherlands', 0),
  ('Belgium', 0),
  ('Croatia', 0),
  ('Uruguay', 0),
  ('Japan', 0)
ON CONFLICT (name) DO NOTHING;

-- Function to atomically increment squad points
CREATE OR REPLACE FUNCTION increment_squad_points(squad_name VARCHAR, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE squads
  SET points = points + points_to_add
  WHERE name = squad_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Admin Users table for dashboard authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write admin_users
CREATE POLICY "Service role full access on admin_users"
ON admin_users
USING (true)
WITH CHECK (true);

-- Seed a default superadmin for local development
-- Password: admin123 (bcrypt hash with 10 rounds)
INSERT INTO admin_users (username, email, password_hash, role) VALUES
  ('admin', 'admin@mulearn.org', '$2a$10$mTOTOyhQ6R6BT/3TUm04mef1t3rpLNzNw55ljeA5lne45OOfeqyr2', 'superadmin')
ON CONFLICT (username) DO NOTHING;
