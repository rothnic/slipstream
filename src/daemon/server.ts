#!/usr/bin/env node

/**
 * Slipstream Daemon Server
 * Runs in the background and maintains an active OpenCode session
 */

import { homedir } from 'os';
import { join } from 'path';
import fsExtra from 'fs-extra';
import { DEFAULT_CONFIG, UserConfigSchema } from '../config/schema.js';
import { writeDaemonState, clearDaemonState } from '../utils/process.js';
import { findAvailablePort } from '../utils/ipc.js';
import { SessionManager } from './session.js';

const { mkdir, readFile } = fsExtra;

const CONFIG_DIR = join(homedir(), '.config', 'slipstream');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Load user configuration
 */
async function loadConfig() {
  try {
    await mkdir(CONFIG_DIR, { recursive: true });
    const content = await readFile(CONFIG_FILE, 'utf-8');
    const data = JSON.parse(content);
    return UserConfigSchema.parse(data);
  } catch (err) {
    // Use defaults if config doesn't exist or is invalid
    return DEFAULT_CONFIG;
  }
}

/**
 * Main daemon function
 */
async function main() {
  try {
    console.log('[Daemon] Starting Slipstream daemon...');
    
    // Load configuration
    const config = await loadConfig();
    console.log('[Daemon] Configuration loaded');
    
    // Find available port
    const port = await findAvailablePort(config.daemon.port);
    console.log(`[Daemon] Using port ${port}`);
    
    // Initialize session manager
    const sessionManager = new SessionManager(config.daemon.idleTimeout);
    const session = sessionManager.createSession();
    console.log(`[Daemon] Session created: ${session.id}`);
    
    // Write daemon state
    await writeDaemonState({
      pid: process.pid,
      port,
      sessionId: session.id,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
    console.log('[Daemon] State file written');
    
    // Setup idle timeout handler
    sessionManager.onIdle(async () => {
      console.log('[Daemon] Idle timeout reached, shutting down...');
      await shutdown(sessionManager);
    });
    
    // Setup graceful shutdown handlers
    process.on('SIGTERM', async () => {
      console.log('[Daemon] SIGTERM received, shutting down...');
      await shutdown(sessionManager);
    });
    
    process.on('SIGINT', async () => {
      console.log('[Daemon] SIGINT received, shutting down...');
      await shutdown(sessionManager);
    });
    
    console.log('[Daemon] Daemon is ready and waiting for connections');
    console.log(`[Daemon] PID: ${process.pid}`);
    
    // Note: In a full implementation, this would initialize the OpenCode server
    // and handle incoming connections. For now, we just keep the process alive.
    // 
    // Example OpenCode integration (pseudocode):
    // const opencode = await initializeOpenCode({
    //   port,
    //   tools: getEnabledTools(config.tools),
    //   model: config.model,
    // });
    
    // Keep process alive
    await new Promise(() => {}); // Never resolves, keeps daemon running
    
  } catch (err) {
    console.error('[Daemon] Fatal error:', err);
    await clearDaemonState();
    process.exit(1);
  }
}

/**
 * Shutdown the daemon gracefully
 */
async function shutdown(sessionManager: SessionManager) {
  sessionManager.destroy();
  await clearDaemonState();
  console.log('[Daemon] Shutdown complete');
  process.exit(0);
}

// Start the daemon
main();
