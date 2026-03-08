"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { relativeTime } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  idea: '#3D5A80',
  braindump: '#5B8C5A',
  question: '#D4A843',
  content_seed: '#E84D3D',
  call_extraction: '#8B9DC3',
};

export default function ThinkAboutPanel() {
  const items = useQuery(api.inbox.flagged);
  const readings = useQuery(api.readings.list, { status: "saved", limit: 5 });

  const thinkItems = [
    ...(items || []).slice(0, 6).map((item) => ({
      id: item._id,
      title: item.title,
      reason: item.body.slice(0, 120),
      source: item.sourceType || item.type,
      type: item.type,
      age: item._creationTime,
    })),
    ...(readings || []).slice(0, 3).map((r) => ({
      id: r._id,
      title: r.title,
      reason: r.summary || r.content?.slice(0, 120) || '',
      source: r.sourceType,
      type: 'reading',
      age: r._creationTime,
    })),
  ].slice(0, 8);

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>◉</span>
        <span>THINK ABOUT</span>
        <span className="noto" style={{ fontSize: 9, color: 'var(--gray-blue)' }}>// 考える</span>
        {thinkItems.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 9,
            color: 'var(--gray-blue)',
          }}>
            {thinkItems.length} items
          </span>
        )}
      </div>

      {/* Horizontal scrolling cards */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 8,
          padding: '8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          alignItems: 'stretch',
        }}
      >
        {thinkItems.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--gray-blue)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
          }}>
            No flagged items. Inbox is clean.
          </div>
        )}

        {thinkItems.map((item) => (
          <div
            key={item.id}
            style={{
              minWidth: 240,
              maxWidth: 280,
              background: 'rgba(43, 58, 103, 0.04)',
              border: '1px solid var(--border)',
              borderTop: `2px solid ${TYPE_COLORS[item.type] || 'var(--navy)'}`,
              padding: '8px 10px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {/* Type + age */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tag" style={{ borderColor: TYPE_COLORS[item.type] || 'var(--border-strong)', color: TYPE_COLORS[item.type] || 'var(--navy)' }}>
                {item.source || item.type}
              </span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 9,
                color: 'var(--gray-blue)',
              }}>
                {relativeTime(item.age)}
              </span>
            </div>

            {/* Title */}
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--navy-text)',
              lineHeight: 1.4,
              flex: 1,
            }}>
              {item.title}
            </div>

            {/* Reason */}
            {item.reason && (
              <div style={{
                fontSize: 9,
                color: 'var(--gray-blue)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              } as React.CSSProperties}>
                {item.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
