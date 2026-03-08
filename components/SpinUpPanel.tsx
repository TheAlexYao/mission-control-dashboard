"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { relativeTime, getAgentEmoji } from "@/lib/utils";

export default function SpinUpPanel() {
  const tasks = useQuery(api.tasks.list, { status: "in_progress" });
  const allTasks = useQuery(api.tasks.active);
  const activities = useQuery(api.activities.recent, { limit: 30 });

  const spinUpItems = (() => {
    if (!tasks) return [];
    return tasks.slice(0, 8).map((task) => {
      // Find last activity for this task
      const lastActivity = activities?.find(
        (a) => a.taskId === task._id || a.project === task.project
      );
      return { task, lastActivity };
    });
  })();

  const loading = tasks === undefined;

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>⚙</span>
        <span>SPIN UP</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>// 起動</span>
        {tasks && tasks.length > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              background: 'var(--navy)',
              color: 'var(--cream)',
              padding: '1px 5px',
            }}
          >
            {tasks.length}
          </span>
        )}
      </div>
      <div className="panel-body" style={{ padding: '6px 0' }}>
        {loading && (
          <div style={{ padding: '8px 10px', color: 'var(--gray-blue)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 }}>
            Loading...
          </div>
        )}
        {!loading && spinUpItems.length === 0 && (
          <div style={{ padding: '16px 10px', color: 'var(--gray-blue)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 }}>
            All clear. Start something new.
          </div>
        )}
        {spinUpItems.map(({ task, lastActivity }) => (
          <div
            key={task._id}
            style={{
              padding: '7px 10px',
              borderBottom: '1px solid var(--border)',
              borderLeft: '2px solid var(--navy-light)',
            }}
          >
            {/* Task title */}
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--navy-text)',
              lineHeight: 1.3,
              marginBottom: 3,
            }}>
              {task.title}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {task.assignedTo && (
                <span style={{
                  fontSize: 10,
                  color: 'var(--gray-blue)',
                }}>
                  {getAgentEmoji(task.assignedTo)} {task.assignedTo}
                </span>
              )}
              {task.project && (
                <span className="tag">{task.project}</span>
              )}
              {lastActivity && (
                <span style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 9,
                  color: 'var(--gray-blue)',
                  marginLeft: 'auto',
                }}>
                  {relativeTime(lastActivity._creationTime)}
                </span>
              )}
            </div>

            {/* Context line */}
            {lastActivity && (
              <div style={{
                fontSize: 10,
                color: 'var(--gray-blue)',
                marginTop: 3,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {lastActivity.summary}
              </div>
            )}
          </div>
        ))}

        {/* Also show today-priority items */}
        {allTasks && allTasks
          .filter((t) => t.priority === 'critical' && t.status !== 'in_progress' && t.status !== 'blocked')
          .slice(0, 3)
          .map((task) => (
            <div
              key={task._id}
              style={{
                padding: '7px 10px',
                borderBottom: '1px solid var(--border)',
                borderLeft: '2px solid #E84D3D',
                opacity: 0.85,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#E84D3D' }}>⬆ CRITICAL</span>
                {task.project && <span className="tag">{task.project}</span>}
              </div>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--navy-text)',
                lineHeight: 1.3,
              }}>
                {task.title}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
