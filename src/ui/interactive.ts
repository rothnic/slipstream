/**
 * Interactive UI utilities
 * Uses gum for beautiful dialogs, falls back to fzf or prompts
 */

import { spawnSync } from 'child_process';
import * as readline from 'readline';

export type UIBackend = 'gum' | 'fzf' | 'prompt';

/**
 * Detect which UI backend is available
 */
export function detectUIBackend(): UIBackend {
  if (spawnSync('which', ['gum']).status === 0) return 'gum';
  if (spawnSync('which', ['fzf']).status === 0) return 'fzf';
  return 'prompt';
}

/**
 * Display a selection menu and return the chosen option
 */
export async function choose(
  options: string[],
  prompt?: string
): Promise<string | null> {
  const backend = detectUIBackend();

  if (backend === 'gum') {
    const args = ['choose', ...options];
    if (prompt) args.unshift('--header', prompt);
    const result = spawnSync('gum', args, { encoding: 'utf-8' });
    return result.stdout.trim() || null;
  }

  if (backend === 'fzf') {
    const args = [];
    if (prompt) args.push('--header', prompt);
    const input = options.join('\n');
    const result = spawnSync('fzf', args, {
      input,
      encoding: 'utf-8',
    });
    return result.stdout.trim() || null;
  }

  // Fallback to readline
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(prompt || 'Choose an option:');
    options.forEach((opt, i) => console.log(`  ${i + 1}) ${opt}`));

    rl.question('Enter number: ', (answer) => {
      rl.close();
      const idx = parseInt(answer) - 1;
      resolve(options[idx] || null);
    });
  });
}

/**
 * Ask for yes/no confirmation
 */
export async function confirm(prompt: string, defaultYes = false): Promise<boolean> {
  const backend = detectUIBackend();

  if (backend === 'gum') {
    const args = ['confirm', prompt];
    if (defaultYes) args.push('--default=yes');
    const result = spawnSync('gum', args);
    return result.status === 0;
  }

  // Fallback to readline
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const suffix = defaultYes ? '[Y/n]' : '[y/N]';
    rl.question(`${prompt} ${suffix} `, (answer) => {
      rl.close();
      const a = answer.toLowerCase().trim();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

/**
 * Get text input from user
 */
export async function input(prompt: string, placeholder?: string): Promise<string> {
  const backend = detectUIBackend();

  if (backend === 'gum') {
    const args = ['input', '--prompt', prompt + ' '];
    if (placeholder) args.push('--placeholder', placeholder);
    const result = spawnSync('gum', args, { encoding: 'utf-8' });
    return result.stdout.trim();
  }

  // Fallback to readline
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const displayPrompt = placeholder ? `${prompt} (${placeholder}): ` : `${prompt}: `;
    rl.question(displayPrompt, (answer) => {
      rl.close();
      resolve(answer || placeholder || '');
    });
  });
}

/**
 * Show a spinner while executing async work
 */
export async function spin<T>(message: string, work: () => Promise<T>): Promise<T> {
  const backend = detectUIBackend();

  if (backend === 'gum') {
    // gum spin runs a command, so we use it differently
    console.log(`⏳ ${message}...`);
    const result = await work();
    console.log(`✓ ${message}`);
    return result;
  }

  // Fallback with simple console
  process.stdout.write(`⏳ ${message}...`);
  const result = await work();
  console.log(' ✓');
  return result;
}

/**
 * Pick a file using file browser
 */
export async function filePicker(startDir?: string): Promise<string | null> {
  const backend = detectUIBackend();

  if (backend === 'gum') {
    const args = ['file'];
    if (startDir) args.push(startDir);
    const result = spawnSync('gum', args, { encoding: 'utf-8' });
    return result.stdout.trim() || null;
  }

  if (backend === 'fzf') {
    const result = spawnSync('fzf', [], {
      cwd: startDir,
      encoding: 'utf-8',
    });
    return result.stdout.trim() || null;
  }

  // Fallback
  return input('Enter file path');
}
