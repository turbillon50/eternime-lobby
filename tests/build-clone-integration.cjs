const esbuild = require('esbuild');
const path = require('node:path');
esbuild.build({ entryPoints: ['tests/clone-data.integration.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node18', outfile: '/tmp/eternime-clone-integration.mjs', plugins: [{ name: 'qa-database-only', setup(build) {
  build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'empty', namespace: 'empty' }));
  build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '' }));
  build.onResolve({ filter: /^@\/lib\/db\/clone$/ }, () => ({ path: path.resolve('tests/clone-db-fixture.ts') }));
} }] });
