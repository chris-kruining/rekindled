import { build } from 'esbuild';

await build({
    entryPoints: [ 'src/rekindled.tsx', 'src/api.server.ts' ],
    outdir: 'lib',
    outbase: 'src',
    bundle: true,
    sourcemap: true,
    minify: false,
    format: 'cjs',
    platform: 'node',
    external: [ 'react', 'react-dom', '@remix-run/node', '@remix-run/react' ],
    target: [ 'esnext' ],
});