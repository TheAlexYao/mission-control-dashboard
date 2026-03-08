"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { relativeTime, getAgentEmoji } from "@/lib/utils";

export default function AttentionPanel() {
  const blockedTasks = useQuery(api.tasks.list, { status: "blocked" });
  const inboxItems = useQuery(api.inbox.list, { status: "new", limit: 5 });
  const agents = useQuery(api.agents.list);

  const items: Array<{
    type: 'blocked' | 'inbox' | 'agent-error';
    icon: string;
    title: string;
    age: number;
    source: string;
  }> = [];

  if (blockedTasks) {
    for (const task of blockedTasks) {
      items.push({
        type: 'blocked',
        icon: '🚫',
        title: task.title,
        age: task._creationTime,
        source: task.assignedTo ? `${getAgentEmoji(task.assignedTo)} ${task.assignedTo}` : 'unassigned',
      });
    }
  }

  if (inboxItems) {
    for (const item of inboxItems) {
      items.push({
        type: 'inbox',
        icon: '📥',
        title: item.title,
        age: item._creationTime,
        source: item.sourceType || 'inbox',
      });
    }
  }

  if (agents) {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const agent of agents) {
      if (agent.status === 'active' && agent.lastSeen < oneHourAgo) {
        items.push({
          type: 'agent-error',
          icon: '⚠️',
          title: `${getAgentEmoji(agent.name)} ${agent.name} — stale (should be active)`,
          age: agent.lastSeen,
          source: `last seen ${relativeTime(agent.lastSeen)}`,
        });
      }
    }
  }

  // Sort by age (oldest first — most urgent)
  items.sort((a, b) => a.age - b.age);

  const count = items.length;

  return (
    <div
      className="panel attention-border"
      style={{ height: '100%' }}
    >
      <div className="panel-header" style={{ borderLeft: 'none' }}>
        <span>⚡</span>
        <span>ATTENTION</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>// 注意</span>
        {count > 0 && (
          <span
            className="badge-pulse"
            style={{
              marginLeft: 'auto',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              background: '#E84D3D',
              color: '#F5F0E8',
              padding: '1px 5px',
            }}
          >
            {count}
          </span>
        )}
      </div>
      <div className="panel-body" style={{ padding: '6px 0' }}>
        {count === 0 && (
          <div style={{
            padding: '16px 10px',
            color: 'var(--green)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
          }}>
            ✓ No items need attention.
          </div>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: '7px 10px',
              borderBottom: '1px solid var(--border)',
              borderLeft: `2px solid ${item.type === 'blocked' ? '#E84D3D' : item.type === 'inbox' ? '#3D5A80' : '#D4A843'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--navy-text)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 2,
                }}>
                  <span style={{
                    fontSize: 9,
                    color: 'var(--gray-blue)',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}>
                    {item.source}
                  </span>
                  <span style={{
                    fontSize: 9,
                    color: item.type === 'blocked' ? '#E84D3D' : 'var(--gray-blue)',
                    fontFamily: 'IBM Plex Mono, monospace',
                    marginLeft: 'auto',
                  }}>
                    {relativeTime(item.age)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
