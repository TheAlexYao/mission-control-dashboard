"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatTime } from "@/lib/utils";

const ASU_TZ = 'America/Asuncion';

function formatUpcomingTime(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export default function UpcomingPanel() {
  const dueTasks = useQuery(api.tasks.dueWithin, { hours: 48 });
  const leads = useQuery(api.leads.list, {});

  const now = new Date();
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Upcoming lead action dates
  const upcomingLeadActions = (leads || [])
    .filter((l) => {
      if (!l.nextActionDate) return false;
      const d = new Date(l.nextActionDate);
      return d >= now && d <= cutoff;
    })
    .map((l) => ({
      time: l.nextActionDate!,
      title: `${l.name}${l.company ? ` — ${l.company}` : ''}`,
      type: 'call' as const,
      notes: l.nextAction,
    }));

  const taskItems = (dueTasks || []).map((t) => ({
    time: t.dueDate!,
    title: t.title,
    type: 'deadline' as const,
    notes: t.notes,
  }));

  const allItems = [...taskItems, ...upcomingLeadActions].sort((a, b) =>
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const typeColors: Record<string, string> = {
    call: '#3D5A80',
    meeting: '#5B8C5A',
    deadline: '#E84D3D',
    task: '#D4A843',
  };

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>📅</span>
        <span>UPCOMING</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>予定</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 9,
          color: 'var(--gray-blue)',
        }}>
          NEXT 48H
        </span>
      </div>
      <div className="panel-body" style={{ padding: '6px 0' }}>
        {/* Calendar placeholder */}
        <div style={{
          padding: '6px 10px',
          borderBottom: '1px solid var(--border)',
          opacity: 0.5,
        }}>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 9,
            color: 'var(--gray-blue)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>📡</span>
            <span>Calendar not connected</span>
          </div>
        </div>

        {allItems.length === 0 && (
          <div style={{
            padding: '16px 10px',
            color: 'var(--gray-blue)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
          }}>
            Nothing due in next 48h.
          </div>
        )}

        {allItems.map((item, i) => (
          <div
            key={i}
            style={{
              padding: '7px 10px',
              borderBottom: '1px solid var(--border)',
              borderLeft: `2px solid ${typeColors[item.type] || 'var(--navy)'}`,
            }}
          >
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--navy)',
              marginBottom: 2,
            }}>
              {formatUpcomingTime(item.time)}
            </div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--navy-text)',
              lineHeight: 1.3,
              marginBottom: 2,
            }}>
              {item.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="tag"
                style={{ borderColor: typeColors[item.type], color: typeColors[item.type] }}
              >
                {item.type}
              </span>
              {item.notes && (
                <span style={{
                  fontSize: 9,
                  color: 'var(--gray-blue)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
