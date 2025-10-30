-- Add missing asset_id column to sticker_history table
ALTER TABLE sticker_history ADD COLUMN IF NOT EXISTS asset_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sticker_history.asset_id IS 'References the asset ID for the sticker image';

