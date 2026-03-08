import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    body: v.optional(v.string()),
    project: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("content", {
      ...args,
      status: "idea",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("content"),
    status: v.string(),
    publishedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { status: args.status };
    if (args.status === "published") {
      update.publishedAt = Date.now();
      if (args.publishedUrl) update.publishedUrl = args.publishedUrl;
    }
    await ctx.db.patch(args.id, update);
  },
});

export const update = mutation({
  args: {
    id: v.id("content"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    project: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const update: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) update[k] = val;
    }
    if (Object.keys(update).length > 0) {
      await ctx.db.patch(id, update);
    }
  },
});

export const list = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    project: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db.query("content").withIndex("by_type", (q) => q.eq("type", args.type!)).order("desc").collect();
    }
    if (args.status) {
      return await ctx.db.query("content").withIndex("by_status", (q) => q.eq("status", args.status!)).order("desc").collect();
    }
    if (args.project) {
      return await ctx.db.query("content").withIndex("by_project", (q) => q.eq("project", args.project!)).order("desc").collect();
    }
    return await ctx.db.query("content").order("desc").collect();
  },
});
