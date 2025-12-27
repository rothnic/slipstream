/**
 * Bun-native process and file utilities
 * Replaces node child_process and fs with Bun APIs
 */

import { $ } from 'bun';

/**
 * Run a shell command and get output (Bun native)
 */
export async function shell(command: string): Promise<string> {
  const result = await $`${command}`.quiet().text();
  return result.trim();
}

/**
 * Run a command with arguments (Bun native)
 */
export async function exec(cmd: string, args: string[] = []): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  
  return { stdout, stderr, exitCode };
}

/**
 * Run command synchronously (for CLI)
 */
export function execSync(cmd: string, args: string[] = []): {
  stdout: string;
  exitCode: number;
} {
  const proc = Bun.spawnSync([cmd, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  
  return {
    stdout: proc.stdout.toString(),
    exitCode: proc.exitCode ?? 1,
  };
}

/**
 * Check if a command exists
 */
export async function commandExists(cmd: string): Promise<boolean> {
  try {
    const result = await $`which ${cmd}`.quiet().text();
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Read file contents (Bun native)
 */
export async function readFile(path: string): Promise<string> {
  const file = Bun.file(path);
  return await file.text();
}

/**
 * Write file contents (Bun native)
 */
export async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}

/**
 * Check if file exists (Bun native)
 */
export async function fileExists(path: string): Promise<boolean> {
  const file = Bun.file(path);
  return await file.exists();
}

/**
 * Get TTY path (Bun native)
 */
export function getTty(): string | undefined {
  // Bun exposes process.stdin which we can use
  // Fallback to tty command for actual path
  try {
    const result = Bun.spawnSync(['tty'], { stdout: 'pipe' });
    const tty = result.stdout.toString().trim();
    return tty !== 'not a tty' ? tty : undefined;
  } catch {
    return undefined;
  }
}

/**
 * HTTP fetch with timeout (using Bun's native fetch)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Run an interactive command with PTY support
 * Useful for TUI applications like opencode
 */
export async function runInteractive(
  cmd: string,
  args: string[] = [],
  options: {
    cols?: number;
    rows?: number;
    env?: Record<string, string>;
  } = {}
): Promise<number> {
  const cols = options.cols ?? process.stdout.columns ?? 80;
  const rows = options.rows ?? process.stdout.rows ?? 24;

  const proc = Bun.spawn([cmd, ...args], {
    terminal: {
      cols,
      rows,
      env: options.env,
      data(_terminal, data) {
        process.stdout.write(data);
      },
    },
    env: { ...process.env, ...options.env },
  });

  // Forward stdin to the terminal
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.on('data', (data) => {
      proc.terminal?.write(data);
    });
  }

  // Handle terminal resize
  process.stdout.on('resize', () => {
    proc.terminal?.resize(
      process.stdout.columns ?? 80,
      process.stdout.rows ?? 24
    );
  });

  const exitCode = await proc.exited;

  // Cleanup
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  proc.terminal?.close();

  return exitCode;
}

/**
 * Create a reusable terminal for multiple commands
 */
export function createTerminal(options: {
  cols?: number;
  rows?: number;
  onData?: (data: Buffer) => void;
} = {}) {
  const cols = options.cols ?? process.stdout.columns ?? 80;
  const rows = options.rows ?? process.stdout.rows ?? 24;

  return new Bun.Terminal({
    cols,
    rows,
    data(_term, data) {
      if (options.onData) {
        options.onData(data);
      } else {
        process.stdout.write(data);
      }
    },
  });
}

/**
 * Spawn a command in an existing terminal
 */
export async function spawnInTerminal(
  terminal: InstanceType<typeof Bun.Terminal>,
  cmd: string,
  args: string[] = []
): Promise<number> {
  const proc = Bun.spawn([cmd, ...args], { terminal });
  return await proc.exited;
}

