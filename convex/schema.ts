import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
    avatar: v.optional(v.string()),
    passwordHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    category: v.string(),
    rating: v.number(),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  products: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("fleisch"),
      v.literal("fisch"),
      v.literal("gemuese"),
      v.literal("obst"),
      v.literal("milchprodukte"),
      v.literal("getraenke"),
      v.literal("gewuerze"),
      v.literal("backwaren"),
      v.literal("sonstiges")
    ),
    unit: v.string(),
    currentStock: v.number(),
    minStock: v.number(),
    avgPrice: v.number(),
    supplierId: v.id("suppliers"),
    lastOrderDate: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_supplier", ["supplierId"]),

  documents: defineTable({
    type: v.union(v.literal("invoice"), v.literal("delivery_note")),
    fileName: v.string(),
    fileId: v.optional(v.id("_storage")),
    uploadDate: v.number(),
    supplierName: v.string(),
    supplierId: v.optional(v.id("suppliers")),
    documentDate: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("analyzed"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    uploadedBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_supplier", ["supplierId"]),

  documentItems: defineTable({
    documentId: v.id("documents"),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    unitPrice: v.number(),
    totalPrice: v.number(),
  }).index("by_document", ["documentId"]),

  anomalies: defineTable({
    type: v.union(
      v.literal("price_increase"),
      v.literal("price_decrease"),
      v.literal("unusual_quantity"),
      v.literal("missing_delivery"),
      v.literal("missing_delivery_note"),
      v.literal("duplicate_invoice"),
      v.literal("new_supplier"),
      v.literal("low_stock")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    title: v.string(),
    description: v.string(),
    documentId: v.optional(v.id("documents")),
    productId: v.optional(v.id("products")),
    supplierId: v.optional(v.id("suppliers")),
    detectedAt: v.number(),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
  })
    .index("by_resolved", ["resolved"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"]),

  spendingRecords: defineTable({
    month: v.string(),
    year: v.number(),
    monthIndex: v.number(),
    amount: v.number(),
  }).index("by_year_month", ["year", "monthIndex"]),
});
