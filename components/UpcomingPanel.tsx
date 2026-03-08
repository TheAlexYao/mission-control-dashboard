"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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

function formatTimeOnly(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const asuFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const eventDay = asuFormatter.format(d);
  const today = asuFormatter.format(now);
  const tomorrow = asuFormatter.format(new Date(now.getTime() + 86400000));

  if (eventDay === today) return 'TODAY';
  if (eventDay === tomorrow) return 'TOMORROW';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d).toUpperCase();
}

export default function UpcomingPanel() {
  const calendarEvents = useQuery(api.calendar.upcoming, { hoursAhead: 48 });
  const dueTasks = useQuery(api.tasks.dueWithin, { hours: 48 });
  const leads = useQuery(api.leads.list, {});

  const now = new Date();
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Calendar events
  const calItems = (calendarEvents || []).map((e) => ({
    time: e.startTime,
    endTime: e.endTime,
    title: e.title,
    type: 'meeting' as const,
    notes: e.prepNotes,
    attendees: e.attendees?.filter(a => !a.self).length || 0,
    meetLink: e.meetLink,
    location: e.location,
  }));

  // Lead action dates
  const upcomingLeadActions = (leads || [])
    .filter((l) => {
      if (!l.nextActionDate) return false;
      const d = new Date(l.nextActionDate);
      return d >= now && d <= cutoff;
    })
    .map((l) => ({
      time: l.nextActionDate!,
      endTime: undefined as string | undefined,
      title: `${l.name}${l.company ? ` — ${l.company}` : ''}`,
      type: 'call' as const,
      notes: l.nextAction,
      attendees: 0,
      meetLink: undefined as string | undefined,
      location: undefined as string | undefined,
    }));

  // Task deadlines
  const taskItems = (dueTasks || []).map((t) => ({
    time: t.dueDate!,
    endTime: undefined as string | undefined,
    title: t.title,
    type: 'deadline' as const,
    notes: t.notes,
    attendees: 0,
    meetLink: undefined as string | undefined,
    location: undefined as string | undefined,
  }));

  const allItems = [...calItems, ...taskItems, ...upcomingLeadActions].sort((a, b) =>
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // Group by day
  const grouped: Record<string, typeof allItems> = {};
  for (const item of allItems) {
    const day = getDayLabel(item.time);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  }

  const typeColors: Record<string, string> = {
    meeting: '#5B8C5A',
    call: '#3D5A80',
    deadline: '#E84D3D',
    task: '#D4A843',
  };

  const typeIcons: Record<string, string> = {
    meeting: '📅',
    call: '📞',
    deadline: '⏰',
    task: '📋',
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
        {allItems.length === 0 && (
          <div style={{
            padding: '16px 10px',
            color: 'var(--gray-blue)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
          }}>
            Nothing in next 48h.
          </div>
        )}

        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div style={{
              padding: '6px 10px 3px',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              fontWeight: 700,
              color: day === 'TODAY' ? 'var(--red)' : 'var(--gray-blue)',
              letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border)',
            }}>
              {day}
            </div>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '7px 10px',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: `2px solid ${typeColors[item.type] || 'var(--navy)'}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 2,
                }}>
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--navy)',
                  }}>
                    {formatTimeOnly(item.time)}
                    {item.endTime ? `–${formatTimeOnly(item.endTime)}` : ''}
                  </span>
                  {item.meetLink && (
                    <span style={{ fontSize: 9, opacity: 0.6 }}>📹</span>
                  )}
                  {item.attendees > 0 && (
                    <span style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: 8,
                      color: 'var(--gray-blue)',
                    }}>
                      +{item.attendees}
                    </span>
                  )}
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
                {item.notes && (
                  <div style={{
                    fontSize: 9,
                    color: 'var(--gray-blue)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                  }}>
                    {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
