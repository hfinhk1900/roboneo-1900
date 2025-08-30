CREATE TABLE "watermark_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"original_image_url" text NOT NULL,
	"processed_image_url" text NOT NULL,
	"method" text NOT NULL,
	"watermark_type" text,
	"quality" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watermark_history" ADD CONSTRAINT "watermark_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;