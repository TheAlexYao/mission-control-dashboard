import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    url: v.string(),
    title: v.string(),
    sourceType: v.string(),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    project: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    remixPotential: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("readings", {
      ...args,
      status: "saved",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("readings"),
    status: v.string(),
    summary: v.optional(v.string()),
    remixPotential: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const update: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) update[k] = val;
    }
    await ctx.db.patch(id, update);
  },
});

export const list = query({
  args: {
    sourceType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.sourceType) {
      return await ctx.db.query("readings").withIndex("by_sourceType", (q) => q.eq("sourceType", args.sourceType!)).order("desc").take(args.limit ?? 50);
    }
    if (args.status) {
      return await ctx.db.query("readings").withIndex("by_status", (q) => q.eq("status", args.status!)).order("desc").take(args.limit ?? 50);
    }
    return await ctx.db.query("readings").order("desc").take(args.limit ?? 50);
  },
});

export const search = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("readings").order("desc").collect();
    return all.filter((r) => r.tags?.includes(args.tag));
  },
});
