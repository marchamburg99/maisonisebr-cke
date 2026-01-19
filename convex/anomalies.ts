import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const anomalyType = v.union(
  v.literal("price_increase"),
  v.literal("price_decrease"),
  v.literal("unusual_quantity"),
  v.literal("missing_delivery"),
  v.literal("missing_delivery_note"),
  v.literal("duplicate_invoice"),
  v.literal("new_supplier"),
  v.literal("low_stock")
);

const severityType = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("anomalies").order("desc").collect();
  },
});

export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("anomalies")
      .withIndex("by_resolved", (q) => q.eq("resolved", false))
      .collect();
  },
});

export const listBySeverity = query({
  args: { severity: severityType },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("anomalies")
      .withIndex("by_severity", (q) => q.eq("severity", args.severity))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("anomalies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const resolve = mutation({
  args: { id: v.id("anomalies"), resolvedBy: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      resolved: true,
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
    });
  },
});

export const create = mutation({
  args: {
    type: anomalyType,
    severity: severityType,
    title: v.string(),
    description: v.string(),
    documentId: v.optional(v.id("documents")),
    productId: v.optional(v.id("products")),
    supplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("anomalies", {
      ...args,
      detectedAt: Date.now(),
      resolved: false,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("anomalies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
