import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL for download/preview
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

const documentStatus = v.union(
  v.literal("pending"),
  v.literal("analyzed"),
  v.literal("approved"),
  v.literal("rejected")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").order("desc").collect();
  },
});

export const listByStatus = query({
  args: { status: documentStatus },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithItems = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) return null;

    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    return { ...document, items };
  },
});

export const listWithItems = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").order("desc").collect();

    const documentsWithItems = await Promise.all(
      documents.map(async (doc) => {
        const items = await ctx.db
          .query("documentItems")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .collect();
        return { ...doc, items };
      })
    );

    return documentsWithItems;
  },
});

// Helper function to guess product category from name
function guessCategory(name: string): "fleisch" | "fisch" | "gemuese" | "obst" | "milchprodukte" | "getraenke" | "gewuerze" | "backwaren" | "sonstiges" {
  const nameLower = name.toLowerCase();

  // Fleisch
  if (/rind|schwein|hähnchen|huhn|pute|lamm|kalb|wurst|schinken|speck|filet|steak|hack/.test(nameLower)) {
    return "fleisch";
  }
  // Fisch
  if (/lachs|fisch|dorade|forelle|thunfisch|garnele|shrimp|muschel|tintenfisch|kabeljau/.test(nameLower)) {
    return "fisch";
  }
  // Gemüse
  if (/kartoffel|tomate|zwiebel|paprika|gurke|salat|möhre|karotte|kohl|rotkohl|spinat|zucchini|aubergine|brokkoli|blumenkohl|lauch|sellerie|champignon|pilz/.test(nameLower)) {
    return "gemuese";
  }
  // Obst
  if (/apfel|birne|banane|orange|zitrone|lime|erdbeere|himbeere|traube|melone|ananas|mango|kiwi/.test(nameLower)) {
    return "obst";
  }
  // Milchprodukte
  if (/milch|sahne|butter|käse|joghurt|quark|parmesan|mozzarella|gouda|emmentaler|schmand|créme/.test(nameLower)) {
    return "milchprodukte";
  }
  // Getränke
  if (/wasser|cola|saft|bier|wein|schnaps|likör|kaffee|tee|limonade|sprite|fanta/.test(nameLower)) {
    return "getraenke";
  }
  // Gewürze
  if (/salz|pfeffer|öl|olivenöl|essig|zucker|mehl|gewürz|oregano|basilikum|thymian|rosmarin|curry|paprika\s*pulver|zimt|muskat/.test(nameLower)) {
    return "gewuerze";
  }
  // Backwaren
  if (/brot|brötchen|baguette|ciabatta|croissant|kuchen|torte|gebäck/.test(nameLower)) {
    return "backwaren";
  }

  return "sonstiges";
}

export const create = mutation({
  args: {
    type: v.union(v.literal("invoice"), v.literal("delivery_note")),
    fileName: v.string(),
    fileId: v.optional(v.id("_storage")),
    invoiceNumber: v.optional(v.string()),
    supplierName: v.string(),
    supplierAddress: v.optional(v.string()),
    supplierId: v.optional(v.id("suppliers")),
    documentDate: v.number(),
    dueDate: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    totalAmount: v.number(),
    uploadedBy: v.id("users"),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        unitPrice: v.number(),
        totalPrice: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { items, supplierName, supplierAddress, ...docData } = args;

    // Find or create supplier
    let supplierId = docData.supplierId;
    if (!supplierId) {
      // Try to find existing supplier by name
      const existingSupplier = await ctx.db
        .query("suppliers")
        .withIndex("by_name", (q) => q.eq("name", supplierName))
        .first();

      if (existingSupplier) {
        supplierId = existingSupplier._id;
      } else {
        // Create new supplier
        supplierId = await ctx.db.insert("suppliers", {
          name: supplierName,
          contactPerson: "",
          email: "",
          phone: "",
          address: supplierAddress || "",
          category: "Sonstiges",
          rating: 3,
          createdAt: Date.now(),
        });
      }
    }

    const documentId = await ctx.db.insert("documents", {
      ...docData,
      supplierName,
      supplierAddress,
      supplierId,
      uploadDate: Date.now(),
      status: "analyzed",
    });

    for (const item of items) {
      await ctx.db.insert("documentItems", { documentId, ...item });
    }

    return documentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    type: v.optional(v.union(v.literal("invoice"), v.literal("delivery_note"))),
    invoiceNumber: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    supplierAddress: v.optional(v.string()),
    documentDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    items: v.optional(v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        unitPrice: v.number(),
        totalPrice: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const { id, items, ...updates } = args;

    // Update document
    await ctx.db.patch(id, updates);

    // If items provided, replace all items
    if (items) {
      // Delete existing items
      const existingItems = await ctx.db
        .query("documentItems")
        .withIndex("by_document", (q) => q.eq("documentId", id))
        .collect();

      for (const item of existingItems) {
        await ctx.db.delete(item._id);
      }

      // Insert new items
      for (const item of items) {
        await ctx.db.insert("documentItems", { documentId: id, ...item });
      }
    }

    return await ctx.db.get(id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("documents"),
    status: documentStatus,
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    // Update the document status
    await ctx.db.patch(args.id, { status: args.status });

    // If the document is being approved, sync items with inventory
    if (args.status === "approved" && document.status !== "approved") {
      // Get document items
      const items = await ctx.db
        .query("documentItems")
        .withIndex("by_document", (q) => q.eq("documentId", args.id))
        .collect();

      // Make sure we have a supplier ID
      let supplierId = document.supplierId;
      if (!supplierId) {
        // Try to find or create the supplier
        const existingSupplier = await ctx.db
          .query("suppliers")
          .withIndex("by_name", (q) => q.eq("name", document.supplierName))
          .first();

        if (existingSupplier) {
          supplierId = existingSupplier._id;
        } else {
          supplierId = await ctx.db.insert("suppliers", {
            name: document.supplierName,
            contactPerson: "",
            email: "",
            phone: "",
            address: document.supplierAddress || "",
            category: "Sonstiges",
            rating: 3,
            createdAt: Date.now(),
          });
        }

        // Update document with supplier ID
        await ctx.db.patch(args.id, { supplierId });
      }

      // Process each item and update/create products
      for (const item of items) {
        // Try to find existing product by name (case-insensitive)
        const allProducts = await ctx.db.query("products").collect();
        const existingProduct = allProducts.find(
          (p) => p.name.toLowerCase() === item.name.toLowerCase()
        );

        if (existingProduct) {
          // Update existing product: add to stock, recalculate average price
          const newStock = existingProduct.currentStock + item.quantity;
          // Weighted average price calculation
          const totalOldValue = existingProduct.currentStock * existingProduct.avgPrice;
          const totalNewValue = item.quantity * item.unitPrice;
          const newAvgPrice = (totalOldValue + totalNewValue) / newStock;

          await ctx.db.patch(existingProduct._id, {
            currentStock: newStock,
            avgPrice: Math.round(newAvgPrice * 100) / 100,
            lastOrderDate: document.documentDate,
          });
        } else {
          // Create new product
          const category = guessCategory(item.name);
          await ctx.db.insert("products", {
            name: item.name,
            category,
            unit: item.unit,
            currentStock: item.quantity,
            minStock: Math.ceil(item.quantity * 0.3), // Default min stock to 30% of initial quantity
            avgPrice: item.unitPrice,
            supplierId: supplierId!,
            lastOrderDate: document.documentDate,
          });
        }
      }

      // Update spending records
      const date = new Date(document.documentDate);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
      const month = monthNames[monthIndex];

      const existingRecord = await ctx.db
        .query("spendingRecords")
        .withIndex("by_year_month", (q) => q.eq("year", year).eq("monthIndex", monthIndex))
        .first();

      if (existingRecord) {
        await ctx.db.patch(existingRecord._id, {
          amount: existingRecord.amount + document.totalAmount,
        });
      } else {
        await ctx.db.insert("spendingRecords", {
          month,
          year,
          monthIndex,
          amount: document.totalAmount,
        });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    // Delete associated items first
    const items = await ctx.db
      .query("documentItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});
