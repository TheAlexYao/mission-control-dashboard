import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Generic webhook — agents, Codex, any external service
// POST /webhook { agent, event, summary, project?, taskId?, metadata? }
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { agent, event, summary, project, taskId, metadata } = body;

      if (!agent || !event || !summary) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: agent, event, summary" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      await ctx.runMutation(api.activities.log, {
        agent,
        action: event,
        summary,
        project: project ?? undefined,
        metadata: metadata ?? undefined,
      });

      if (taskId && (event === "done" || event === "completed" || event === "task_done")) {
        try {
          await ctx.runMutation(api.tasks.updateStatus, {
            id: taskId,
            status: "done",
            notes: summary,
          });
        } catch { /* task ID might be invalid */ }
      }

      try {
        await ctx.runMutation(api.agents.setStatus, {
          name: agent,
          status: "active",
          currentFocus: summary,
        });
      } catch { /* agent might not exist */ }

      return new Response(
        JSON.stringify({ ok: true, event, agent }),
        { status: 200, headers: corsHeaders() }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders() }
      );
    }
  }),
});

// Transcript webhook — receives Granola/Whisper transcripts
// POST /transcript { title, source, rawText, attendees?, startTime?, duration?, metadata? }
http.route({
  path: "/transcript",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { title, source, rawText, attendees, startTime, duration, project, metadata } = body;

      if (!title || !rawText) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: title, rawText" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      const id = await ctx.runMutation(api.transcripts.create, {
        title,
        source: source ?? "granola",
        rawText,
        attendees: attendees ?? undefined,
        startTime: startTime ?? undefined,
        duration: duration ?? undefined,
        project: project ?? undefined,
        metadata: metadata ?? undefined,
      });

      // Log activity
      await ctx.runMutation(api.activities.log, {
        agent: "system",
        action: "transcript_received",
        summary: `Transcript received: ${title}`,
        project: project ?? undefined,
        metadata: { transcriptId: id, source: source ?? "granola" },
      });

      return new Response(
        JSON.stringify({ ok: true, transcriptId: id }),
        { status: 200, headers: corsHeaders() }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders() }
      );
    }
  }),
});

// Reading webhook — save articles, tweets, links
// POST /reading { url, title, sourceType, content?, tags?, project? }
http.route({
  path: "/reading",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { url, title, sourceType, content, tags, project, notes } = body;

      if (!url || !title) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: url, title" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      const id = await ctx.runMutation(api.readings.create, {
        url,
        title,
        sourceType: sourceType ?? "article",
        content: content ?? undefined,
        tags: tags ?? undefined,
        project: project ?? undefined,
        notes: notes ?? undefined,
      });

      return new Response(
        JSON.stringify({ ok: true, readingId: id }),
        { status: 200, headers: corsHeaders() }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders() }
      );
    }
  }),
});

// Inbox webhook — braindumps, ideas, questions
// POST /inbox { type, title, body, sourceType?, project?, tags? }
http.route({
  path: "/inbox",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { type, title, body: itemBody, sourceType, sourceId, project, tags } = body;

      if (!type || !title || !itemBody) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: type, title, body" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      const id = await ctx.runMutation(api.inbox.create, {
        type,
        title,
        body: itemBody,
        sourceType: sourceType ?? undefined,
        sourceId: sourceId ?? undefined,
        project: project ?? undefined,
        tags: tags ?? undefined,
      });

      return new Response(
        JSON.stringify({ ok: true, inboxId: id }),
        { status: 200, headers: corsHeaders() }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders() }
      );
    }
  }),
});

// Calendar sync — upsert events from GWS
// POST /calendar { events: [{ eventId, title, startTime, endTime, attendees?, location?, meetLink?, description? }] }
http.route({
  path: "/calendar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { events } = body;

      if (!events || !Array.isArray(events)) {
        return new Response(
          JSON.stringify({ error: "Missing required field: events (array)" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      let upserted = 0;
      for (const event of events) {
        if (!event.eventId || !event.title || !event.startTime || !event.endTime) {
          continue;
        }
        await ctx.runMutation(api.calendar.upsert, {
          eventId: event.eventId,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          attendees: event.attendees ?? undefined,
          location: event.location ?? undefined,
          meetLink: event.meetLink ?? undefined,
          description: event.description ?? undefined,
          project: event.project ?? undefined,
          prepNotes: event.prepNotes ?? undefined,
          status: event.status ?? undefined,
        });
        upserted++;
      }

      await ctx.runMutation(api.activities.log, {
        agent: "system",
        action: "calendar_sync",
        summary: `Synced ${upserted} calendar events`,
      });

      return new Response(
        JSON.stringify({ ok: true, upserted }),
        { status: 200, headers: corsHeaders() }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders() }
      );
    }
  }),
});

// Health check
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", service: "mission-control", tables: 8 }),
      { status: 200, headers: corsHeaders() }
    );
  }),
});

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
}

export default http;
