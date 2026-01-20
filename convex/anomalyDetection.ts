import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, MutationCtx, QueryCtx } from "./_generated/server";

// Price change thresholds
const PRICE_CHANGE_THRESHOLDS = {
  low: 0.1,      // >10%
  medium: 0.2,   // >20%
  high: 0.3,     // >30%
};

// Helper to determine severity based on percentage change
function getPriceChangeSeverity(percentChange: number): "low" | "medium" | "high" {
  const absChange = Math.abs(percentChange);
  if (absChange >= PRICE_CHANGE_THRESHOLDS.high) return "high";
  if (absChange >= PRICE_CHANGE_THRESHOLDS.medium) return "medium";
  return "low";
}

// Helper to check if anomaly already exists (to avoid duplicates)
async function anomalyExists(
  ctx: QueryCtx,
  type: string,
  documentId?: Id<"documents">,
  productId?: Id<"products">
): Promise<boolean> {
  if (documentId) {
    const existing = await ctx.db
      .query("anomalies")
      .withIndex("by_type_document", (q) =>
        q.eq("type", type as any).eq("documentId", documentId)
      )
      .first();
    return existing !== null && !existing.resolved;
  }

  if (productId) {
    const existing = await ctx.db
      .query("anomalies")
      .withIndex("by_type_product", (q) =>
        q.eq("type", type as any).eq("productId", productId)
      )
      .first();
    return existing !== null && !existing.resolved;
  }

  return false;
}

// Record price history for a document item
export const recordPriceHistory = internalMutation({
  args: {
    productName: v.string(),
    supplierId: v.id("suppliers"),
    unitPrice: v.number(),
    unit: v.string(),
    documentId: v.id("documents"),
    documentDate: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("priceHistory", {
      ...args,
      recordedAt: Date.now(),
    });
  },
});

// Detect price changes for document items
export const detectPriceChanges = internalMutation({
  args: {
    documentId: v.id("documents"),
    supplierId: v.id("suppliers"),
    items: v.array(
      v.object({
        name: v.string(),
        unitPrice: v.number(),
        unit: v.string(),
      })
    ),
    documentDate: v.number(),
  },
  handler: async (ctx, args) => {
    const { documentId, supplierId, items, documentDate } = args;
    const anomaliesCreated: Id<"anomalies">[] = [];

    for (const item of items) {
      // Skip items without prices
      if (item.unitPrice <= 0) continue;

      // Get last recorded price for this product from this supplier
      const lastPriceRecord = await ctx.db
        .query("priceHistory")
        .withIndex("by_product_supplier", (q) =>
          q.eq("productName", item.name).eq("supplierId", supplierId)
        )
        .order("desc")
        .first();

      if (lastPriceRecord && lastPriceRecord.unitPrice > 0) {
        const oldPrice = lastPriceRecord.unitPrice;
        const newPrice = item.unitPrice;
        const percentChange = (newPrice - oldPrice) / oldPrice;

        // Only create anomaly if change exceeds minimum threshold
        if (Math.abs(percentChange) >= PRICE_CHANGE_THRESHOLDS.low) {
          const isIncrease = percentChange > 0;
          const type = isIncrease ? "price_increase" : "price_decrease";
          const severity = getPriceChangeSeverity(percentChange);

          // Check if anomaly already exists for this document
          const exists = await anomalyExists(ctx, type, documentId);
          if (!exists) {
            const percentStr = Math.abs(Math.round(percentChange * 100));
            const anomalyId = await ctx.db.insert("anomalies", {
              type: type as "price_increase" | "price_decrease",
              severity,
              title: `Preis${isIncrease ? "erhöhung" : "senkung"}: ${item.name}`,
              description: `Der Preis für "${item.name}" hat sich um ${percentStr}% ${isIncrease ? "erhöht" : "verringert"} (${oldPrice.toFixed(2)}€ → ${newPrice.toFixed(2)}€/${item.unit}).`,
              documentId,
              supplierId,
              detectedAt: Date.now(),
              resolved: false,
            });
            anomaliesCreated.push(anomalyId);
          }
        }
      }

      // Record current price for future comparisons
      await ctx.db.insert("priceHistory", {
        productName: item.name,
        supplierId,
        unitPrice: item.unitPrice,
        unit: item.unit,
        documentId,
        documentDate,
        recordedAt: Date.now(),
      });
    }

    return anomaliesCreated;
  },
});

// Detect low stock for a specific product
export const detectLowStock = internalMutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // Check if stock is below minimum
    if (product.currentStock < product.minStock) {
      // Check if unresolved low_stock anomaly already exists
      const exists = await anomalyExists(ctx, "low_stock", undefined, args.productId);
      if (exists) return null;

      // Determine severity
      const severity: "low" | "medium" | "high" =
        product.currentStock === 0 ? "high" : "medium";

      const anomalyId = await ctx.db.insert("anomalies", {
        type: "low_stock",
        severity,
        title: `Niedriger Bestand: ${product.name}`,
        description: `Aktueller Bestand (${product.currentStock} ${product.unit}) liegt unter dem Mindestbestand (${product.minStock} ${product.unit}).`,
        productId: args.productId,
        supplierId: product.supplierId,
        detectedAt: Date.now(),
        resolved: false,
      });

      return anomalyId;
    }

    return null;
  },
});

// Detect all products with low stock (for cron job)
export const detectAllLowStock = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const anomaliesCreated: Id<"anomalies">[] = [];

    for (const product of products) {
      if (product.currentStock < product.minStock) {
        // Check if unresolved anomaly already exists
        const exists = await anomalyExists(ctx, "low_stock", undefined, product._id);
        if (exists) continue;

        const severity: "low" | "medium" | "high" =
          product.currentStock === 0 ? "high" : "medium";

        const anomalyId = await ctx.db.insert("anomalies", {
          type: "low_stock",
          severity,
          title: `Niedriger Bestand: ${product.name}`,
          description: `Aktueller Bestand (${product.currentStock} ${product.unit}) liegt unter dem Mindestbestand (${product.minStock} ${product.unit}).`,
          productId: product._id,
          supplierId: product.supplierId,
          detectedAt: Date.now(),
          resolved: false,
        });

        anomaliesCreated.push(anomalyId);
      }
    }

    return anomaliesCreated;
  },
});

// Auto-resolve low stock anomalies when stock is replenished
export const autoResolveLowStockAnomalies = internalMutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    // Only resolve if stock is now above minimum
    if (product.currentStock >= product.minStock) {
      const openAnomalies = await ctx.db
        .query("anomalies")
        .withIndex("by_type_product", (q) =>
          q.eq("type", "low_stock").eq("productId", args.productId)
        )
        .filter((q) => q.eq(q.field("resolved"), false))
        .collect();

      const resolvedIds: Id<"anomalies">[] = [];
      for (const anomaly of openAnomalies) {
        await ctx.db.patch(anomaly._id, {
          resolved: true,
          resolvedAt: Date.now(),
        });
        resolvedIds.push(anomaly._id);
      }

      return resolvedIds;
    }

    return [];
  },
});

// Detect duplicate invoice
export const detectDuplicateInvoice = internalMutation({
  args: {
    documentId: v.id("documents"),
    invoiceNumber: v.string(),
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
  },
  handler: async (ctx, args) => {
    const { documentId, invoiceNumber, supplierId, supplierName } = args;

    // Find other documents with same invoice number from same supplier
    const duplicates = await ctx.db
      .query("documents")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "invoice"),
          q.eq(q.field("invoiceNumber"), invoiceNumber),
          q.neq(q.field("_id"), documentId)
        )
      )
      .collect();

    if (duplicates.length > 0) {
      // Check if anomaly already exists
      const exists = await anomalyExists(ctx, "duplicate_invoice", documentId);
      if (exists) return null;

      const anomalyId = await ctx.db.insert("anomalies", {
        type: "duplicate_invoice",
        severity: "high",
        title: `Doppelte Rechnungsnummer: ${invoiceNumber}`,
        description: `Die Rechnungsnummer "${invoiceNumber}" von ${supplierName} existiert bereits im System.`,
        documentId,
        supplierId,
        detectedAt: Date.now(),
        resolved: false,
      });

      return anomalyId;
    }

    return null;
  },
});

// Detect new supplier
export const detectNewSupplier = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    documentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const { supplierId, supplierName, documentId } = args;

    // Check if supplier was just created (no prior documents)
    const existingDocuments = await ctx.db
      .query("documents")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
      .collect();

    // If this is the first document from this supplier
    if (existingDocuments.length <= 1) {
      // Check if anomaly already exists for this supplier
      const existingAnomaly = await ctx.db
        .query("anomalies")
        .withIndex("by_type", (q) => q.eq("type", "new_supplier"))
        .filter((q) => q.eq(q.field("supplierId"), supplierId))
        .first();

      if (existingAnomaly) return null;

      const anomalyId = await ctx.db.insert("anomalies", {
        type: "new_supplier",
        severity: "low",
        title: `Neuer Lieferant: ${supplierName}`,
        description: `Der Lieferant "${supplierName}" wurde neu im System angelegt.`,
        documentId,
        supplierId,
        detectedAt: Date.now(),
        resolved: false,
      });

      return anomalyId;
    }

    return null;
  },
});

// Detect missing delivery notes (invoices older than 14 days without matching delivery note)
export const detectMissingDeliveryNotes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    // Get all approved invoices older than 14 days
    const invoices = await ctx.db
      .query("documents")
      .withIndex("by_type", (q) => q.eq("type", "invoice"))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "approved"),
          q.lt(q.field("documentDate"), fourteenDaysAgo)
        )
      )
      .collect();

    const anomaliesCreated: Id<"anomalies">[] = [];

    for (const invoice of invoices) {
      // Check if there's a delivery note from the same supplier within a reasonable time frame
      const deliveryNotes = await ctx.db
        .query("documents")
        .withIndex("by_supplier", (q) => q.eq("supplierId", invoice.supplierId))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "delivery_note"),
            // Delivery note should be within 30 days of invoice
            q.gte(q.field("documentDate"), invoice.documentDate - 30 * 24 * 60 * 60 * 1000),
            q.lte(q.field("documentDate"), invoice.documentDate + 7 * 24 * 60 * 60 * 1000)
          )
        )
        .collect();

      if (deliveryNotes.length === 0) {
        // Check if anomaly already exists
        const exists = await anomalyExists(ctx, "missing_delivery_note", invoice._id);
        if (exists) continue;

        const supplier = invoice.supplierId ? await ctx.db.get(invoice.supplierId) : null;
        const supplierName = supplier?.name || invoice.supplierName;
        const invoiceDate = new Date(invoice.documentDate).toLocaleDateString("de-DE");

        const anomalyId = await ctx.db.insert("anomalies", {
          type: "missing_delivery_note",
          severity: "medium",
          title: `Fehlender Lieferschein: ${invoice.invoiceNumber || "Ohne Nr."}`,
          description: `Zur Rechnung vom ${invoiceDate} von ${supplierName} wurde kein passender Lieferschein gefunden.`,
          documentId: invoice._id,
          supplierId: invoice.supplierId,
          detectedAt: Date.now(),
          resolved: false,
        });

        anomaliesCreated.push(anomalyId);
      }
    }

    return anomaliesCreated;
  },
});
