import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const tenantId = () =>
  uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    tenantId: tenantId(),
    email: text("email").notNull(),
    // scrypt hash (see server/services/auth.ts); null for seeded users that cannot log in.
    passwordHash: text("password_hash"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

// Server-side login sessions. Only a SHA-256 digest of the cookie token is stored.
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tenantId: tenantId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("sessions_token_hash_uq").on(t.tokenHash)],
);

export const marketplaceAccounts = pgTable(
  "marketplace_accounts",
  {
    id: id(),
    tenantId: tenantId(),
    marketplace: text("marketplace").notNull(), // MarketplaceType
    storeName: text("store_name").notNull(),
    // Encrypted by #9; never store plaintext credentials here.
    encryptedCredentials: text("encrypted_credentials"),
    status: text("status").notNull().default("DISCONNECTED"),
    createdAt: createdAt(),
  },
  (t) => [index("marketplace_accounts_tenant_idx").on(t.tenantId)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    tenantId: tenantId(),
    name: text("name").notNull(),
    barcode: text("barcode").notNull(),
    sku: text("sku").notNull(),
    category: text("category"),
    brand: text("brand"),
    imageUrl: text("image_url"),
    totalStock: integer("total_stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
    buyingPrice: money("buying_price"),
    basePrice: money("base_price"),
    vatRate: integer("vat_rate"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("products_tenant_barcode_uq").on(t.tenantId, t.barcode)],
);

export const productChannelListings = pgTable(
  "product_channel_listings",
  {
    id: id(),
    tenantId: tenantId(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    marketplace: text("marketplace").notNull(),
    active: boolean("active").notNull().default(true),
    price: money("price"),
    stock: integer("stock").notNull().default(0),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("listings_product_marketplace_uq").on(t.productId, t.marketplace)],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    tenantId: tenantId(),
    marketplace: text("marketplace").notNull(),
    externalId: bigint("external_id", { mode: "number" }).notNull(), // shipment package id
    orderNumber: text("order_number").notNull(),
    packetNumber: text("packet_number"),
    packageStatus: text("package_status").notNull(), // PackageStatus
    customerFirstName: text("customer_first_name"),
    customerLastName: text("customer_last_name"),
    customerEmail: text("customer_email"),
    grossAmount: money("gross_amount"),
    totalDiscount: money("total_discount"),
    totalPrice: money("total_price"),
    cargoProviderName: text("cargo_provider_name"),
    cargoTrackingNumber: text("cargo_tracking_number"),
    cargoBarcode: text("cargo_barcode"),
    fastDelivery: boolean("fast_delivery").notNull().default(false),
    invoiceNumber: text("invoice_number"),
    shipmentAddress: jsonb("shipment_address"),
    invoiceAddress: jsonb("invoice_address"),
    orderDate: timestamp("order_date", { withTimezone: true }).notNull(),
    agreedDeliveryDate: timestamp("agreed_delivery_date", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("orders_tenant_marketplace_external_uq").on(t.tenantId, t.marketplace, t.externalId),
    index("orders_tenant_status_idx").on(t.tenantId, t.packageStatus),
  ],
);

export const orderLines = pgTable("order_lines", {
  id: id(),
  tenantId: tenantId(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  lineId: bigint("line_id", { mode: "number" }),
  productName: text("product_name").notNull(),
  barcode: text("barcode"),
  merchantSku: text("merchant_sku"),
  quantity: integer("quantity").notNull(),
  price: money("price").notNull(),
  vatBaseAmount: money("vat_base_amount"),
  currencyCode: text("currency_code").notNull().default("TRY"),
  imageUrl: text("image_url"),
});

// Append-only: the application only inserts into this table.
export const orderEvents = pgTable(
  "order_events",
  {
    id: id(),
    tenantId: tenantId(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    // Marketplace package id; lets events exist before the order row does.
    orderExternalId: bigint("order_external_id", { mode: "number" }),
    orderNumber: text("order_number").notNull(),
    marketplace: text("marketplace").notNull(),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    eventSource: text("event_source").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    description: text("description").notNull(),
    operatorName: text("operator_name"),
    payloadSnapshot: jsonb("payload_snapshot"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("order_events_tenant_idem_uq").on(t.tenantId, t.idempotencyKey),
    index("order_events_tenant_external_idx").on(t.tenantId, t.orderExternalId),
  ],
);

export const webhookLogs = pgTable(
  "webhook_logs",
  {
    id: id(),
    tenantId: tenantId(),
    marketplace: text("marketplace").notNull(),
    eventType: text("event_type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull(), // SUCCESS | DUPLICATE_IGNORED | FAILED
    processingTimeMs: integer("processing_time_ms").notNull().default(0),
    orderNumber: text("order_number"),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("webhook_logs_tenant_idx").on(t.tenantId, t.receivedAt)],
);
