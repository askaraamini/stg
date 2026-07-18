-- Add parent_whatsapp column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_whatsapp VARCHAR(20);

-- Index for quick lookups by parent_whatsapp
CREATE INDEX IF NOT EXISTS idx_profiles_parent_whatsapp ON profiles (parent_whatsapp);
