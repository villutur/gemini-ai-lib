import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/model-catalogs.ts', 'src/model-capabilities.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  external: [],
  minify: true,
  bundle: true,
  skipNodeModulesBundle: true,
  target: "es2022"
});
