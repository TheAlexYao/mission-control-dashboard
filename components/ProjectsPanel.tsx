"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { relativeTime } from "@/lib/utils";

const PROJECTS = ['mission-control', 'anuncio-pyg', 'agent-j', 'flaura', 'consulting'];

type ProjectData = {
  project: string;
  active: number;
  blocked: number;
  done: number;
  inProgress: number;
  total: number;
  tasks: Array<{
    _id: string;
    title: string;
    status: string;
    priority: string;
    assignedTo?: string;
    _creationTime: number;
    notes?: string;
  }>;
};

export default function ProjectsPanel() {
  const projectData = useQuery(api.tasks.byProject);
  const activities = useQuery(api.activities.recent, { limit: 50 });

  const getProjectData = (name: string): ProjectData | null => {
    if (!projectData) return null;
    return (projectData as ProjectData[]).find((p) => p.project === name) || null;
  };

  const getLastActivity = (project: string) => {
    if (!activities) return null;
    return activities.find((a) => a.project === project);
  };

  const getHealth = (data: ProjectData | null): 'green' | 'amber' | 'red' => {
    if (!data) return 'amber';
    if (data.blocked > 0) return 'red';
    const lastActivity = getLastActivity(data.project);
    if (lastActivity) {
      const age = Date.now() - lastActivity._creationTime;
      if (age > 3 * 24 * 60 * 60 * 1000) return 'amber';
    }
    return 'green';
  };

  const healthColor = { green: '#5B8C5A', amber: '#D4A843', red: '#E84D3D' };

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>◈</span>
        <span>PROJECTS</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>プロジェクト</span>
      </div>
      <div className="panel-body" style={{ padding: '6px 0' }}>
        {PROJECTS.map((project) => {
          const data = getProjectData(project);
          const lastActivity = getLastActivity(project);
          const health = getHealth(data);
          const nextTask = data?.tasks
            .filter((t) => !['done', 'dropped'].includes(t.status))
            .sort((a, b) => {
              const pri = { critical: 0, high: 1, medium: 2, low: 3 };
              return (pri[a.priority as keyof typeof pri] ?? 2) - (pri[b.priority as keyof typeof pri] ?? 2);
            })[0];

          return (
            <div
              key={project}
              style={{
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                borderLeft: `3px solid ${healthColor[health]}`,
              }}
            >
              {/* Project name + health */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: healthColor[health],
                    flexShrink: 0,
                  }}
                />
                <span style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--navy-text)',
                  flex: 1,
                }}>
                  {project}
                </span>
                {lastActivity && (
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 9,
                    color: 'var(--gray-blue)',
                  }}>
                    {relativeTime(lastActivity._creationTime)}
                  </span>
                )}
              </div>

              {/* Task counts */}
              {data ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                  <TaskCount label="active" count={data.inProgress} color="var(--navy-light)" />
                  <TaskCount label="todo" count={data.active} color="var(--gray-blue)" />
                  {data.blocked > 0 && <TaskCount label="blocked" count={data.blocked} color="#E84D3D" />}
                  <TaskCount label="done" count={data.done} color="var(--green)" />
                </div>
              ) : (
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--gray-blue)', marginBottom: 3 }}>
                  no tasks
                </div>
              )}

              {/* Last activity */}
              {lastActivity && (
                <div style={{
                  fontSize: 9,
                  color: 'var(--gray-blue)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: nextTask ? 2 : 0,
                }}>
                  ↳ {lastActivity.summary}
                </div>
              )}

              {/* Next action */}
              {nextTask && (
                <div style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 9,
                  color: 'var(--navy)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  → {nextTask.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCount({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null;
  return (
    <span style={{
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 9,
      color,
    }}>
      {count} {label}
    </span>
  );
}
