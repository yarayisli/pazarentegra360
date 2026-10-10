import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { INITIAL_PACKAGES, INITIAL_PRODUCTS } from "../../src/data/mockData.ts";
import type { ChannelStockInfo } from "../../src/types.ts";
import * as schema from "./schema.ts";

// Base type shared by the node-postgres and pglite drivers.
export type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export const DEMO_TENANT_NAME = "Demo Mağaza";
export const DEMO_USER_EMAIL = "demo@pazarentegra.local";

const MARKETPLACES = ["trendyol", "hepsiburada", "n11", "ikas"];
const at = (ms: number) => new Date(ms);

// Loads the demo data from src/data/mockData.ts into a demo tenant. Credentials are
// intentionally NOT seeded: mock keys must never reach the database.
export async function seedDemo(db: AnyDb): Promise<{ tenantId: string }> {
  return db.transaction(async (tx) => {
    const [tenant] = await tx.insert(schema.tenants).values({ name: DEMO_TENANT_NAME }).returning();
    const tenantId = tenant.id;

    await tx.insert(schema.users).values({ tenantId, email: DEMO_USER_EMAIL });

    await tx.insert(schema.marketplaceAccounts).values(
      MARKETPLACES.map((marketplace) => ({
        tenantId,
        marketplace,
        storeName: `Demo ${marketplace}`,
        status: "DISCONNECTED",
      })),
    );

    for (const p of INITIAL_PRODUCTS) {
      const [row] = await tx
        .insert(schema.products)
        .values({
          tenantId,
          name: p.name,
          barcode: p.barcode,
          sku: p.sku,
          category: p.category,
          brand: p.brand,
          imageUrl: p.imageUrl,
          totalStock: p.totalStock,
          reservedStock: p.reservedStock,
          buyingPrice: String(p.buyingPrice),
          basePrice: String(p.basePrice),
          vatRate: p.vatRate,
        })
        .returning();
      const channels = Object.entries(p.channels) as [string, ChannelStockInfo | undefined][];
      const listings = channels.flatMap(([marketplace, c]) =>
        c
          ? [
              {
                tenantId,
                productId: row.id,
                marketplace,
                active: c.active,
                price: String(c.price),
                stock: c.stock,
                commissionRate: String(c.commissionRate),
              },
            ]
          : [],
      );
      if (listings.length) await tx.insert(schema.productChannelListings).values(listings);
    }

    for (const pkg of INITIAL_PACKAGES) {
      const [order] = await tx
        .insert(schema.orders)
        .values({
          tenantId,
          marketplace: pkg.marketplace,
          externalId: pkg.id,
          orderNumber: pkg.orderNumber,
          packetNumber: pkg.packetNumber,
          packageStatus: pkg.packageStatus,
          customerFirstName: pkg.customerFirstName,
          customerLastName: pkg.customerLastName,
          customerEmail: pkg.customerEmail,
          grossAmount: String(pkg.grossAmount),
          totalDiscount: String(pkg.totalDiscount),
          totalPrice: String(pkg.totalPrice),
          cargoProviderName: pkg.cargoProviderName,
          cargoTrackingNumber: pkg.cargoTrackingNumber,
          cargoBarcode: pkg.cargoBarcode,
          fastDelivery: pkg.fastDelivery,
          invoiceNumber: pkg.invoiceNumber,
          shipmentAddress: pkg.shipmentAddress,
          invoiceAddress: pkg.invoiceAddress,
          orderDate: at(pkg.orderDate),
          agreedDeliveryDate: at(pkg.agreedDeliveryDate),
        })
        .returning();
      if (pkg.lines.length) {
        await tx.insert(schema.orderLines).values(
          pkg.lines.map((l) => ({
            tenantId,
            orderId: order.id,
            lineId: l.lineId,
            productName: l.productName,
            barcode: l.barcode,
            merchantSku: l.merchantSku,
            quantity: l.quantity,
            price: String(l.price),
            vatBaseAmount: String(l.vatBaseAmount),
            currencyCode: l.currencyCode,
            imageUrl: l.imageUrl,
          })),
        );
      }
    }

    await tx.insert(schema.orderEvents).values([
      {
        tenantId,
        orderExternalId: 914028471,
        orderNumber: "9482019481",
        marketplace: "trendyol",
        fromStatus: "None",
        toStatus: "Created",
        eventSource: "WEBHOOK",
        idempotencyKey: "ty-pkg-created-914028471-v1",
        description: "Trendyol SAPIGW Webhook: shipment-package.created tetiklendi.",
        operatorName: "Trendyol Webhook",
        payloadSnapshot: { packageId: 914028471, status: "Created", totalGross: 1850.0 },
        createdAt: at(Date.now() - 7200000),
      },
      {
        tenantId,
        orderExternalId: 914028472,
        orderNumber: "HB-74920194",
        marketplace: "hepsiburada",
        fromStatus: "Created",
        toStatus: "Picking",
        eventSource: "USER_SCAN",
        idempotencyKey: "hb-scan-pick-914028472",
        description: "Depo personeli (Ahmet K.) raf barkodunu okuttu ve toplamaya başladı.",
        operatorName: "Ahmet K. (Depo Operatörü)",
        payloadSnapshot: { warehouseId: "DEP-01", shelfLocation: "A-04-02" },
        createdAt: at(Date.now() - 3600000),
      },
    ]);
    await tx.insert(schema.webhookLogs).values({
      tenantId,
      marketplace: "trendyol",
      eventType: "shipment-package.created",
      idempotencyKey: "ty-pkg-created-914028471-v1",
      status: "SUCCESS",
      processingTimeMs: 42,
      orderNumber: "9482019481",
      payload: { packageId: 914028471, status: "Created" },
      receivedAt: at(Date.now() - 7200000),
    });

    return { tenantId };
  });
}
