import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const productCategory = v.union(
  v.literal("fleisch"),
  v.literal("fisch"),
  v.literal("gemuese"),
  v.literal("obst"),
  v.literal("milchprodukte"),
  v.literal("getraenke"),
  v.literal("gewuerze"),
  v.literal("backwaren"),
  v.literal("sonstiges")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const listByCategory = query({
  args: { category: productCategory },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const listLowStock = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.filter((p) => p.currentStock < p.minStock);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: productCategory,
    unit: v.string(),
    currentStock: v.number(),
    minStock: v.number(),
    avgPrice: v.number(),
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    category: v.optional(productCategory),
    unit: v.optional(v.string()),
    currentStock: v.optional(v.number()),
    minStock: v.optional(v.number()),
    avgPrice: v.optional(v.number()),
    supplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

export const updateStock = mutation({
  args: { id: v.id("products"), currentStock: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { currentStock: args.currentStock });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
