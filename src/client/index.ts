#!/usr/bin/env node

/**
 * Slipstream Client
 * CLI wrapper that connects to the background daemon
 */

import { program } from 'commander';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fsExtra from 'fs-extra';
import { UI } from './ui.js';
import {
  getDaemonState,
  isDaemonHealthy,
  spawnDaemon,
  waitForDaemon,
  stopDaemon,
} from '../utils/process.js';
import { DEFAULT_CONFIG, UserConfigSchema } from '../config/schema.js';

const { readFile } = fsExtra;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_DIR = join(homedir(), '.config', 'slipstream');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Load user configuration
 */
async function loadConfig() {
  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    const data = JSON.parse(content);
    return UserConfigSchema.parse(data);
  } catch (err) {
    return DEFAULT_CONFIG;
  }
}

/**
 * Ensure daemon is running
 */
async function ensureDaemon(ui: UI): Promise<void> {
  ui.debug('Checking daemon health...');
  
  const isHealthy = await isDaemonHealthy();
  
  if (isHealthy) {
    ui.debug('Daemon is already running');
    return;
  }
  
  // Daemon is not running, need to start it
  ui.startSpinner('Starting daemon...');
  
  // Path to daemon script
  const daemonPath = join(__dirname, '..', 'daemon', 'server.js');
  ui.debug(`Daemon path: ${daemonPath}`);
  
  try {
    await spawnDaemon(daemonPath);
    ui.updateSpinner('Waiting for daemon to be ready...');
    
    const state = await waitForDaemon(10000);
    
    if (!state) {
      ui.failSpinner('Failed to start daemon');
      throw new Error('Daemon did not start within timeout period');
    }
    
    ui.succeedSpinner(`Daemon started (PID: ${state.pid})`);
  } catch (err) {
    ui.failSpinner('Failed to start daemon');
    throw err;
  }
}

/**
 * Execute a command via the daemon
 */
async function executeCommand(prompt: string, newSession: boolean, ui: UI): Promise<void> {
  try {
    // Ensure daemon is running
    await ensureDaemon(ui);
    
    // Get daemon state
    const state = await getDaemonState();
    if (!state) {
      throw new Error('Could not get daemon state');
    }
    
    ui.debug(`Connected to daemon on port ${state.port}`);
    
    // Determine session ID
    const sessionId = newSession ? undefined : state.sessionId;
    if (newSession) {
      ui.info('Starting new session');
    } else {
      ui.debug(`Using session: ${sessionId}`);
    }
    
    // Display the prompt
    ui.header('Executing Command');
    ui.info(`Prompt: ${ui.command(prompt)}`);
    ui.newline();
    
    // Note: In a full implementation, this would connect to the OpenCode daemon
    // and stream the response. For now, we just show a placeholder.
    //
    // Example OpenCode integration (pseudocode):
    // const connection = await connectToOpenCode(state.port, sessionId);
    // const stream = connection.execute(prompt);
    // 
    // for await (const chunk of stream) {
    //   ui.streamLine(chunk);
    // }
    
    ui.startSpinner('Executing via OpenCode...');
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ui.succeedSpinner('Command executed successfully');
    ui.newline();
    ui.info('Note: Full OpenCode integration pending');
    
  } catch (err) {
    ui.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

/**
 * Stop the daemon
 */
async function handleStop(ui: UI): Promise<void> {
  try {
    ui.startSpinner('Stopping daemon...');
    
    const stopped = await stopDaemon();
    
    if (stopped) {
      ui.succeedSpinner('Daemon stopped successfully');
    } else {
      ui.infoSpinner('Daemon was not running');
    }
  } catch (err) {
    ui.failSpinner('Failed to stop daemon');
    ui.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

/**
 * Show daemon status
 */
async function handleStatus(ui: UI): Promise<void> {
  try {
    const state = await getDaemonState();
    
    if (!state) {
      ui.info('Daemon is not running');
      return;
    }
    
    const isHealthy = await isDaemonHealthy();
    
    ui.header('Daemon Status');
    ui.info(`PID: ${state.pid}`);
    ui.info(`Port: ${state.port}`);
    ui.info(`Session: ${state.sessionId}`);
    ui.info(`Started: ${state.startedAt}`);
    ui.info(`Last Active: ${state.lastActiveAt}`);
    ui.info(`Health: ${isHealthy ? '✓ Running' : '✗ Not responding'}`);
  } catch (err) {
    ui.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

/**
 * Main CLI function
 */
async function main() {
  const config = await loadConfig();
  const ui = new UI(config.ui.verbose, config.ui.colorEnabled);
  
  program
    .name('slip')
    .description('Slipstream - Persistent CLI wrapper for OpenCode AI')
    .version('0.1.0');
  
  program
    .command('run <prompt>')
    .description('Execute a command via OpenCode')
    .option('-n, --new', 'Start a new session instead of resuming')
    .action(async (prompt: string, options: { new?: boolean }) => {
      await executeCommand(prompt, options.new || false, ui);
    });
  
  program
    .command('stop')
    .description('Stop the background daemon')
    .action(async () => {
      await handleStop(ui);
    });
  
  program
    .command('status')
    .description('Show daemon status')
    .action(async () => {
      await handleStatus(ui);
    });
  
  // Default action: run command
  program
    .argument('[prompt...]', 'Command to execute')
    .option('-n, --new', 'Start a new session instead of resuming')
    .action(async (promptParts: string[], options: { new?: boolean }) => {
      if (promptParts.length > 0) {
        const prompt = promptParts.join(' ');
        await executeCommand(prompt, options.new || false, ui);
      } else {
        program.help();
      }
    });
  
  program.parse();
}

main();
