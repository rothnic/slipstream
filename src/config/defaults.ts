/**
 * Terminal-optimized tool definitions for OpenCode
 * These are the tools enabled by default for the daemon
 */

export interface ToolDefinition {
  name: string;
  enabled: boolean;
  description: string;
}

/**
 * Default tool configuration for terminal mode
 * Optimized for CLI operations, disables heavy GUI/browser tools
 */
export const TERMINAL_TOOLS: ToolDefinition[] = [
  {
    name: 'filesystem',
    enabled: true,
    description: 'Read, write, and manipulate files and directories',
  },
  {
    name: 'shell',
    enabled: true,
    description: 'Execute shell commands and scripts',
  },
  {
    name: 'browser',
    enabled: false,
    description: 'Browser automation (disabled for lightweight daemon)',
  },
  {
    name: 'gui',
    enabled: false,
    description: 'GUI interactions (disabled for lightweight daemon)',
  },
];

/**
 * Get enabled tools based on user configuration
 */
export function getEnabledTools(toolConfig: Record<string, boolean>): string[] {
  return Object.entries(toolConfig)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * OpenCode configuration for terminal mode
 */
export const OPENCODE_TERMINAL_CONFIG = {
  mode: 'terminal',
  toolset: 'minimal',
  features: {
    fileOperations: true,
    shellExecution: true,
    browserAutomation: false,
    guiInteraction: false,
  },
};
