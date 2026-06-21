-- 1. Create merch_items Table
CREATE TABLE IF NOT EXISTS merch_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tag VARCHAR(100),
    min_level INTEGER NOT NULL DEFAULT 1,
    min_points INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    is_released BOOLEAN NOT NULL DEFAULT true,
    sponsor_name VARCHAR(255) DEFAULT 'Zycoz',
    sponsor_url VARCHAR(255) DEFAULT 'https://www.zycoz.com/',
    buy_url VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create user_merch_claims Table
CREATE TABLE IF NOT EXISTS user_merch_claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- references registrations.user_id
    merch_id INTEGER REFERENCES merch_items(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_merch UNIQUE(user_id, merch_id)
);

-- Enable RLS (Row Level Security) if needed or keep default public access for API gateway
-- ALTER TABLE merch_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_merch_claims ENABLE ROW LEVEL SECURITY;
