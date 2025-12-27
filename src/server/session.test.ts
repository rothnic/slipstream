/**
 * Tests for session management
 */
import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { getSessionId, getSessionIdFromTty } from './session';

describe('session', () => {
  describe('getSessionIdFromTty', () => {
    it('should generate session ID from TTY path', () => {
      const result = getSessionIdFromTty('/dev/ttys001');
      expect(result).toBe('slip-_dev_ttys001');
    });

    it('should handle TTY with multiple slashes', () => {
      const result = getSessionIdFromTty('/dev/pts/1');
      expect(result).toBe('slip-_dev_pts_1');
    });

    it('should use fallback for empty TTY', () => {
      const result = getSessionIdFromTty('');
      expect(result).toMatch(/^slip-pid-\d+$/);
    });

    it('should use fallback for undefined TTY', () => {
      const result = getSessionIdFromTty(undefined);
      expect(result).toMatch(/^slip-pid-\d+$/);
    });
  });

  describe('getSessionId', () => {
    it('should return a string starting with slip-', async () => {
      const result = await getSessionId();
      expect(result).toMatch(/^slip-/);
    });
  });
});
