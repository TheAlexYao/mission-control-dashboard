import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    createdBy: v.string(),
    project: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "todo",
      priority: args.priority ?? "medium",
      assignedTo: args.assignedTo,
      createdBy: args.createdBy,
      project: args.project,
      dueDate: args.dueDate,
      notes: args.notes,
      tags: args.tags,
    });
  },
});

// Update task status
export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, unknown> = { status: args.status };
    if (args.status === "done") update.doneAt = Date.now();
    if (args.notes) update.notes = args.notes;
    await ctx.db.patch(args.id, update);
  },
});

// Assign task to an agent
export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      assignedTo: args.assignedTo,
      status: "in_progress",
    });
  },
});

// List tasks with optional filters
export const list = query({
  args: {
    status: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    project: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (idx) => idx.eq("status", args.status!))
        .collect();
    }
    if (args.assignedTo) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_assignedTo", (idx) =>
          idx.eq("assignedTo", args.assignedTo!)
        )
        .collect();
    }
    if (args.project) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_project", (idx) => idx.eq("project", args.project!))
        .collect();
    }
    return await ctx.db.query("tasks").collect();
  },
});

// Get active tasks (not done or dropped)
export const active = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("tasks").collect();
    return all.filter((t) => !["done", "dropped"].includes(t.status));
  },
});

// Group tasks by project with status counts
export const byProject = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("tasks").collect();
    const map: Record<string, { active: number; blocked: number; done: number; inProgress: number; total: number; tasks: typeof all }> = {};
    for (const task of all) {
      const proj = task.project ?? "unassigned";
      if (!map[proj]) map[proj] = { active: 0, blocked: 0, done: 0, inProgress: 0, total: 0, tasks: [] };
      map[proj].total++;
      map[proj].tasks.push(task);
      if (task.status === "done") map[proj].done++;
      else if (task.status === "blocked") map[proj].blocked++;
      else if (task.status === "in_progress") map[proj].inProgress++;
      else if (!["dropped"].includes(task.status)) map[proj].active++;
    }
    return Object.entries(map).map(([project, data]) => ({
      project,
      ...data,
    }));
  },
});

// Tasks with due dates within N hours
export const dueWithin = query({
  args: { hours: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const hours = args.hours ?? 48;
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const all = await ctx.db.query("tasks").collect();
    return all.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= cutoff && !["done", "dropped"].includes(t.status);
    });
  },
});
