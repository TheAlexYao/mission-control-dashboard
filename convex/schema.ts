import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Registered agents and their current state
  agents: defineTable({
    name: v.string(),
    archetype: v.string(),
    status: v.string(), // "active", "idle", "busy", "offline"
    currentFocus: v.optional(v.string()),
    lastSeen: v.number(),
    config: v.optional(
      v.object({
        model: v.optional(v.string()),
        topicId: v.optional(v.string()),
        channel: v.optional(v.string()),
      })
    ),
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"]),

  // Work items — assigned to agents, tracked through lifecycle
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "inbox", "todo", "in_progress", "blocked", "done", "dropped"
    priority: v.string(), // "critical", "high", "medium", "low"
    assignedTo: v.optional(v.string()),
    createdBy: v.string(),
    project: v.optional(v.string()),
    blockedBy: v.optional(v.string()),
    doneAt: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_project", ["project"])
    .index("by_priority", ["priority"]),

  // CRM pipeline
  leads: defineTable({
    name: v.string(),
    company: v.optional(v.string()),
    stage: v.string(), // "prospect", "discovery", "proposal", "negotiation", "closed_won", "closed_lost", "churned"
    source: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.string()),
    lastContact: v.optional(v.number()),
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
  })
    .index("by_stage", ["stage"])
    .index("by_company", ["company"])
    .index("by_nextActionDate", ["nextActionDate"]),

  // Append-only activity log
  activities: defineTable({
    agent: v.string(),
    action: v.string(),
    summary: v.string(),
    project: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    leadId: v.optional(v.id("leads")),
    metadata: v.optional(v.any()),
  })
    .index("by_agent", ["agent"])
    .index("by_project", ["project"])
    .index("by_action", ["action"]),

  // Raw call/meeting transcripts — preserved in full
  transcripts: defineTable({
    title: v.string(),
    source: v.string(), // "granola", "whisper", "manual"
    rawText: v.string(), // full transcript
    summary: v.optional(v.string()), // AI-generated summary
    attendees: v.optional(v.array(v.object({
      name: v.string(),
      email: v.optional(v.string()),
    }))),
    startTime: v.optional(v.string()), // ISO
    duration: v.optional(v.number()), // seconds
    project: v.optional(v.string()),
    leadId: v.optional(v.id("leads")),
    processed: v.boolean(), // has Aineko extracted ideas/tasks from this?
    metadata: v.optional(v.any()), // raw Granola payload, etc
  })
    .index("by_source", ["source"])
    .index("by_project", ["project"])
    .index("by_processed", ["processed"]),

  // Unified inbox — ideas, braindumps, call extractions, content seeds, questions
  inbox: defineTable({
    type: v.string(), // "idea", "braindump", "call_extraction", "content_seed", "question"
    title: v.string(),
    body: v.string(), // full content
    status: v.string(), // "new", "reviewed", "acted_on", "parked"
    sourceType: v.optional(v.string()), // "transcript", "reading", "chat", "manual"
    sourceId: v.optional(v.string()), // reference to transcript/reading/etc
    project: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    actedOnAs: v.optional(v.string()), // "task", "content", "lead" — what it became
    actedOnId: v.optional(v.string()), // ID of the created item
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_project", ["project"]),

  // Content production — things Alex is creating
  content: defineTable({
    title: v.string(),
    type: v.string(), // "lesson", "post", "lead_magnet", "script", "thread", "newsletter"
    status: v.string(), // "idea", "draft", "review", "published"
    body: v.optional(v.string()), // content text or outline
    project: v.optional(v.string()),
    publishedUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_project", ["project"]),

  // Calendar events — synced from Google Calendar
  calendar: defineTable({
    eventId: v.string(), // Google Calendar event ID (for dedup)
    title: v.string(),
    startTime: v.string(), // ISO datetime
    endTime: v.string(), // ISO datetime
    attendees: v.optional(v.array(v.object({
      name: v.optional(v.string()),
      email: v.string(),
      self: v.optional(v.boolean()),
    }))),
    location: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    description: v.optional(v.string()),
    project: v.optional(v.string()), // matched project if identifiable
    leadId: v.optional(v.id("leads")),
    prepNotes: v.optional(v.string()), // AI-generated prep notes
    status: v.string(), // "upcoming", "in_progress", "completed", "cancelled"
  })
    .index("by_eventId", ["eventId"])
    .index("by_startTime", ["startTime"])
    .index("by_status", ["status"]),

  // Readings — articles, tweets, threads, videos Alex saves
  readings: defineTable({
    url: v.string(),
    title: v.string(),
    sourceType: v.string(), // "article", "tweet", "thread", "video", "paper", "tool"
    content: v.optional(v.string()), // full extracted text
    summary: v.optional(v.string()), // AI summary
    status: v.string(), // "saved", "processed", "referenced"
    project: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    remixPotential: v.optional(v.number()), // 1-5 stars
    notes: v.optional(v.string()),
  })
    .index("by_sourceType", ["sourceType"])
    .index("by_status", ["status"])
    .index("by_project", ["project"]),
});
