import { z } from 'zod';

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
    idleTimeout: z.number().min(60).default(3600), // 1 hour in seconds
    port: z.number().min(1024).max(65535).default(3000),
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
