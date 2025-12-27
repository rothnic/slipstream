/**
 * Tests for server health checking and management
 */
import { describe, it, expect, mock, afterEach } from 'bun:test';
import { checkHealth, isPortInUse } from './server';

describe('server', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('checkHealth', () => {
    it('should return healthy when server responds with health data', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ healthy: true, version: '1.0.0' }),
        } as Response)
      );

      const result = await checkHealth(4096);

      expect(result.healthy).toBe(true);
      expect(result.version).toBe('1.0.0');
    });

    it('should return unhealthy when server is not responding', async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error('Connection refused')));

      const result = await checkHealth(4096);

      expect(result.healthy).toBe(false);
      expect(result.version).toBeUndefined();
    });

    it('should return unhealthy when server returns non-ok response', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );

      const result = await checkHealth(4096);

      expect(result.healthy).toBe(false);
    });

    it('should timeout after specified duration', async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error('Aborted')));

      const result = await checkHealth(4096, 100);

      expect(result.healthy).toBe(false);
    });
  });

  describe('isPortInUse', () => {
    it('should return true when port has a listener', async () => {
      globalThis.fetch = mock(() => Promise.resolve({ ok: true } as Response));

      const result = await isPortInUse(4096);

      expect(result).toBe(true);
    });

    it('should return false when port has no listener', async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error('Connection refused')));

      const result = await isPortInUse(4096);

      expect(result).toBe(false);
    });
  });
});
