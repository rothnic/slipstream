/**
 * Session management for the OpenCode daemon
 * Tracks active sessions and implements auto-cleanup
 */

export interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export class SessionManager {
  private currentSession: SessionInfo | null = null;
  private idleTimeout: number;
  private idleTimer: NodeJS.Timeout | null = null;
  private onIdleCallback?: () => void;

  constructor(idleTimeoutSeconds: number = 3600) {
    this.idleTimeout = idleTimeoutSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Create a new session
   */
  createSession(sessionId?: string): SessionInfo {
    const now = new Date();
    this.currentSession = {
      id: sessionId || this.generateSessionId(),
      createdAt: now,
      lastActiveAt: now,
    };
    
    this.resetIdleTimer();
    return this.currentSession;
  }

  /**
   * Get the current session
   */
  getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Update the last active timestamp
   */
  updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActiveAt = new Date();
      this.resetIdleTimer();
    }
  }

  /**
   * Set callback for idle timeout
   */
  onIdle(callback: () => void): void {
    this.onIdleCallback = callback;
  }

  /**
   * Reset the idle timer
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      if (this.onIdleCallback) {
        this.onIdleCallback();
      }
    }, this.idleTimeout);
  }

  /**
   * Clean up timers
   */
  destroy(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
