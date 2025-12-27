/**
 * IPC connection utilities for communicating with the daemon
 */

export interface ConnectionInfo {
  host: string;
  port: number;
  sessionId?: string;
}

/**
 * Create connection info from daemon state
 */
export function createConnectionInfo(port: number, sessionId?: string): ConnectionInfo {
  return {
    host: 'localhost',
    port,
    sessionId,
  };
}

/**
 * Test if a port is available/in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, 'localhost');
  });
}

/**
 * Constants for port search
 */
const DEFAULT_START_PORT = 3000;
const MAX_PORT_SEARCH_ATTEMPTS = 100;

/**
 * Find an available port starting from the given port
 */
export async function findAvailablePort(startPort: number = DEFAULT_START_PORT): Promise<number> {
  let port = startPort;
  
  for (let i = 0; i < MAX_PORT_SEARCH_ATTEMPTS; i++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    port++;
  }
  
  throw new Error(`Could not find available port after ${MAX_PORT_SEARCH_ATTEMPTS} attempts`);
}
