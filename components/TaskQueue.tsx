"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAgentEmoji, getAgentColor, getPriorityArrow, getPriorityClass, relativeTime } from "@/lib/utils";
import { useState } from "react";

const AGENT_NAMES = ['aineko', 'builder', 'scout', 'writer', 'deployer'];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

type Task = {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  notes?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  project?: string;
  dueDate?: string;
  blockedBy?: string;
};

function TaskRow({ task, expanded, onToggle }: {
  task: Task;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusColors: Record<string, string> = {
    blocked: '#E84D3D',
    in_progress: '#3D5A80',
    todo: '#D4A843',
    inbox: '#8B9DC3',
  };

  const statusDots: Record<string, string> = {
    blocked: '🔴',
    in_progress: '🔵',
    todo: '🟡',
    inbox: '⚪',
  };

  return (
    <div
      onClick={onToggle}
      style={{
        padding: '5px 8px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: expanded ? 'rgba(43,58,103,0.04)' : 'transparent',
        borderLeft: task.status === 'blocked' ? '2px solid #E84D3D' : '2px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 9, flexShrink: 0 }}>{statusDots[task.status] || '⚫'}</span>
        <span className={getPriorityClass(task.priority)} style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          flexShrink: 0,
          width: 10,
        }}>
          {getPriorityArrow(task.priority)}
        </span>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--navy-text)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>
        {task.project && (
          <span className="tag" style={{ fontSize: 8 }}>{task.project}</span>
        )}
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
          color: 'var(--gray-blue)',
          flexShrink: 0,
        }}>
          {relativeTime(task._creationTime)}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 6, marginLeft: 20 }}>
          {task.description && (
            <div style={{ fontSize: 9, color: 'var(--navy-text)', lineHeight: 1.5, marginBottom: 4 }}>
              {task.description}
            </div>
          )}
          {task.notes && (
            <div style={{
              fontSize: 9,
              color: 'var(--gray-blue)',
              lineHeight: 1.5,
              borderLeft: '2px solid var(--border)',
              paddingLeft: 6,
              fontStyle: 'italic',
            }}>
              {task.notes}
            </div>
          )}
          {task.blockedBy && (
            <div style={{
              fontSize: 9,
              color: '#E84D3D',
              marginTop: 4,
              fontFamily: 'IBM Plex Mono, monospace',
            }}>
              🚫 Blocked by: {task.blockedBy}
            </div>
          )}
          {task.dueDate && (
            <div style={{
              fontSize: 9,
              color: 'var(--gray-blue)',
              marginTop: 2,
              fontFamily: 'IBM Plex Mono, monospace',
            }}>
              Due: {task.dueDate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentSection({
  agentName,
  tasks,
  expandedId,
  onToggle,
}: {
  agentName: string;
  tasks: Task[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const color = getAgentColor(agentName);
  const sorted = [...tasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        padding: '4px 8px',
        background: `${color}12`,
        borderLeft: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <span style={{ fontSize: 11 }}>{getAgentEmoji(agentName)}</span>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          fontWeight: 700,
          color,
          letterSpacing: '0.08em',
        }}>
          {agentName.toUpperCase()}
        </span>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 9,
          color: 'var(--gray-blue)',
          marginLeft: 'auto',
        }}>
          {tasks.length} tasks
        </span>
      </div>
      {sorted.map((task) => (
        <TaskRow
          key={task._id}
          task={task}
          expanded={expandedId === task._id}
          onToggle={() => onToggle(task._id)}
        />
      ))}
    </div>
  );
}

export default function TaskQueue({
  selectedAgent,
}: {
  selectedAgent: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tasks = useQuery(api.tasks.active);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const activeTasks = (tasks || []).filter((t) => !['done', 'dropped'].includes(t.status));

  // Filter by selected agent if set
  const displayTasks = selectedAgent
    ? activeTasks.filter((t) => t.assignedTo?.toLowerCase() === selectedAgent.toLowerCase())
    : activeTasks;

  // Group by agent
  const unassigned = displayTasks.filter((t) => !t.assignedTo);
  const byAgent: Record<string, Task[]> = {};
  for (const t of displayTasks.filter((t) => t.assignedTo)) {
    const key = (t.assignedTo || '').toLowerCase();
    if (!byAgent[key]) byAgent[key] = [];
    byAgent[key].push(t as Task);
  }

  const blockedCount = displayTasks.filter((t) => t.status === 'blocked').length;

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>☰</span>
        <span>TASK QUEUE</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>タスク</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 9,
          color: 'var(--gray-blue)',
        }}>
          {displayTasks.length} active
          {blockedCount > 0 && (
            <span style={{ color: '#E84D3D', marginLeft: 4 }}>/ {blockedCount} blocked</span>
          )}
        </span>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {tasks === undefined && (
          <div style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--gray-blue)' }}>
            Loading...
          </div>
        )}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div style={{
              padding: '4px 8px',
              background: 'rgba(139,157,195,0.1)',
              borderLeft: '3px solid var(--gray-blue)',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gray-blue)',
              letterSpacing: '0.08em',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
              UNASSIGNED · {unassigned.length}
            </div>
            {unassigned
              .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
              .map((task) => (
                <TaskRow
                  key={task._id}
                  task={task as Task}
                  expanded={expandedId === task._id}
                  onToggle={() => toggleExpand(task._id)}
                />
              ))}
          </div>
        )}

        {/* By agent */}
        {AGENT_NAMES.map((name) => {
          const agentTasks = byAgent[name] || [];
          if (agentTasks.length === 0) return null;
          return (
            <AgentSection
              key={name}
              agentName={name}
              tasks={agentTasks}
              expandedId={expandedId}
              onToggle={toggleExpand}
            />
          );
        })}

        {displayTasks.length === 0 && tasks !== undefined && (
          <div style={{ padding: 10, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--gray-blue)' }}>
            {selectedAgent ? `No active tasks for ${selectedAgent}.` : 'No active tasks.'}
          </div>
        )}
      </div>
    </div>
  );
}
