#!/usr/bin/env node
/**
 * Slipstream CLI
 * Terminal AI assistant powered by OpenCode
 */

import { run, command, positional, string, boolean, number } from '@drizzle-team/brocli';
import { homedir } from 'os';
import { join } from 'path';
import {
  checkHealth,
  isPortInUse,
  findAvailablePort,
  gracefulDispose,
  ServerState,
} from '../server/server';
import { getSessionId } from '../server/session';
import { spawn, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';

// Configuration
const DEFAULT_PORT = 4096;
const CONFIG_DIR = join(homedir(), '.config', 'opencode', 'slipstream');
const CACHE_DIR = join(CONFIG_DIR, 'cache');
const STATE_FILE = join(CACHE_DIR, 'server-state.json');

// Ensure cache directory exists
try {
  mkdirSync(CACHE_DIR, { recursive: true });
} catch {}

// --- State Management ---

function loadState(): ServerState | null {
  try {
    if (existsSync(STATE_FILE)) {
      const content = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(content) as ServerState;
    }
  } catch {}
  return null;
}

function saveState(state: ServerState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function clearState(): void {
  try {
    unlinkSync(STATE_FILE);
  } catch {}
}

// --- Server Management ---

async function ensureServer(preferredPort = DEFAULT_PORT): Promise<number> {
  // 1. Check existing state
  const state = loadState();
  if (state) {
    const health = await checkHealth(state.port);
    if (health.healthy) {
      console.log(`✓ Server healthy on port ${state.port} (v${health.version})`);
      return state.port;
    }
    console.log(`⚠ Stale server state, cleaning up...`);
    await gracefulDispose(state.port);
    clearState();
  }

  // 2. Check if something is on the preferred port
  const portInUse = await isPortInUse(preferredPort);
  if (portInUse) {
    const health = await checkHealth(preferredPort);
    if (health.healthy) {
      saveState({ port: preferredPort });
      return preferredPort;
    }
    console.log(`⚠ Port ${preferredPort} in use, finding alternative...`);
  }

  // 3. Find available port and start server
  const port = portInUse ? await findAvailablePort(preferredPort + 1) : preferredPort;
  console.log(`Starting server on port ${port}...`);

  const proc = spawn('opencode', ['serve', '--port', String(port)], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  // 4. Wait for server to become healthy
  const maxWait = 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const health = await checkHealth(port, 1000);
    if (health.healthy) {
      saveState({ port, pid: proc.pid, startedAt: new Date().toISOString() });
      console.log(`✓ Server ready on port ${port} (v${health.version})`);
      return port;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Server failed to start within ${maxWait}ms`);
}

async function forceKillServer(): Promise<void> {
  spawnSync('pkill', ['-f', 'opencode serve']);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// --- CLI Commands ---

const main = command({
  name: 'slip',
  desc: 'Terminal AI assistant powered by OpenCode',
  options: {
    prompt: positional().desc('Natural language prompt'),
    new: boolean('new').alias('n').desc('Start new session'),
    agent: string('agent').alias('a').default('slipstream').desc('Agent to use'),
    port: number('port').alias('p').default(DEFAULT_PORT).desc('Server port'),
    model: string('model').alias('m').desc('Model to use'),
  },
  transform: async (opts) => ({
    ...opts,
    session: opts.new ? undefined : await getSessionId(),
  }),
  handler: async ({ prompt, session, agent, port, model }) => {
    if (!prompt) {
      console.log('Usage: slip "your prompt here"');
      console.log('       slip --help');
      return;
    }

    const serverPort = await ensureServer(port);

    const args = ['opencode', 'run', '--attach', `http://localhost:${serverPort}`, '--agent', agent];
    if (session) args.push('--session', session);
    if (model) args.push('--model', model);
    args.push(prompt);

    spawnSync(args[0], args.slice(1), { stdio: 'inherit' });
  },
});

const serverStart = command({
  name: 'start',
  desc: 'Start the OpenCode server',
  options: {
    port: number('port').alias('p').default(DEFAULT_PORT),
  },
  handler: async ({ port }) => {
    await ensureServer(port);
  },
});

const serverStop = command({
  name: 'stop',
  desc: 'Stop the OpenCode server',
  handler: async () => {
    const state = loadState();
    if (state) {
      const disposed = await gracefulDispose(state.port);
      if (disposed) {
        console.log(`✓ Server on port ${state.port} stopped gracefully`);
      } else {
        await forceKillServer();
        console.log(`Server force-killed`);
      }
      clearState();
    } else {
      await forceKillServer();
      console.log(`No tracked server, killed any opencode serve processes`);
    }
  },
});

const serverStatus = command({
  name: 'status',
  desc: 'Check server status',
  handler: async () => {
    const state = loadState();
    if (!state) {
      console.log('No server tracked');
      return;
    }
    const health = await checkHealth(state.port);
    if (health.healthy) {
      console.log(`✓ Healthy on port ${state.port} (v${health.version})`);
      if (state.startedAt) console.log(`  Started: ${state.startedAt}`);
    } else {
      console.log(`✗ Server on port ${state.port} not responding`);
    }
  },
});

const serverRestart = command({
  name: 'restart',
  desc: 'Restart the OpenCode server',
  options: {
    port: number('port').alias('p').default(DEFAULT_PORT),
  },
  handler: async ({ port }) => {
    const state = loadState();
    if (state) {
      await gracefulDispose(state.port);
      clearState();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await ensureServer(port);
  },
});

const server = command({
  name: 'server',
  desc: 'Manage the OpenCode background server',
  subcommands: [serverStart, serverStop, serverStatus, serverRestart],
});

const learn = command({
  name: 'learn',
  desc: 'Trigger background learning from recent activity',
  handler: async () => {
    const session = await getSessionId();
    const port = await ensureServer();
    spawnSync(
      'opencode',
      [
        'run',
        '--attach',
        `http://localhost:${port}`,
        '--agent',
        'slipstream/learner',
        '--session',
        session,
        'analyze recent activity and update skills',
      ],
      { stdio: 'inherit' }
    );
  },
});

// Run CLI
run([main, server, learn], {
  version: '0.1.0',
});
