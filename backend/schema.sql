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
