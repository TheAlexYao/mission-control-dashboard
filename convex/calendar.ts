import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upsert a calendar event (create or update by eventId)
export const upsert = mutation({
  args: {
    eventId: v.string(),
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    attendees: v.optional(v.array(v.object({
      name: v.optional(v.string()),
      email: v.string(),
      self: v.optional(v.boolean()),
    }))),
    location: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    description: v.optional(v.string()),
    project: v.optional(v.string()),
    prepNotes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendar")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();

    const data = {
      ...args,
      status: args.status ?? "upcoming",
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("calendar", data);
    }
  },
});

// Get upcoming events (next N hours)
export const upcoming = query({
  args: {
    hoursAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hoursAhead ?? 48;
    const now = new Date().toISOString();
    const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const events = await ctx.db
      .query("calendar")
      .withIndex("by_startTime")
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), now),
          q.lte(q.field("startTime"), cutoff)
        )
      )
      .collect();

    return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

// List all events in a date range
export const range = query({
  args: {
    from: v.string(),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("calendar")
      .withIndex("by_startTime")
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.from),
          q.lte(q.field("startTime"), args.to)
        )
      )
      .collect();

    return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

// Get today's events
export const today = query({
  args: {},
  handler: async (ctx) => {
    // Use ASU timezone offset (UTC-3)
    const now = new Date();
    const asuOffset = -3 * 60;
    const asuNow = new Date(now.getTime() + (asuOffset + now.getTimezoneOffset()) * 60000);
    const startOfDay = new Date(asuNow);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(asuNow);
    endOfDay.setHours(23, 59, 59, 999);

    // Convert back to UTC for query
    const startUtc = new Date(startOfDay.getTime() - (asuOffset + now.getTimezoneOffset()) * 60000);
    const endUtc = new Date(endOfDay.getTime() - (asuOffset + now.getTimezoneOffset()) * 60000);

    const events = await ctx.db
      .query("calendar")
      .withIndex("by_startTime")
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), startUtc.toISOString()),
          q.lte(q.field("startTime"), endUtc.toISOString())
        )
      )
      .collect();

    return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

// Update prep notes for an event
export const addPrepNotes = mutation({
  args: {
    id: v.id("calendar"),
    prepNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { prepNotes: args.prepNotes });
  },
});

// Mark event status
export const updateStatus = mutation({
  args: {
    id: v.id("calendar"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
