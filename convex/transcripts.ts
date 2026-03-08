import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    source: v.string(),
    rawText: v.string(),
    summary: v.optional(v.string()),
    attendees: v.optional(v.array(v.object({
      name: v.string(),
      email: v.optional(v.string()),
    }))),
    startTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    project: v.optional(v.string()),
    leadId: v.optional(v.id("leads")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcripts", {
      ...args,
      processed: false,
    });
  },
});

export const markProcessed = mutation({
  args: {
    id: v.id("transcripts"),
    summary: v.optional(v.string()),
    project: v.optional(v.string()),
    leadId: v.optional(v.id("leads")),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { processed: true };
    if (args.summary) update.summary = args.summary;
    if (args.project) update.project = args.project;
    if (args.leadId) update.leadId = args.leadId;
    await ctx.db.patch(args.id, update);
  },
});

export const unprocessed = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("transcripts")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .collect();
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcripts")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const get = query({
  args: { id: v.id("transcripts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
