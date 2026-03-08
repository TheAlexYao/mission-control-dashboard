"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { relativeTime, getAgentEmoji, getAgentColor } from "@/lib/utils";

const AGENT_ARCHETYPES: Record<string, { emoji: string; model: string }> = {
  aineko: { emoji: '🐱', model: 'claude-opus-4-6' },
  builder: { emoji: '🔨', model: 'gpt-5.4' },
  scout: { emoji: '🎯', model: 'claude-sonnet-4-6' },
  writer: { emoji: '✍️', model: 'claude-opus-4-6' },
  deployer: { emoji: '🚀', model: 'claude-sonnet-4-6' },
};

function getStatusLabel(status: string, lastSeen: number): string {
  const fiveMin = Date.now() - 5 * 60 * 1000;
  if (status === 'active' && lastSeen > fiveMin) return 'ACTIVE NOW';
  if (status === 'busy') return 'WORKING';
  if (status === 'idle') return 'IDLE';
  if (status === 'offline') return 'OFFLINE';
  if (status === 'active' && lastSeen < fiveMin) return 'STALE';
  return status.toUpperCase();
}

function getStatusDotClass(status: string, lastSeen: number): string {
  const oneHour = Date.now() - 60 * 60 * 1000;
  if (status === 'active' && lastSeen > oneHour) return 'status-active';
  if (status === 'busy') return 'status-busy';
  if (status === 'idle') return 'status-idle';
  if (status === 'active' && lastSeen < oneHour) return 'status-error';
  return 'status-offline';
}

type AgentCardProps = {
  agent: {
    _id: string;
    name: string;
    archetype: string;
    status: string;
    currentFocus?: string;
    lastSeen: number;
    config?: { model?: string };
  };
  isSelected: boolean;
  taskCount: number;
  onSelect: () => void;
  recentFile?: string;
};

function AgentCard({ agent, isSelected, taskCount, onSelect, recentFile }: AgentCardProps) {
  const key = agent.name.toLowerCase();
  const info = AGENT_ARCHETYPES[key] || { emoji: '🤖', model: agent.config?.model || 'unknown' };
  const color = getAgentColor(agent.name);
  const isStale = agent.status === 'active' && agent.lastSeen < Date.now() - 60 * 60 * 1000;

  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1,
        minWidth: 0,
        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
        borderTop: `3px solid ${color}`,
        background: isSelected ? `${color}08` : 'var(--cream-dark)',
        padding: '10px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        outline: isStale ? `1px solid #D4A843` : 'none',
        outlineOffset: -2,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{info.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--navy-text)',
          }}>
            {agent.name.toUpperCase()}
          </div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 8,
            color: 'var(--gray-blue)',
          }}>
            {info.model}
          </div>
        </div>
        {taskCount > 0 && (
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 9,
            background: color,
            color: '#F5F0E8',
            padding: '1px 4px',
          }}>
            {taskCount}
          </span>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <div
          className={getStatusDotClass(agent.status, agent.lastSeen)}
          style={{ width: 7, height: 7, borderRadius: '50%' }}
        />
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 9,
          color: isStale ? '#D4A843' : 'var(--gray-blue)',
          letterSpacing: '0.08em',
        }}>
          {getStatusLabel(agent.status, agent.lastSeen)}
        </span>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
          color: 'var(--gray-blue)',
          marginLeft: 'auto',
          opacity: 0.7,
        }}>
          {relativeTime(agent.lastSeen)}
        </span>
      </div>

      {/* Current focus */}
      {agent.currentFocus && (
        <div style={{
          fontSize: 9,
          color: 'var(--navy)',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 4,
          fontStyle: 'italic',
        }}>
          {agent.currentFocus}
        </div>
      )}

      {/* Recent artifact */}
      {recentFile && (
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
          color: 'var(--gray-blue)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          borderTop: '1px solid var(--border)',
          paddingTop: 4,
          marginTop: 2,
        }}>
          📄 {recentFile}
        </div>
      )}
    </div>
  );
}

export default function AgentGrid({
  selectedAgent,
  onAgentSelect,
}: {
  selectedAgent: string | null;
  onAgentSelect: (name: string | null) => void;
}) {
  const agents = useQuery(api.agents.list);
  const allTasks = useQuery(api.tasks.active);
  const activities = useQuery(api.activities.recent, { limit: 20 });

  if (!agents) {
    return (
      <div style={{ display: 'flex', gap: 6, height: '100%' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: 1, background: 'var(--cream-dark)', border: '1px solid var(--border)' }} />
        ))}
      </div>
    );
  }

  // Ensure all 5 archetypes shown even if not in DB
  const agentNames = ['aineko', 'builder', 'scout', 'writer', 'deployer'];
  const agentMap = Object.fromEntries((agents || []).map((a) => [a.name.toLowerCase(), a]));

  const displayAgents = agentNames.map((name) => {
    if (agentMap[name]) return agentMap[name];
    // Placeholder
    return {
      _id: `placeholder-${name}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      archetype: name,
      status: 'offline',
      lastSeen: 0,
      currentFocus: undefined,
    };
  });

  const getTaskCount = (agentName: string) => {
    return (allTasks || []).filter((t) => t.assignedTo?.toLowerCase() === agentName.toLowerCase()).length;
  };

  const getRecentFile = (agentName: string): string | undefined => {
    const act = (activities || []).find((a) => a.agent.toLowerCase() === agentName.toLowerCase());
    if (!act) return undefined;
    const match = act.metadata && typeof act.metadata === 'object' && (act.metadata as Record<string, string>).file;
    if (match) return match as string;
    return undefined;
  };

  return (
    <div style={{ display: 'flex', gap: 6, height: '100%' }}>
      {displayAgents.map((agent) => {
        const nameKey = agent.name.toLowerCase();
        return (
          <AgentCard
            key={agent._id}
            agent={agent as AgentCardProps['agent']}
            isSelected={selectedAgent === agent.name}
            taskCount={getTaskCount(agent.name)}
            onSelect={() => {
              onAgentSelect(selectedAgent === agent.name ? null : agent.name);
            }}
            recentFile={getRecentFile(agent.name)}
          />
        );
      })}
    </div>
  );
}
