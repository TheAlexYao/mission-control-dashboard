"use client";

import { useState } from "react";
import CommandBar from "@/components/CommandBar";
import AgentGrid from "@/components/AgentGrid";
import ActivityTimeline from "@/components/ActivityTimeline";
import TaskQueue from "@/components/TaskQueue";

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--cream)',
      }}
    >
      <CommandBar />

      {/* Agent grid row */}
      <div
        style={{
          height: '38%',
          padding: '4px 4px 2px',
          flexShrink: 0,
        }}
      >
        <AgentGrid
          selectedAgent={selectedAgent}
          onAgentSelect={setSelectedAgent}
        />
      </div>

      {/* Bottom row */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '55fr 45fr',
          gap: 4,
          padding: '2px 4px 4px',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <ActivityTimeline
          selectedAgent={selectedAgent}
          selectedProject={null}
        />
        <TaskQueue selectedAgent={selectedAgent} />
      </div>
    </div>
  );
}
