import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // CLI bundle (main entry)
    entry: { 'cli/index': 'src/cli/index.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node18',
    clean: true,
    sourcemap: true,
    dts: false,
    splitting: false,
    treeshake: true,
    external: ['bun'],
  },
]);
