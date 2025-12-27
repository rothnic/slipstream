/**
 * Slipstream OpenCode Plugin
 * Handles session.idle learning and custom tools
 */

import type { Plugin, tool } from "@opencode-ai/plugin";
import { homedir } from "os";
import { join } from "path";

const SKILL_DIR = join(homedir(), ".opencode", "skill");

export const SlipstreamPlugin: Plugin = async (ctx) => {
  const { client, $ } = ctx;

  return {
    // Fires when session becomes idle (agent finished)
    "session.idle": async (event) => {
      const sessionId = event.properties?.sessionID;
      if (!sessionId?.startsWith("slip-")) return; // Only slipstream sessions

      try {
        // Get session messages for analysis
        const messages = await client.session.messages({
          path: { id: sessionId },
        });

        // Extract bash commands from session
        const commands = messages
          .flatMap((m: any) => m.parts || [])
          .filter((p: any) => p.type === "tool" && p.name === "bash")
          .map((p: any) => p.args?.command)
          .filter(Boolean);

        if (commands.length < 3) return; // Not enough data

        console.log(`[Slipstream] Session idle, ${commands.length} commands to analyze`);

        // Trigger learner sub-agent
        await client.session.prompt({
          path: { id: sessionId },
          body: {
            parts: [
              {
                type: "text",
                text: `@slipstream/learner Analyze these commands and update skills:
${commands.join("\n")}

Update ~/.opencode/skill/slipstream-prefs/SKILL.md with any new insights.`,
              },
            ],
          },
        });
      } catch (error) {
        console.error("[Slipstream] Learning error:", error);
      }
    },

    // Preserve learning context during compaction
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`## Slipstream Learning Context
- Session ID: ${input.sessionID}
- Commands executed in this session should inform future suggestions
- Check loaded skills for user preferences
`);
    },

    // Custom tools
    tool: {
      // Get shell context tool
      slipstream_context: tool({
        description: "Get current shell context (pwd, git, env)",
        args: {},
        async execute() {
          const pwd = await $`pwd`.text();
          const branch = await $`git branch --show-current`
            .text()
            .catch(() => "");
          const status = await $`git status --porcelain`
            .text()
            .catch(() => "");
          const zoxideTop = await $`zoxide query -l | head -5`
            .text()
            .catch(() => "");

          return JSON.stringify({
            pwd: pwd.trim(),
            git: {
              branch: branch.trim(),
              hasChanges: status.trim().length > 0,
            },
            frecent: zoxideTop.trim().split("\n").filter(Boolean),
          });
        },
      }),

      // Interactive choice tool
      slipstream_choose: tool({
        description: "Present options to user and get their choice",
        args: {
          options: tool.schema.array(tool.schema.string()),
          prompt: tool.schema.string().optional(),
        },
        async execute({ options, prompt }) {
          const header = prompt ? `--header "${prompt}"` : "";
          const result = await $`gum choose ${header} ${options.join(" ")}`.text();
          return result.trim();
        },
      }),

      // Interactive confirm tool
      slipstream_confirm: tool({
        description: "Ask user for yes/no confirmation",
        args: {
          prompt: tool.schema.string(),
        },
        async execute({ prompt }) {
          try {
            await $`gum confirm "${prompt}"`;
            return "yes";
          } catch {
            return "no";
          }
        },
      }),
    },
  };
};

export default SlipstreamPlugin;
