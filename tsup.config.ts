import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // Client bundle
    entry: { 'client/index': 'src/client/index.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node18',
    clean: true,
    sourcemap: true,
    dts: false,
    splitting: false,
    treeshake: true,
  },
  {
    // Daemon bundle
    entry: { 'daemon/server': 'src/daemon/server.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node18',
    sourcemap: true,
    dts: false,
    splitting: false,
    treeshake: true,
  },
]);
