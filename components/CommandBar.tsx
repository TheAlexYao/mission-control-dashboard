"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function getASUClock(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
  // formatted: "03/08/2026, 11:32:15"
  const parts = formatted.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+:\d+:\d+)/);
  if (!parts) return formatted;
  return `${parts[3]}.${parts[1]}.${parts[2]} — ${parts[4]} ASU`;
}

export default function CommandBar() {
  const [clock, setClock] = useState('');
  const pathname = usePathname();
  // Use a lightweight query to check connectivity - if it resolves, we're connected
  const agents = useQuery(api.agents.list);
  const isConnected = agents !== undefined;

  useEffect(() => {
    setClock(getASUClock());
    const interval = setInterval(() => {
      setClock(getASUClock());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: 40,
        background: 'var(--navy)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 0,
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* Left: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
        <span
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12,
            fontWeight: 700,
            color: '#F5F0E8',
            letterSpacing: '0.15em',
          }}
        >
          AINEKO
        </span>
        <span
          style={{
            fontFamily: 'Noto Sans JP, sans-serif',
            fontSize: 11,
            color: 'rgba(245, 240, 232, 0.5)',
            letterSpacing: '0.05em',
          }}
        >
          愛猫
        </span>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'rgba(245, 240, 232, 0.15)',
            marginLeft: 4,
          }}
        />
      </div>

      {/* Center: Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
        <NavTab
          href="/"
          label="MISSION"
          kanji="任務"
          active={pathname === '/'}
        />
        <NavTab
          href="/agents"
          label="AGENTS"
          kanji="隊"
          active={pathname === '/agents'}
        />
      </div>

      {/* Right: Clock + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 280, justifyContent: 'flex-end' }}>
        <span
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11,
            color: 'rgba(245, 240, 232, 0.8)',
            letterSpacing: '0.05em',
            tabularNums: 'tabular-nums',
          } as React.CSSProperties}
        >
          {clock}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isConnected ? '#5B8C5A' : '#E84D3D',
              boxShadow: isConnected
                ? '0 0 0 0 rgba(91, 140, 90, 0.5)'
                : '0 0 0 0 rgba(232, 77, 61, 0.5)',
              animation: isConnected
                ? 'pulse-green 2s ease-in-out infinite'
                : 'pulse-red 1s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              color: isConnected ? '#5B8C5A' : '#E84D3D',
              letterSpacing: '0.1em',
            }}
          >
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
    </div>
  );
}

function NavTab({
  href,
  label,
  kanji,
  active,
}: {
  href: string;
  label: string;
  kanji: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        color: active ? '#F5F0E8' : 'rgba(245, 240, 232, 0.4)',
        background: active ? 'rgba(245, 240, 232, 0.08)' : 'transparent',
        borderBottom: active ? '2px solid #E84D3D' : '2px solid transparent',
        textDecoration: 'none',
        transition: 'all 150ms ease',
        cursor: 'pointer',
      }}
    >
      {label}
      <span
        style={{
          fontFamily: 'Noto Sans JP, sans-serif',
          fontSize: 9,
          color: active ? 'rgba(245, 240, 232, 0.5)' : 'rgba(245, 240, 232, 0.2)',
        }}
      >
        {kanji}
      </span>
    </Link>
  );
}
