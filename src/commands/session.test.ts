/**
 * Tests for session commands
 */
import { describe, it, expect } from 'vitest';
import { getSessionDisplayName } from './session';

describe('session commands', () => {
  describe('getSessionDisplayName', () => {
    it('should format session with title', () => {
      const result = getSessionDisplayName({
        id: 'slip-_dev_ttys001',
        title: 'Fix auth bug',
      });
      expect(result).toContain('ttys001');
      expect(result).toContain('Fix auth bug');
    });

    it('should show (untitled) for sessions without title', () => {
      const result = getSessionDisplayName({
        id: 'slip-_dev_ttys002',
      });
      expect(result).toContain('ttys002');
      expect(result).toContain('(untitled)');
    });

    it('should handle pid-based sessions', () => {
      const result = getSessionDisplayName({
        id: 'slip-pid-12345',
        title: 'Test',
      });
      expect(result).toContain('pid-12345');
    });
  });
});
