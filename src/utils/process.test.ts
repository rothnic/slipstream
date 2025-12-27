/**
 * Tests for Bun-native utilities
 */
import { describe, it, expect } from 'bun:test';
import { commandExists, getTty, fileExists, exec, execSync } from './process';

describe('bun utils', () => {
  describe('commandExists', () => {
    it('should return true for existing command', async () => {
      const result = await commandExists('ls');
      expect(result).toBe(true);
    });

    it('should return false for non-existing command', async () => {
      const result = await commandExists('nonexistent-command-xyz');
      expect(result).toBe(false);
    });
  });

  describe('getTty', () => {
    it('should return string or undefined', () => {
      const result = getTty();
      expect(result === undefined || typeof result === 'string').toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const result = await fileExists('./package.json');
      expect(result).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const result = await fileExists('./nonexistent-file-xyz.json');
      expect(result).toBe(false);
    });
  });

  describe('exec', () => {
    it('should run command and return output', async () => {
      const result = await exec('echo', ['hello']);
      expect(result.stdout.trim()).toBe('hello');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('execSync', () => {
    it('should run command synchronously', () => {
      const result = execSync('echo', ['world']);
      expect(result.stdout.trim()).toBe('world');
      expect(result.exitCode).toBe(0);
    });
  });
});
