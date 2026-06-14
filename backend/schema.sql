-- Supabase Table Schema for Arena Registrations

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  team VARCHAR(50) NOT NULL,
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
