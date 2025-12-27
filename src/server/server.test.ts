/**
 * Tests for server health checking and management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkHealth, isPortInUse, ServerHealth } from './server';

describe('server', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('checkHealth', () => {
    it('should return healthy when server responds with health data', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ healthy: true, version: '1.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkHealth(4096);

      expect(result.healthy).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4096/global/health',
        expect.any(Object)
      );
    });

    it('should return unhealthy when server is not responding', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkHealth(4096);

      expect(result.healthy).toBe(false);
      expect(result.version).toBeUndefined();
    });

    it('should return unhealthy when server returns non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkHealth(4096);

      expect(result.healthy).toBe(false);
    });

    it('should timeout after specified duration', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        // Simulate abort
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {});
        }
        throw new Error('Aborted');
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkHealth(4096, 100);

      expect(result.healthy).toBe(false);
    });
  });

  describe('isPortInUse', () => {
    it('should return true when port has a listener', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const result = await isPortInUse(4096);

      expect(result).toBe(true);
    });

    it('should return false when port has no listener', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await isPortInUse(4096);

      expect(result).toBe(false);
    });
  });
});
