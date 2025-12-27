/**
 * Server health checking and management
 * Handles OpenCode server health, port detection, and lifecycle
 */

export interface ServerHealth {
  healthy: boolean;
  version?: string;
}

export interface ServerState {
  port: number;
  pid?: number;
  startedAt?: string;
}

/**
 * Check if the OpenCode server is healthy
 * @param port Port to check
 * @param timeout Timeout in ms (default 2000)
 */
export async function checkHealth(port: number, timeout = 2000): Promise<ServerHealth> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`http://localhost:${port}/global/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as { healthy: boolean; version: string };
      return { healthy: data.healthy, version: data.version };
    }
    return { healthy: false };
  } catch {
    clearTimeout(timeoutId);
    return { healthy: false };
  }
}

/**
 * Check if a port is in use by any process
 * @param port Port to check
 */
export async function isPortInUse(port: number): Promise<boolean> {
  try {
    await fetch(`http://localhost:${port}`, { method: 'HEAD' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find an available port starting from a given port
 * @param startPort Starting port number
 * @param maxAttempts Maximum ports to try
 */
export async function findAvailablePort(
  startPort: number,
  maxAttempts = 100
): Promise<number> {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
    if (port > startPort + maxAttempts) {
      throw new Error(`No available port found in range ${startPort}-${port}`);
    }
  }
  return port;
}

/**
 * Gracefully dispose of an OpenCode server instance
 * @param port Port of the server to dispose
 */
export async function gracefulDispose(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/instance/dispose`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}
