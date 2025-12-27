/**
 * Tests for interactive UI utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectUIBackend } from './interactive';

describe('interactive', () => {
  describe('detectUIBackend', () => {
    it('should return a valid backend type', () => {
      const result = detectUIBackend();
      expect(['gum', 'fzf', 'prompt']).toContain(result);
    });
  });

  // Note: Full integration tests require interactive terminal
  // These are placeholder tests for CI
  describe('choose', () => {
    it('should be exported', async () => {
      const { choose } = await import('./interactive');
      expect(typeof choose).toBe('function');
    });
  });

  describe('confirm', () => {
    it('should be exported', async () => {
      const { confirm } = await import('./interactive');
      expect(typeof confirm).toBe('function');
    });
  });

  describe('input', () => {
    it('should be exported', async () => {
      const { input } = await import('./interactive');
      expect(typeof input).toBe('function');
    });
  });
});
