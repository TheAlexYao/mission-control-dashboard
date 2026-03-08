import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Register or update an agent
export const upsert = mutation({
  args: {
    name: v.string(),
    archetype: v.string(),
    status: v.optional(v.string()),
    currentFocus: v.optional(v.string()),
    config: v.optional(
      v.object({
        model: v.optional(v.string()),
        topicId: v.optional(v.string()),
        channel: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastSeen: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      name: args.name,
      archetype: args.archetype,
      status: args.status ?? "idle",
      currentFocus: args.currentFocus,
      lastSeen: Date.now(),
      config: args.config,
    });
  },
});

// Update agent status (called on session start/end)
export const setStatus = mutation({
  args: {
    name: v.string(),
    status: v.string(),
    currentFocus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (!agent) throw new Error(`Agent not found: ${args.name}`);

    await ctx.db.patch(agent._id, {
      status: args.status,
      currentFocus: args.currentFocus,
      lastSeen: Date.now(),
    });
  },
});

// Get all agents
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// Get a specific agent
export const get = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});
