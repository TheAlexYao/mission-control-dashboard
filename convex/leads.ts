import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a lead
export const create = mutation({
  args: {
    name: v.string(),
    company: v.optional(v.string()),
    stage: v.optional(v.string()),
    source: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    contacts: v.optional(
      v.array(
        v.object({
          type: v.string(),
          value: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leads", {
      name: args.name,
      company: args.company,
      stage: args.stage ?? "prospect",
      source: args.source,
      value: args.value,
      currency: args.currency ?? "USD",
      nextAction: args.nextAction,
      nextActionDate: args.nextActionDate,
      lastContact: Date.now(),
      notes: args.notes,
      tags: args.tags,
      contacts: args.contacts,
    });
  },
});

// Update lead stage
export const updateStage = mutation({
  args: {
    id: v.id("leads"),
    stage: v.string(),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = {
      stage: args.stage,
      lastContact: Date.now(),
    };
    if (args.nextAction) update.nextAction = args.nextAction;
    if (args.nextActionDate) update.nextActionDate = args.nextActionDate;
    if (args.notes) update.notes = args.notes;
    await ctx.db.patch(args.id, update);
  },
});

// Log contact with a lead
export const logContact = mutation({
  args: {
    id: v.id("leads"),
    notes: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { lastContact: Date.now() };
    if (args.notes) update.notes = args.notes;
    if (args.nextAction) update.nextAction = args.nextAction;
    if (args.nextActionDate) update.nextActionDate = args.nextActionDate;
    await ctx.db.patch(args.id, update);
  },
});

// List leads by stage
export const list = query({
  args: {
    stage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.stage) {
      return await ctx.db
        .query("leads")
        .withIndex("by_stage", (q) => q.eq("stage", args.stage!))
        .collect();
    }
    return await ctx.db.query("leads").collect();
  },
});

// Get stale leads (no contact in N days)
export const stale = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = Date.now() - (args.days ?? 7) * 24 * 60 * 60 * 1000;
    const all = await ctx.db.query("leads").collect();
    return all.filter(
      (l) =>
        l.lastContact &&
        l.lastContact < threshold &&
        !["closed_won", "closed_lost", "churned"].includes(l.stage)
    );
  },
});
