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
const TTY_SESSIONS_FILE = join(CACHE_DIR, 'tty-sessions.json');

// Known subcommands - if first arg is not one of these, treat as prompt
const KNOWN_COMMANDS = ['server', 'session', 'skill', 'model', 'learn', 'slip', '--help', '-h', '--version', '-v'];

// Preprocess args: if first arg isn't a known command/flag, insert 'slip' 
const args = process.argv.slice(2);
if (args.length > 0 && !KNOWN_COMMANDS.includes(args[0])) {
  process.argv.splice(2, 0, 'slip');
}

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

// --- TTY Session Mapping ---
// Maps TTY path -> OpenCode session ID for session-per-terminal-tab behavior

type TtySessions = Record<string, { sessionId: string; updatedAt: string }>;

function loadTtySessions(): TtySessions {
  try {
    if (existsSync(TTY_SESSIONS_FILE)) {
      return JSON.parse(readFileSync(TTY_SESSIONS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveTtySession(tty: string, sessionId: string): void {
  const sessions = loadTtySessions();
  sessions[tty] = { sessionId, updatedAt: new Date().toISOString() };
  writeFileSync(TTY_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function getTtySessionId(tty: string): string | null {
  const sessions = loadTtySessions();
  return sessions[tty]?.sessionId ?? null;
}

function getCurrentTty(): string {
  const result = spawnSync('tty', [], { encoding: 'utf-8' });
  return result.stdout?.trim() || '';
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
    model: string('model').alias('m').desc('Model to use'),
    verbose: boolean('verbose').desc('Show what slip is doing'),
    port: number('port').alias('p').default(DEFAULT_PORT).desc('Server port'),
  },
  handler: async ({ prompt, new: isNew, model, verbose, port }) => {
    if (!prompt) {
      console.log('Usage: slip "your prompt here"');
      console.log('       slip --help');
      return;
    }

    const startTime = Date.now();

    // Check if server is running and attach if so (faster subsequent calls)
    const state = loadState();
    const serverPort = state?.port ?? port;
    const healthStart = Date.now();
    const health = await checkHealth(serverPort);
    const healthTime = Date.now() - healthStart;
    
    // Check for existing session from env var (set by zsh plugin or previous call)
    const existingSessionId = isNew ? null : process.env.SLIP_SESSION;
    
    // Build opencode run command
    const args = ['run'];
    
    // If server is running, attach to it for faster response
    if (health.healthy) {
      args.push('--attach', `http://localhost:${serverPort}`);
      if (verbose) {
        console.log(`\x1b[2m→ Attaching to server on port ${serverPort} (${healthTime}ms)\x1b[0m`);
      }
    } else if (verbose) {
      console.log(`\x1b[2m→ No server running, starting fresh instance (${healthTime}ms)\x1b[0m`);
    }
    
    // Session handling: reuse session from SLIP_SESSION env var if available
    if (existingSessionId) {
      args.push('--session', existingSessionId);
      if (verbose) {
        console.log(`\x1b[2m→ Reusing session ${existingSessionId}\x1b[0m`);
      }
    } else if (verbose && isNew) {
      console.log(`\x1b[2m→ Starting new session\x1b[0m`);
    }
    
    if (model) args.push('--model', model);
    args.push(prompt);

    if (verbose) {
      console.log(`\x1b[2m→ Running: opencode ${args.join(' ')}\x1b[0m`);
    }

    // Show spinner while waiting for response
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinnerIdx = 0;
    let spinnerActive = true;
    const llmStart = Date.now();
    let timeToFirstToken = 0;
    
    // Start spinner on its own line
    process.stdout.write('\n');
    
    // Start spinner
    const spinner = setInterval(() => {
      if (spinnerActive) {
        const elapsed = ((Date.now() - llmStart) / 1000).toFixed(1);
        process.stdout.write(`\r\x1b[K\x1b[2m${spinnerChars[spinnerIdx]} Thinking... (${elapsed}s)\x1b[0m`);
        spinnerIdx = (spinnerIdx + 1) % spinnerChars.length;
      }
    }, 80);

    // Use spawn instead of spawnSync to handle output streaming
    const proc = spawn('opencode', args, { 
      stdio: ['inherit', 'pipe', 'inherit'],
    });
    
    let firstOutput = true;
    proc.stdout?.on('data', (data) => {
      if (firstOutput) {
        // Clear spinner completely on first output
        timeToFirstToken = Date.now() - llmStart;
        spinnerActive = false;
        clearInterval(spinner);
        // Clear spinner line, then newline for output
        process.stdout.write('\r\x1b[K');
        firstOutput = false;
      }
      process.stdout.write(data);
    });

    // Wait for process to exit
    await new Promise<void>((resolve) => {
      proc.on('close', () => {
        spinnerActive = false;
        clearInterval(spinner);
        if (firstOutput) {
          process.stdout.write('\r\x1b[K'); // Clear spinner if no output
        }
        resolve();
      });
    });

    const totalTime = Date.now() - startTime;
    
    if (verbose) {
      console.log(`\x1b[2m→ Time to first token: ${timeToFirstToken}ms | Total: ${totalTime}ms\x1b[0m`);
    }
    
    // After first call, get session ID and output for shell to capture
    // The zsh plugin can capture this and export SLIP_SESSION
    if (!existingSessionId) {
      const listResult = spawnSync('opencode', ['session', 'list'], { encoding: 'utf-8' });
      const match = listResult.stdout?.match(/^(ses_[a-zA-Z0-9]+)/m);
      if (match) {
        // Output in format shell can parse
        console.log(`\x1b[2mSLIP_SESSION=${match[1]}\x1b[0m`);
      }
    }
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

// --- Session Commands ---

const sessionList = command({
  name: 'list',
  desc: 'List slipstream sessions',
  options: {
    limit: number('limit').alias('n').default(20),
  },
  handler: async ({ limit }) => {
    const result = spawnSync('opencode', ['session', 'list', '-n', String(limit), '--format', 'json'], {
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      console.log('No sessions found');
      return;
    }

    try {
      const sessions = JSON.parse(result.stdout) as Array<{ id: string; title?: string }>;
      const slipSessions = sessions.filter((s) => s.id.startsWith('slip-'));

      if (slipSessions.length === 0) {
        console.log('No slipstream sessions found');
        return;
      }

      console.log('Slipstream Sessions:');
      for (const s of slipSessions) {
        const tty = s.id.replace('slip-_dev_', '').replace('slip-', '');
        const title = s.title || '(untitled)';
        console.log(`  ${tty.padEnd(12)} ${title}`);
      }
    } catch {
      console.log('No sessions found');
    }
  },
});

const sessionAttach = command({
  name: 'attach',
  desc: 'Open session in TUI',
  options: {
    id: positional().desc('Session ID or TTY name'),
  },
  handler: async ({ id }) => {
    if (!id) {
      console.log('Usage: slip session attach <id>');
      return;
    }
    const sessionId = id.startsWith('slip-') ? id : `slip-_dev_${id}`;
    spawnSync('opencode', ['--session', sessionId], {
      stdio: 'inherit',
    });
  },
});

const session = command({
  name: 'session',
  desc: 'Manage slipstream sessions',
  subcommands: [sessionList, sessionAttach],
});

// --- Skill Commands ---

const SKILL_DIR = join(homedir(), '.opencode', 'skill');

const skillList = command({
  name: 'list',
  desc: 'List available skills',
  handler: async () => {
    const { readdirSync, readFileSync } = await import('fs');
    
    try {
      mkdirSync(SKILL_DIR, { recursive: true });
      const entries = readdirSync(SKILL_DIR, { withFileTypes: true });
      const skills = entries.filter((e) => e.isDirectory());

      if (skills.length === 0) {
        console.log('No skills found');
        console.log(`Create skills in: ${SKILL_DIR}`);
        return;
      }

      console.log('Available Skills:');
      for (const skill of skills) {
        const skillFile = join(SKILL_DIR, skill.name, 'SKILL.md');
        try {
          const content = readFileSync(skillFile, 'utf-8');
          const desc = content.match(/description:\s*(.+)/)?.[1] || '';
          console.log(`  ${skill.name}: ${desc}`);
        } catch {
          console.log(`  ${skill.name}`);
        }
      }
    } catch (e) {
      console.log('Error reading skills:', e);
    }
  },
});

const skillCreate = command({
  name: 'create',
  desc: 'Create a new skill',
  options: {
    name: positional().desc('Skill name (lowercase-hyphenated)'),
  },
  handler: async ({ name }) => {
    if (!name) {
      console.log('Usage: slip skill create <name>');
      return;
    }

    // Validate name
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      console.log('Error: Name must be lowercase alphanumeric with hyphens');
      console.log('Example: my-skill, git-commit, k8s-debug');
      return;
    }

    const skillDir = join(SKILL_DIR, name);
    const skillFile = join(skillDir, 'SKILL.md');

    try {
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(
        skillFile,
        `---
name: ${name}
description: TODO - describe what this skill does
---

## What I do
- TODO

## When to use me
TODO
`
      );
      console.log(`✓ Created ${skillFile}`);
    } catch (e) {
      console.log('Error creating skill:', e);
    }
  },
});

const skillShow = command({
  name: 'show',
  desc: 'Show skill content',
  options: {
    name: positional().desc('Skill name'),
  },
  handler: async ({ name }) => {
    if (!name) {
      console.log('Usage: slip skill show <name>');
      return;
    }

    const skillFile = join(SKILL_DIR, name, 'SKILL.md');
    try {
      const content = readFileSync(skillFile, 'utf-8');
      console.log(content);
    } catch {
      console.log(`Skill not found: ${name}`);
    }
  },
});

const skill = command({
  name: 'skill',
  desc: 'Manage slipstream skills',
  subcommands: [skillList, skillCreate, skillShow],
});

// --- Model Commands ---

const modelList = command({
  name: 'list',
  desc: 'List available models',
  handler: async () => {
    const result = spawnSync('opencode', ['models'], {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'inherit'],
    });
    console.log(result.stdout || 'No models found');
  },
});

const modelSet = command({
  name: 'set',
  desc: 'Set current model',
  options: {
    modelName: positional().desc('Model name (e.g., anthropic/claude-sonnet-4-20250514)'),
  },
  handler: async ({ modelName }) => {
    if (!modelName) {
      console.log('Usage: slip model set <model-name>');
      console.log('Example: slip model set anthropic/claude-sonnet-4-20250514');
      return;
    }
    // Store in config
    const modelFile = join(CACHE_DIR, 'current-model');
    writeFileSync(modelFile, modelName);
    console.log(`✓ Model set to: ${modelName}`);
    console.log('Note: This will be used for new sessions.');
  },
});

const modelCurrent = command({
  name: 'current',
  desc: 'Show current model',
  handler: async () => {
    const modelFile = join(CACHE_DIR, 'current-model');
    try {
      const model = readFileSync(modelFile, 'utf-8').trim();
      console.log(`Current model: ${model}`);
    } catch {
      console.log('No model set (using default)');
    }
  },
});

const model = command({
  name: 'model',
  desc: 'Manage AI models',
  subcommands: [modelList, modelSet, modelCurrent],
});

// Run CLI
run([main, server, session, skill, model, learn], {
  version: '0.1.0',
});
