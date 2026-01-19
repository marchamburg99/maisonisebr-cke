import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("spendingRecords")
      .withIndex("by_year_month")
      .collect();
  },
});

export const getByYearMonth = query({
  args: { year: v.number(), monthIndex: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("spendingRecords")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("monthIndex", args.monthIndex)
      )
      .first();
  },
});

export const upsert = mutation({
  args: {
    month: v.string(),
    year: v.number(),
    monthIndex: v.number(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("spendingRecords")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("monthIndex", args.monthIndex)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { amount: args.amount });
      return existing._id;
    }

    return await ctx.db.insert("spendingRecords", args);
  },
});

export const create = mutation({
  args: {
    month: v.string(),
    year: v.number(),
    monthIndex: v.number(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("spendingRecords", args);
  },
});
