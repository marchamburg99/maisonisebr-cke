import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("suppliers").collect();
  },
});

export const getById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("suppliers")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contactPerson: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    category: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
    rating: v.optional(v.number()),
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

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
