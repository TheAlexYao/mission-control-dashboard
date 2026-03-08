// ASU timezone = America/Asuncion (UTC-3 year-round... but actually ASU = Arizona = America/Phoenix UTC-7 no DST)
// The spec says UTC-3. Let's use America/Phoenix as placeholder, but display as "ASU"
// Actually UTC-3 = America/Argentina/Buenos_Aires or America/Asuncion
// The spec says ASU timezone (UTC-3) - let's use 'America/Asuncion' as specified in v2
const ASU_TZ = 'America/Asuncion';

export function formatASU(ts: number, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    ...opts,
  }).format(new Date(ts));
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts));
}

export function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(ts));
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatASU(ts, { month: 'short', day: 'numeric' });
}

export function relativeTimeShort(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

export function getASUClock(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ASU_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date()).replace(/(\d+)\/(\d+)\/(\d+),\s/, '$3.$1.$2 — ').replace(',', '');
}

export const AGENT_COLORS: Record<string, string> = {
  aineko: '#2B3A67',
  builder: '#3D5A80',
  scout: '#E84D3D',
  writer: '#D4A843',
  deployer: '#5B8C5A',
};

export const AGENT_EMOJIS: Record<string, string> = {
  aineko: '🐱',
  builder: '🔨',
  scout: '🎯',
  writer: '✍️',
  deployer: '🚀',
};

export function getAgentEmoji(name: string): string {
  const key = name.toLowerCase();
  return AGENT_EMOJIS[key] || '🤖';
}

export function getAgentColor(name: string): string {
  const key = name.toLowerCase();
  return AGENT_COLORS[key] || '#8B9DC3';
}

export function getPriorityArrow(priority: string): string {
  switch (priority) {
    case 'critical': return '⬆';
    case 'high': return '↑';
    case 'medium': return '→';
    case 'low': return '↓';
    default: return '→';
  }
}

export function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'critical': return 'pri-critical';
    case 'high': return 'pri-high';
    case 'medium': return 'pri-medium';
    case 'low': return 'pri-low';
    default: return 'pri-medium';
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case 'blocked': return '🔴';
    case 'todo': return '🟡';
    case 'in_progress': return '🔵';
    case 'done': return '🟢';
    case 'inbox': return '⚪';
    default: return '⚫';
  }
}

export const PROJECT_LIST = ['mission-control', 'anuncio-pyg', 'agent-j', 'flaura', 'consulting'];
