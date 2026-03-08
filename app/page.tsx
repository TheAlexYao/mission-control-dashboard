"use client";

import CommandBar from "@/components/CommandBar";
import SpinUpPanel from "@/components/SpinUpPanel";
import AttentionPanel from "@/components/AttentionPanel";
import UpcomingPanel from "@/components/UpcomingPanel";
import ProjectsPanel from "@/components/ProjectsPanel";
import ThinkAboutPanel from "@/components/ThinkAboutPanel";

export default function MainPage() {
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

      {/* Main grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '35fr 35fr 30fr',
          gap: 4,
          padding: 4,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Row 1 */}
        <SpinUpPanel />
        <AttentionPanel />

        {/* Row 2 */}
        <UpcomingPanel />
        <ProjectsPanel />

        {/* Row 3 — full width */}
        <div style={{ gridColumn: '1 / -1', minHeight: 0 }}>
          <ThinkAboutPanel />
        </div>
      </div>
    </div>
  );
}
