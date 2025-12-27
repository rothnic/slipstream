/**
 * Session management
 * Handles TTY-based session ID generation for terminal tab binding
 */

import { spawn } from 'child_process';

/**
 * Generate a session ID from a TTY path
 * Replaces slashes with underscores for safe session naming
 * @param tty TTY path (e.g., /dev/ttys001)
 */
export function getSessionIdFromTty(tty: string | undefined): string {
  if (!tty || tty.trim() === '') {
    return `slip-pid-${process.pid}`;
  }
  // Replace slashes with underscores
  const sanitized = tty.trim().replace(/\//g, '_');
  return `slip-${sanitized}`;
}

/**
 * Get the current TTY path
 * Uses the `tty` command to get the actual TTY
 */
async function getCurrentTty(): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn('tty', [], { stdio: ['inherit', 'pipe', 'pipe'] });
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', () => {
      resolve(output.trim());
    });

    proc.on('error', () => {
      resolve('');
    });
  });
}

/**
 * Get the session ID for the current terminal
 * Uses TTY to bind sessions to terminal tabs
 */
export async function getSessionId(): Promise<string> {
  const tty = await getCurrentTty();
  return getSessionIdFromTty(tty);
}
