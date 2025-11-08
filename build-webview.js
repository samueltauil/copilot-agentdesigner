const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['webview-ui/src/index.tsx'],
    bundle: true,
    format: 'iife',
    outfile: 'webview-ui/build/index.js',
    external: ['vscode'],
    logLevel: 'info',
    sourcemap: !production,
    minify: production,
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css'
    }
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
