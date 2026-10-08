CREATE TABLE "marketplace_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"store_name" text NOT NULL,
	"encrypted_credentials" text,
	"status" text DEFAULT 'DISCONNECTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid,
	"order_number" text NOT NULL,
	"marketplace" text NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"event_source" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"description" text NOT NULL,
	"operator_name" text,
	"payload_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"line_id" bigint,
	"product_name" text NOT NULL,
	"barcode" text,
	"merchant_sku" text,
	"quantity" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"vat_base_amount" numeric(12, 2),
	"currency_code" text DEFAULT 'TRY' NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"external_id" bigint NOT NULL,
	"order_number" text NOT NULL,
	"packet_number" text,
	"package_status" text NOT NULL,
	"customer_first_name" text,
	"customer_last_name" text,
	"customer_email" text,
	"gross_amount" numeric(12, 2),
	"total_discount" numeric(12, 2),
	"total_price" numeric(12, 2),
	"cargo_provider_name" text,
	"cargo_tracking_number" text,
	"cargo_barcode" text,
	"fast_delivery" boolean DEFAULT false NOT NULL,
	"invoice_number" text,
	"shipment_address" jsonb,
	"invoice_address" jsonb,
	"order_date" timestamp with time zone NOT NULL,
	"agreed_delivery_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_channel_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"price" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"commission_rate" numeric(5, 2),
	"last_sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"barcode" text NOT NULL,
	"sku" text NOT NULL,
	"category" text,
	"brand" text,
	"image_url" text,
	"total_stock" integer DEFAULT 0 NOT NULL,
	"reserved_stock" integer DEFAULT 0 NOT NULL,
	"buying_price" numeric(12, 2),
	"base_price" numeric(12, 2),
	"vat_rate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"event_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text NOT NULL,
	"processing_time_ms" integer DEFAULT 0 NOT NULL,
	"order_number" text,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_accounts" ADD CONSTRAINT "marketplace_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_channel_listings" ADD CONSTRAINT "product_channel_listings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_channel_listings" ADD CONSTRAINT "product_channel_listings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketplace_accounts_tenant_idx" ON "marketplace_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_events_tenant_idem_uq" ON "order_events" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_tenant_marketplace_external_uq" ON "orders" USING btree ("tenant_id","marketplace","external_id");--> statement-breakpoint
CREATE INDEX "orders_tenant_status_idx" ON "orders" USING btree ("tenant_id","package_status");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_product_marketplace_uq" ON "product_channel_listings" USING btree ("product_id","marketplace");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_barcode_uq" ON "products" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "webhook_logs_tenant_idx" ON "webhook_logs" USING btree ("tenant_id","received_at");