CREATE TABLE IF NOT EXISTS "scream_ai_history" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "url" text NOT NULL,
  "preset_id" text NOT NULL,
  "aspect_ratio" text,
  "asset_id" text,
  "watermarked" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "scream_ai_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "scream_ai_history_user_idx" ON "scream_ai_history" ("user_id");
