import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const create = mutation({
  args: {
    type: v.union(v.literal("invoice"), v.literal("delivery_note")),
    fileName: v.string(),
    supplierName: v.string(),
    supplierId: v.optional(v.id("suppliers")),
    documentDate: v.number(),
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
    const { items, ...docData } = args;

    const documentId = await ctx.db.insert("documents", {
      ...docData,
      uploadDate: Date.now(),
      status: "analyzed",
    });

    for (const item of items) {
      await ctx.db.insert("documentItems", { documentId, ...item });
    }

    return documentId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("documents"),
    status: documentStatus,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
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
