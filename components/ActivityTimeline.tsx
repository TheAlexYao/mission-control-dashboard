"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatTime, getAgentEmoji, getAgentColor, relativeTime } from "@/lib/utils";
import { useState } from "react";

const ACTION_COLORS: Record<string, string> = {
  research: '#3D5A80',
  deploy: '#5B8C5A',
  decision: '#E84D3D',
  task: '#D4A843',
  lead: '#8B9DC3',
  code: '#3D5A80',
  write: '#D4A843',
  analyze: '#5B8C5A',
};

type Activity = {
  _id: string;
  _creationTime: number;
  agent: string;
  action: string;
  summary: string;
  project?: string;
  metadata?: Record<string, unknown>;
};

function ActivityEntry({ activity, expanded, onToggle }: {
  activity: Activity;
  expanded: boolean;
  onToggle: () => void;
}) {
  const agentColor = getAgentColor(activity.agent);
  const actionColor = ACTION_COLORS[activity.action] || '#8B9DC3';

  return (
    <div
      onClick={onToggle}
      style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--border)',
        borderLeft: `2px solid ${agentColor}`,
        cursor: 'pointer',
        background: expanded ? 'rgba(43,58,103,0.03)' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 9,
          color: 'var(--gray-blue)',
          flexShrink: 0,
          marginTop: 1,
        }}>
          {formatTime(activity._creationTime)}
        </span>
        <span style={{ fontSize: 11, flexShrink: 0 }}>{getAgentEmoji(activity.agent)}</span>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
          color: actionColor,
          padding: '1px 4px',
          border: `1px solid ${actionColor}40`,
          flexShrink: 0,
          marginTop: 1,
        }}>
          {activity.action}
        </span>
        <div style={{
          fontSize: 10,
          color: 'var(--navy-text)',
          lineHeight: 1.4,
          flex: 1,
          minWidth: 0,
          overflow: expanded ? 'visible' : 'hidden',
          textOverflow: expanded ? 'clip' : 'ellipsis',
          whiteSpace: expanded ? 'normal' : 'nowrap',
        }}>
          {activity.summary}
        </div>
        {activity.project && (
          <span className="tag" style={{ flexShrink: 0, fontSize: 8 }}>{activity.project}</span>
        )}
      </div>
    </div>
  );
}

function TimeGroup({ label, activities, expandedId, onToggle }: {
  label: string;
  activities: Activity[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (activities.length === 0) return null;
  return (
    <>
      <div style={{
        padding: '4px 10px',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 9,
        color: 'var(--gray-blue)',
        letterSpacing: '0.1em',
        background: 'rgba(43,58,103,0.05)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        {label} · {activities.length}
      </div>
      {activities.map((a) => (
        <ActivityEntry
          key={a._id}
          activity={a}
          expanded={expandedId === a._id}
          onToggle={() => onToggle(a._id)}
        />
      ))}
    </>
  );
}

export default function ActivityTimeline({
  selectedAgent,
  selectedProject,
}: {
  selectedAgent: string | null;
  selectedProject: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(selectedProject);

  const activities = useQuery(api.activities.grouped, {
    agent: selectedAgent || undefined,
    project: filterProject || undefined,
    limit: 100,
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const groups = activities || { today: [], yesterday: [], thisWeek: [], older: [] };

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>⟳</span>
        <span>ACTIVITY</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>// アクティビティ</span>
        {selectedAgent && (
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 9,
            color: getAgentColor(selectedAgent),
            marginLeft: 6,
          }}>
            [{selectedAgent}]
          </span>
        )}
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {activities === undefined && (
          <div style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--gray-blue)' }}>
            Loading...
          </div>
        )}
        <TimeGroup
          label="TODAY"
          activities={groups.today as Activity[]}
          expandedId={expandedId}
          onToggle={toggleExpand}
        />
        <TimeGroup
          label="YESTERDAY"
          activities={groups.yesterday as Activity[]}
          expandedId={expandedId}
          onToggle={toggleExpand}
        />
        <TimeGroup
          label="THIS WEEK"
          activities={groups.thisWeek as Activity[]}
          expandedId={expandedId}
          onToggle={toggleExpand}
        />
        <TimeGroup
          label="OLDER"
          activities={groups.older as Activity[]}
          expandedId={expandedId}
          onToggle={toggleExpand}
        />
        {activities && groups.today.length === 0 && groups.yesterday.length === 0 &&
          groups.thisWeek.length === 0 && groups.older.length === 0 && (
          <div style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--gray-blue)' }}>
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
