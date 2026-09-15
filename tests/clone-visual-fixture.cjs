// Local-only visual fixture. Does not import any server, auth, provider or DB module.
const esbuild = require('esbuild');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'clone-visual-'));
const snapshot = { facts: [{ topic: 'historia', content: 'Recuerdo sintético para pruebas.', revision: 1 }], versions: [], progress: { covered: 1, totalTopics: 5, coveragePercent: 20, reviewCount: 0, recognitionPercent: null }, messages: [
  { id: '11111111-1111-4111-8111-111111111111-user', role: 'user', content: '¿Qué sabes de mí?', createdAt: '2026-09-15T10:00:00Z', recognized: null },
  { id: '11111111-1111-4111-8111-111111111111', role: 'clone', content: 'Todavía estoy aprendiendo de ti. Conozco lo que confirmaste en tu memoria; puedes enseñarme cómo contarías tu historia.', createdAt: '2026-09-15T10:00:01Z', recognized: null },
] };
(async () => {
  await esbuild.build({ stdin: { contents: 'import React from "react"; import {createRoot} from "react-dom/client"; import {CloneStudio} from "./components/app/CloneStudio"; createRoot(document.getElementById("root")).render(<CloneStudio/>);', resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, outfile: path.join(output, 'app.js'), jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'fixture-next-elements', setup(build) {
    build.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path.endsWith('link') ? 'import React from "react"; export default function Link(p){return React.createElement("a",p)}' : 'import React from "react"; export default function Image({unoptimized,...p}){return React.createElement("img",p)}', loader: 'jsx', resolveDir: process.cwd() }));
  } }] });
  const globalCss = await postcss([tailwind()]).process(fs.readFileSync('styles/globals.css', 'utf8'), { from: path.resolve('styles/globals.css') });
  fs.writeFileSync(path.join(output, 'global.css'), globalCss.css);
  http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    if (req.url === '/api/clone') {
      if (req.method === 'PATCH') { let body = ''; for await (const chunk of req) body += chunk; const input = JSON.parse(body); const fact = { topic: input.topic, content: input.content, revision: input.revision + 1 }; snapshot.facts = [...snapshot.facts.filter(f => f.topic !== fact.topic), fact]; }
      return json(snapshot);
    }
    if (req.url === '/api/voice/clone') return json({ voiceId: 'fixture-voice', cloningAvailable: true });
    if (req.url === '/api/clone/portrait') return json({ portrait: null });
    if (req.url === '/api/clone/avatar') return json({ configured: true, jobs: [] });
    if (req.url === '/api/identity') return json({ assets: [] });
    if (req.url?.startsWith('/api/')) { res.statusCode = 409; return json({ error: 'Prueba visual: no se realizan generaciones reales.' }); }
    if (['/app.js', '/app.css', '/global.css'].includes(req.url)) { res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(path.join(output, req.url))); }
    res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi clon — prueba visual local</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/app.css"><body><main class="eon-app" style="padding:32px;min-height:100vh"><p style="color:#aaa;font-size:12px;margin-bottom:20px">ENTORNO DE PRUEBA · DATOS SINTÉTICOS</p><div id="root"></div></main><script src="/app.js"></script></body></html>');
  }).listen(4173, '0.0.0.0', () => console.log('Visual fixture http://localhost:4173 — synthetic data only'));
})();
