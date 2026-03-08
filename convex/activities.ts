import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log an activity (append-only)
export const log = mutation({
  args: {
    agent: v.string(),
    action: v.string(),
    summary: v.string(),
    project: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    leadId: v.optional(v.id("leads")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      agent: args.agent,
      action: args.action,
      summary: args.summary,
      project: args.project,
      taskId: args.taskId,
      leadId: args.leadId,
      metadata: args.metadata,
    });
  },
});

// Get recent activities grouped by date (today/yesterday/this week)
export const grouped = query({
  args: {
    agent: v.optional(v.string()),
    project: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let activities;
    if (args.agent) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agent", args.agent!))
        .order("desc")
        .take(limit);
    } else if (args.project) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_project", (q) => q.eq("project", args.project!))
        .order("desc")
        .take(limit);
    } else {
      activities = await ctx.db.query("activities").order("desc").take(limit);
    }
    
    const now = Date.now();
    const dayMs = 86400000;
    const todayStart = now - (now % dayMs);
    const yesterdayStart = todayStart - dayMs;
    const weekStart = todayStart - 6 * dayMs;
    
    const groups: { today: typeof activities; yesterday: typeof activities; thisWeek: typeof activities; older: typeof activities } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    
    for (const a of activities) {
      const ts = a._creationTime;
      if (ts >= todayStart) groups.today.push(a);
      else if (ts >= yesterdayStart) groups.yesterday.push(a);
      else if (ts >= weekStart) groups.thisWeek.push(a);
      else groups.older.push(a);
    }
    
    return groups;
  },
});

// Get recent activities (newest first)
export const recent = query({
  args: {
    limit: v.optional(v.number()),
    agent: v.optional(v.string()),
    project: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.agent) {
      return await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agent", args.agent!))
        .order("desc")
        .take(limit);
    }

    if (args.project) {
      return await ctx.db
        .query("activities")
        .withIndex("by_project", (q) => q.eq("project", args.project!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("activities").order("desc").take(limit);
  },
});
