import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    body: v.string(),
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    project: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inbox", {
      ...args,
      status: "new",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("inbox"),
    status: v.string(),
    actedOnAs: v.optional(v.string()),
    actedOnId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { status: args.status };
    if (args.actedOnAs) update.actedOnAs = args.actedOnAs;
    if (args.actedOnId) update.actedOnId = args.actedOnId;
    await ctx.db.patch(args.id, update);
  },
});

export const pending = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("inbox")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .order("desc")
      .collect();
  },
});

// Get flagged/high-priority inbox items (for "Think About" panel)
export const flagged = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("inbox").order("desc").take(100);
    // Return items that are new or have interesting tags
    return all.filter((item) => {
      if (item.status === "new") return true;
      if (item.tags && (item.tags.includes("flagged") || item.tags.includes("priority") || item.tags.includes("think-about"))) return true;
      return false;
    }).slice(0, 20);
  },
});

export const unreviewed = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("inbox")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .order("desc")
      .collect();
  },
});

export const list = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("inbox")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(args.limit ?? 50);
    }
    if (args.status) {
      return await ctx.db
        .query("inbox")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db.query("inbox").order("desc").take(args.limit ?? 50);
  },
});
