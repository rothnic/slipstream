import { z } from 'zod';

/**
 * Configuration constants
 */
const MIN_IDLE_TIMEOUT_SECONDS = 60;
const DEFAULT_IDLE_TIMEOUT_SECONDS = 3600; // 1 hour
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const DEFAULT_PORT = 3000;

/**
 * Schema for user configuration stored in ~/.config/slipstream/config.json
 */
export const UserConfigSchema = z.object({
  // Model configuration
  model: z.string().default('gpt-4'),
  
  // Tool permissions - terminal optimized by default
  tools: z.object({
    filesystem: z.boolean().default(true),
    shell: z.boolean().default(true),
    browser: z.boolean().default(false),
    gui: z.boolean().default(false),
  }).default({}),
  
  // Daemon settings
  daemon: z.object({
    idleTimeout: z.number().min(MIN_IDLE_TIMEOUT_SECONDS).default(DEFAULT_IDLE_TIMEOUT_SECONDS),
    port: z.number().min(MIN_PORT).max(MAX_PORT).default(DEFAULT_PORT),
  }).default({}),
  
  // UI preferences
  ui: z.object({
    verbose: z.boolean().default(false),
    colorEnabled: z.boolean().default(true),
  }).default({}),
});

export type UserConfig = z.infer<typeof UserConfigSchema>;

/**
 * Schema for daemon state stored in ~/.config/slipstream/daemon.json
 */
export const DaemonStateSchema = z.object({
  pid: z.number(),
  port: z.number(),
  sessionId: z.string(),
  startedAt: z.string(), // ISO timestamp
  lastActiveAt: z.string(), // ISO timestamp
});

export type DaemonState = z.infer<typeof DaemonStateSchema>;

/**
 * Default user configuration
 */
export const DEFAULT_CONFIG: UserConfig = {
  model: 'gpt-4',
  tools: {
    filesystem: true,
    shell: true,
    browser: false,
    gui: false,
  },
  daemon: {
    idleTimeout: 3600,
    port: 3000,
  },
  ui: {
    verbose: false,
    colorEnabled: true,
  },
};
