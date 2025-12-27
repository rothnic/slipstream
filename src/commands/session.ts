/**
 * Session management commands
 * List, attach, rename sessions
 */

import { spawnSync } from 'child_process';
import { choose } from '../ui/interactive';

export interface SessionInfo {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * List all slipstream sessions
 */
export async function listSessions(limit = 20): Promise<SessionInfo[]> {
  const result = spawnSync('opencode', ['session', 'list', '-n', String(limit), '--format', 'json'], {
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    return [];
  }

  try {
    const sessions = JSON.parse(result.stdout) as SessionInfo[];
    return sessions.filter((s) => s.id.startsWith('slip-'));
  } catch {
    return [];
  }
}

/**
 * Get display name for a session
 */
export function getSessionDisplayName(session: SessionInfo): string {
  const tty = session.id.replace('slip-_dev_', '').replace('slip-', '');
  const title = session.title || '(untitled)';
  return `${tty.padEnd(12)} ${title}`;
}

/**
 * Attach to a session (opens TUI)
 */
export function attachSession(sessionId: string): void {
  const id = sessionId.startsWith('slip-') ? sessionId : `slip-_dev_${sessionId}`;
  spawnSync('opencode', ['--session', id], {
    stdio: 'inherit',
  });
}

/**
 * Interactively select a session
 */
export async function selectSession(): Promise<string | null> {
  const sessions = await listSessions();
  
  if (sessions.length === 0) {
    console.log('No slipstream sessions found');
    return null;
  }

  const options = sessions.map(getSessionDisplayName);
  const selected = await choose(options, 'Select a session:');
  
  if (!selected) return null;
  
  const idx = options.indexOf(selected);
  return sessions[idx]?.id || null;
}
