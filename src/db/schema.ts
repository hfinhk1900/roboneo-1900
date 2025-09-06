import { boolean, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
	credits: integer('credits').notNull().default(10),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	status: text('status').notNull(),
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sticker generation history (account-scoped, for cross-device sync)
export const stickerHistory = pgTable("sticker_history", {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	style: text('style').notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ProductShot generation history (account-scoped, for cross-device sync)
export const productshotHistory = pgTable("productshot_history", {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	scene: text('scene').notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI Background generation history (account-scoped, for cross-device sync)
export const aibgHistory = pgTable("aibg_history", {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	mode: text('mode').notNull(), // 'background' or 'color'
	style: text('style').notNull(), // background style or color value
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Watermark removal history (account-scoped, for cross-device sync)
export const watermarkHistory = pgTable("watermark_history", {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	originalImageUrl: text('original_image_url').notNull(), // 原始图片URL
	processedImageUrl: text('processed_image_url').notNull(), // 处理后图片URL
	method: text('method').notNull(), // 'auto', 'inpainting', 'clone', 'blur', 'demo'
	watermarkType: text('watermark_type'), // 'text', 'logo', 'signature', etc.
	quality: text('quality'), // 'fast', 'balanced', 'high'
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Profile Picture generation history (account-scoped, for cross-device sync)
export const profilePictureHistory = pgTable("profile_picture_history", {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	style: text('style').notNull(), // selected profile style (e.g., 'man-portrait01', 'woman-portrait02')
	aspectRatio: text('aspect_ratio'), // output aspect ratio (e.g., '1:1', '2:3', 'original')
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Assets table for storing R2 uploaded images
export const assets = pgTable("assets", {
	id: text('id').primaryKey(),
	key: text('key').notNull().unique(), // R2 storage key
	filename: text('filename').notNull(),
	content_type: text('content_type').notNull(),
	size: integer('size').notNull(),
	user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	metadata: text('metadata'), // JSON string for additional metadata
	created_at: timestamp("created_at").notNull().defaultNow(),
});

// AI Log History table for tracking AI operations
export const ailogHistory = pgTable("ailog_history", {
	id: text('id').primaryKey(),
	user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	operation: text('operation').notNull(), // 'aibg', 'productshot', 'sticker'
	mode: text('mode'), // specific mode for the operation
	credits_used: integer('credits_used').notNull(),
	status: text('status').notNull(), // 'success', 'failed', 'processing'
	error_message: text('error_message'),
	created_at: timestamp("created_at").notNull().defaultNow(),
});

// Credits Transaction table for tracking credit changes
export const creditsTransaction = pgTable("credits_transaction", {
	id: text('id').primaryKey(),
	user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text('type').notNull(), // 'purchase', 'usage', 'refund', 'bonus'
	amount: integer('amount').notNull(), // positive for credit addition, negative for usage
	balance_before: integer('balance_before').notNull(),
	balance_after: integer('balance_after').notNull(),
	// DB column names differ: use existing columns 'reason' and 'related_task_id'
	description: text('reason'),
	reference_id: text('related_task_id'), // payment_id, operation_id, etc.
	created_at: timestamp("created_at").notNull().defaultNow(),
});

// User Credits table for current credit balance
export const userCredits = pgTable("user_credits", {
	id: text('id').primaryKey(),
	user_id: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
	credits: integer('credits').notNull().default(10),
	last_updated: timestamp("last_updated").notNull().defaultNow(),
});
