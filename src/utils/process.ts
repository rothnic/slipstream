import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import fsExtra from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';
import { DaemonState, DaemonStateSchema } from '../config/schema.js';

const { readFile, writeFile, unlink, mkdir } = fsExtra;

const CONFIG_DIR = join(homedir(), '.config', 'slipstream');
const DAEMON_STATE_FILE = join(CONFIG_DIR, 'daemon.json');

/**
 * Check if a process with the given PID is running
 */
export function isProcessRunning(pid: number): boolean {
  try {
    // Sending signal 0 doesn't actually send a signal,
    // but checks if we can send a signal (i.e., if process exists)
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Get the daemon state from the state file
 */
export async function getDaemonState(): Promise<DaemonState | null> {
  try {
    if (!existsSync(DAEMON_STATE_FILE)) {
      return null;
    }
    
    const content = await readFile(DAEMON_STATE_FILE, 'utf-8');
    const data = JSON.parse(content);
    return DaemonStateSchema.parse(data);
  } catch (err) {
    // Invalid or corrupted state file
    return null;
  }
}

/**
 * Write daemon state to the state file
 */
export async function writeDaemonState(state: DaemonState): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(DAEMON_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Remove daemon state file
 */
export async function clearDaemonState(): Promise<void> {
  try {
    if (existsSync(DAEMON_STATE_FILE)) {
      await unlink(DAEMON_STATE_FILE);
    }
  } catch (err) {
    // Ignore errors when clearing state
  }
}

/**
 * Check if daemon is healthy (running and responsive)
 */
export async function isDaemonHealthy(): Promise<boolean> {
  const state = await getDaemonState();
  if (!state) return false;
  
  return isProcessRunning(state.pid);
}

/**
 * Spawn the daemon process in detached mode
 */
export async function spawnDaemon(daemonScriptPath: string): Promise<ChildProcess> {
  // Clear any stale state before spawning
  await clearDaemonState();
  
  const child = spawn(process.execPath, [daemonScriptPath], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  });
  
  // Unreference so parent can exit
  child.unref();
  
  return child;
}

/**
 * Stop the daemon process
 */
export async function stopDaemon(): Promise<boolean> {
  const state = await getDaemonState();
  if (!state) return false;
  
  try {
    if (isProcessRunning(state.pid)) {
      process.kill(state.pid, 'SIGTERM');
      await clearDaemonState();
      return true;
    }
  } catch (err) {
    // Process might already be dead
  }
  
  await clearDaemonState();
  return false;
}

/**
 * Wait for daemon to be ready (state file written)
 */
export async function waitForDaemon(timeoutMs: number = 10000): Promise<DaemonState | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const state = await getDaemonState();
    if (state && isProcessRunning(state.pid)) {
      return state;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return null;
}
