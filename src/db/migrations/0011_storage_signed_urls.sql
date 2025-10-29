ALTER TABLE "sticker_history" ADD COLUMN IF NOT EXISTS "asset_id" text;
ALTER TABLE "productshot_history" ADD COLUMN IF NOT EXISTS "asset_id" text;
ALTER TABLE "aibg_history" ADD COLUMN IF NOT EXISTS "asset_id" text;
ALTER TABLE "watermark_history" ADD COLUMN IF NOT EXISTS "asset_id" text;
ALTER TABLE "profile_picture_history" ADD COLUMN IF NOT EXISTS "asset_id" text;
