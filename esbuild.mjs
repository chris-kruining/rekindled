import { build } from 'esbuild';

await build({
    entryPoints: [ 'src/index.tsx' ],
    outdir: 'lib',
    outbase: 'src',
    bundle: false,
    sourcemap: true,
    minify: false,
    format: 'cjs',
    platform: 'node',
    target: [ 'esnext' ],
});