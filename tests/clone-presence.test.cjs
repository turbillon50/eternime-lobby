const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
function load(file, stubs = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name === 'server-only' ? {} : Object.hasOwn(stubs, name) ? stubs[name] : name === '@/lib/voice/personal-settings' ? load('lib/voice/personal-settings.ts') : require(name), module, module.exports);
  return module.exports;
}
const errors = load('lib/clone/errors.ts');
const guard = load('lib/clone/guard.ts', { './errors': errors });
const provider = load('lib/clone/heygen.ts', { './errors': errors });
const dbs = new Map();
async function getCloneSql(owner) {
  assert.ok(['a', 'b'].includes(owner), 'only isolated test identities');
  if (!dbs.has(owner)) dbs.set(owner, new PGlite());
  return async (strings, ...params) => {
    const query = strings.reduce((s, text, i) => s + (i ? `$${i}` : '') + text, '');
    return (await dbs.get(owner).query(query, params)).rows;
  };
}
process.env.TENANT_URL_ENCRYPTION_KEY = 'isolated-presence-test-secret';
const crypto = load('lib/crypto/tenant-url.ts');
const store = load('lib/clone/media-store.ts', { '@/lib/db/clone': { getCloneSql }, '@/lib/crypto/tenant-url': crypto, './errors': errors });
after(async () => { for (const db of dbs.values()) await db.close(); });
test('origin guard rejects cross-site and opaque origins, accepts same-origin', () => {
  for (const headers of [{ origin: 'https://evil.test' }, { origin: 'null' }, { 'sec-fetch-site': 'cross-site' }]) {
    assert.throws(() => guard.sameOrigin(new Request('https://eternime.org/api/clone', { headers })), { status: 403 });
  }
  guard.sameOrigin(new Request('https://eternime.org/api/clone', { headers: { origin: 'https://eternime.org' } }));
});
test('JSON body is bounded by streamed bytes even without Content-Length', async () => {
  await assert.rejects(guard.boundedJson(new Request('https://example.test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'á'.repeat(100) }) }), 100), { status: 413 });
  await assert.rejects(guard.boundedJson(new Request('https://example.test', { method: 'POST', body: '{}' })), { status: 415 });
});
test('provider asset contract uses multipart and a stable idempotency key without exposing credentials', async () => {
  const original = global.fetch; const key = process.env.HEYGEN_API_KEY; process.env.HEYGEN_API_KEY = 'test-only';
  global.fetch = async (url, init) => { assert.equal(url, 'https://api.heygen.com/v3/assets'); assert.equal(init.headers['Idempotency-Key'], 'request:image'); assert.ok(init.body.get('file') instanceof Blob); return Response.json({ data: { asset_id: 'asset-a' } }); };
  try { assert.equal(await provider.uploadAsset(new Uint8Array([1, 2]), 'image/jpeg', 'photo.jpg', 'request:image'), 'asset-a'); }
  finally { global.fetch = original; if (key === undefined) delete process.env.HEYGEN_API_KEY; else process.env.HEYGEN_API_KEY = key; }
});
test('video payload combines owned photo and audio, without a stock voice or script', () => {
  const body = provider.videoPayload('photo-a', 'audio-a');
  assert.equal(body.image.type, 'asset_id'); assert.equal(body.audio_asset_id, 'audio-a'); assert.equal(body.resolution, '720p');
  assert.equal(body.script, undefined); assert.equal(body.voice_id, undefined);
});
test('video download refuses arbitrary hosts, ports, credentials, insecure URLs and suffix spoofing', () => {
  for (const url of ['http://files.heygen.ai/v.mp4', 'https://evil.test/v', 'https://files.heygen.ai.evil.test/v', 'https://user:pass@files.heygen.ai/v', 'https://files.heygen.ai:444/v', 'http://127.0.0.1/a']) assert.throws(() => provider.trustedVideoUrl(url));
  assert.equal(provider.trustedVideoUrl('https://files.heygen.ai/v.mp4'), 'https://files.heygen.ai/v.mp4');
});
test('provider errors never return raw secret-bearing messages', async () => {
  const original = global.fetch; process.env.HEYGEN_API_KEY = 'test-only';
  global.fetch = async () => Response.json({ error: { message: 'secret-content-that-must-not-leak' } }, { status: 402 });
  try { await assert.rejects(provider.heygen('videos'), e => e.status === 502 && !e.message.includes('secret-content')); }
  finally { global.fetch = original; delete process.env.HEYGEN_API_KEY; }
});
test('private media is encrypted and isolated between two actual PostgreSQL databases', async () => {
  const id = await store.storeMedia('a', 'portrait', Buffer.from('my-private-face'), 'image/jpeg');
  await store.mediaSql('b');
  assert.equal((await store.readMedia('a', id)).bytes.toString(), 'my-private-face');
  assert.equal(await store.readMedia('b', id), null);
  const sql = await getCloneSql('a'); const rows = await sql`SELECT encrypted FROM clone_private_media WHERE id=${id}::uuid`;
  assert.ok(!rows[0].encrypted.includes('my-private-face'));
  assert.throws(() => crypto.decryptTenantUrl(rows[0].encrypted, `media:b:${id}`));
});
test('durable uniqueness prevents concurrent duplicate paid jobs across tabs', async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => store.reserveJob('a', 'avatar', 'same-input')));
  assert.equal(results.filter(r => r.fresh).length, 1);
  assert.equal(new Set(results.map(r => r.job.id)).size, 1);
  const b = await store.reserveJob('b', 'avatar', 'same-input'); assert.equal(b.fresh, true); assert.notEqual(b.job.id, results[0].job.id);
});
test('daily allowance remains atomic under concurrent requests', async () => {
  const attempts = await Promise.allSettled(Array.from({ length: 10 }, () => store.consumeAllowance('a', 'budget-test', 3)));
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 3);
  assert.equal(attempts.filter(r => r.status === 'rejected' && r.reason.status === 429).length, 7);
});
test('completed job metadata contains no provider IDs, encrypted payloads or signed URLs', async () => {
  const { job } = await store.reserveJob('a', 'audio', 'metadata-test');
  await store.updateJob('a', job.id, { status: 'completed', providerId: 'secret-provider-id', payload: 'private-body' });
  const value = store.publicJob(await store.getJob('a', job.id));
  assert.equal(value.status, 'completed'); assert.ok(!JSON.stringify(value).includes('private-body')); assert.ok(!JSON.stringify(value).includes('secret-provider-id'));
});
test('stalled preparation is visible as uncertain, not shown as ready', () => {
  const job = store.publicJob({ id: 'x', status: 'preparing', updated_at: new Date(Date.now() - 300_000).toISOString(), created_at: new Date().toISOString() });
  assert.equal(job.status, 'uncertain'); assert.equal(job.mediaUrl, null);
});
test('saved audio generates once and survives requests while another owner cannot read it', async () => {
  let calls = 0;
  const audio = load('lib/clone/audio.ts', { './errors': errors, './media-store': store, '@/lib/voice/elevenlabs': { synthesizePersonalVoice: async () => { calls++; return new Response('my-speech', { headers: { 'Content-Type': 'audio/mpeg' } }); } } });
  const first = await audio.savedSpeech('a', 'voice-a', 'Hola'); const second = await audio.savedSpeech('a', 'voice-a', 'Hola');
  assert.equal(calls, 1); assert.equal(first.id, second.id); assert.equal(Buffer.from(second.bytes).toString(), 'my-speech'); assert.equal(await store.readMedia('b', first.id), null);
});
test('failed audio is recorded and never automatically charges again', async () => {
  let calls = 0;
  const audio = load('lib/clone/audio.ts', { './errors': errors, './media-store': store, '@/lib/voice/elevenlabs': { synthesizePersonalVoice: async () => { calls++; throw new Error('network lost'); } } });
  await assert.rejects(audio.savedSpeech('a', 'voice-a', 'failure-case'));
  await assert.rejects(audio.savedSpeech('a', 'voice-a', 'failure-case'), { status: 409 }); assert.equal(calls, 1);
});
test('media route enforces auth before SQL and supports valid and invalid byte ranges', async () => {
  let owner = 'a'; let queries = 0;
  const route = load('app/api/clone/media/[id]/route.ts', { '@/lib/auth': { requireUser: async () => { if (!owner) throw new errors.CloneError('AUTH', 'No autenticado', 401); return { clerkId: owner }; } }, '@/lib/clone/media-store': { readMedia: async (...args) => { queries++; return store.readMedia(...args); } }, '@/lib/clone/errors': errors,
    '@/lib/clone/http': { PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' }, UUID: /^[0-9a-f-]{36}$/, cloneErrorResponse: e => Response.json({ error: e.message }, { status: e.status || 503 }) } });
  const id = await store.storeMedia('a', 'audio', Buffer.from('0123456789'), 'audio/mpeg'); const context = { params: Promise.resolve({ id }) };
  const response = await route.GET(new Request('https://eternime.org/a', { headers: { range: 'bytes=2-5' } }), context); assert.equal(response.status, 206); assert.equal(await response.text(), '2345'); assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.equal((await route.GET(new Request('https://eternime.org/a', { headers: { range: 'bytes=100-' } }), context)).status, 416);
  owner = 'b'; assert.equal((await route.GET(new Request('https://eternime.org/a'), context)).status, 404);
  owner = null; const before = queries; assert.equal((await route.GET(new Request('https://eternime.org/a'), context)).status, 401); assert.equal(queries, before);
});

test('avatar flow enforces ownership and consent, deduplicates, and persists one completed video', async () => {
  const portraitId = await store.storeMedia('a', 'portrait', Buffer.from('test-photo'), 'image/jpeg');
  const exchangeId = '55555555-5555-4555-8555-555555555555';
  let owner = 'a'; let uploadCount = 0; let videoCalls = 0;
  process.env.HEYGEN_API_KEY = 'test-only';
  const http = { PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' }, UUID: /^[0-9a-f-]{36}$/, cloneErrorResponse: e => Response.json({ error: e.message }, { status: e.status || 503 }) };
  const fakeProvider = {
    uploadAsset: async () => { uploadCount++; return `asset-${uploadCount}`; }, videoPayload: provider.videoPayload,
    heygen: async (resource, init, key) => {
      if (resource === 'videos') { videoCalls++; assert.ok(key); assert.equal(JSON.parse(init.body).type, 'image'); return { video_id: 'provider-video' }; }
      return { status: 'completed', video_url: 'https://files.heygen.ai/synthetic.mp4' };
    }, downloadVideo: async () => Buffer.from('synthetic-mp4'),
  };
  const auth = { requireUser: async () => { if (!owner) throw new errors.CloneError('AUTH', 'No autenticado', 401); return { clerkId: owner, sub: owner }; } };
  const common = { '@/lib/clone/setup': { ensureCloneReady: async () => {}, cloneNeedsSetup: () => false }, 'next/server': { NextResponse: { json: Response.json } }, '@/lib/auth': auth, '@/lib/clone/http': http, '@/lib/clone/errors': errors, '@/lib/clone/guard': guard, '@/lib/clone/media-store': store, '@/lib/clone/heygen': fakeProvider, '@/lib/db/clone': { getCloneSql } };
  const create = load('app/api/clone/avatar/route.ts', { ...common,
    '@/lib/data/users': { findUserById: async () => ({ prefs: { personal_voice_id: 'voice-a' } }) },
    '@/lib/data/clone': { getCloneExchange: async (person, id) => person === 'a' && id === exchangeId ? { id, clone_text: 'Una respuesta corta' } : undefined },
    '@/lib/voice/samples': { personalVoiceId: prefs => prefs.personal_voice_id },
    '@/lib/clone/audio': { savedSpeech: async () => ({ bytes: Buffer.from('audio'), mime: 'audio/mpeg' }) },
  });
  const request = (consent = true) => new Request('https://eternime.org/api/clone/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'https://eternime.org' }, body: JSON.stringify({ exchangeId, portraitId, consent, clerkId: 'b' }) });
  assert.equal((await create.POST(request(false))).status, 400); assert.equal(uploadCount, 0);
  owner = 'b'; assert.equal((await create.POST(request())).status, 409); assert.equal(uploadCount, 0);
  owner = 'a'; const result = await create.POST(request()); assert.equal(result.status, 202); const job = (await result.json()).job;
  assert.equal((await create.POST(request())).status, 200); assert.equal(uploadCount, 2); assert.equal(videoCalls, 1);
  const poll = load('app/api/clone/avatar/[id]/route.ts', common);
  const context = { params: Promise.resolve({ id: job.id }) };
  owner = 'b'; assert.equal((await poll.POST(request(), context)).status, 404);
  owner = 'a'; const status = await poll.POST(request(), context); assert.equal(status.status, 200);
  const completed = (await status.json()).job; assert.equal(completed.status, 'completed'); assert.ok(completed.mediaUrl.startsWith('/api/clone/media/'));
  assert.equal((await store.readMedia('a', completed.mediaUrl.split('/').at(-1))).bytes.toString(), 'synthetic-mp4');
  const direct = () => new Request('https://eternime.org/api/clone/avatar', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({portraitId,text:'Mi frase sin memoria ni conversación',consent:true})});
  assert.equal((await create.POST(direct())).status, 202); assert.equal(videoCalls, 2);
  assert.equal((await create.POST(direct())).status, 200); assert.equal(videoCalls, 2);
  owner = null; assert.equal((await create.POST(request())).status, 401); assert.equal(videoCalls, 2);
  delete process.env.HEYGEN_API_KEY;
});

test('lost HeyGen submission is reconciled only with its original key inside 23 hours', async () => {
  const { job } = await store.reserveJob('a', 'avatar', 'lost-submission'); const payload = JSON.stringify(provider.videoPayload('photo', 'audio'));
  await store.updateJob('a', job.id, { status: 'uncertain', payload }); let calls = 0;
  const route = load('app/api/clone/avatar/[id]/route.ts', {
    'next/server': { NextResponse: { json: Response.json } }, '@/lib/auth': { requireUser: async () => ({ clerkId: 'a' }) }, '@/lib/clone/errors': errors,
    '@/lib/clone/guard': guard, '@/lib/clone/media-store': store, '@/lib/db/clone': { getCloneSql },
    '@/lib/clone/http': { PRIVATE_HEADERS: {}, UUID: /^[0-9a-f-]{36}$/, cloneErrorResponse: e => Response.json({ error: e.message }, { status: e.status || 503 }) },
    '@/lib/clone/heygen': { heygen: async (resource, init, key) => {
      if (resource === 'videos') { calls++; assert.equal(key, job.id); assert.equal(init.body, payload); return { video_id: 'recovered-id' }; }
      return { status: 'processing' };
    } },
  });
  const request = () => new Request('https://eternime.org/api/clone/avatar/x', { method: 'POST' });
  assert.equal((await route.POST(request(), { params: Promise.resolve({ id: job.id }) })).status, 200);
  assert.equal(calls, 1); assert.equal((await store.getJob('a', job.id)).provider_id, 'recovered-id');
  const old = await store.reserveJob('a', 'avatar', 'too-old-submission'); await store.updateJob('a', old.job.id, { status: 'uncertain', payload });
  const sql = await getCloneSql('a'); await sql`UPDATE clone_media_jobs SET created_at=now()-interval '25 hours' WHERE id=${old.job.id}::uuid`;
  assert.equal((await route.POST(request(), { params: Promise.resolve({ id: old.job.id }) })).status, 409); assert.equal(calls, 1);
});

test('first-use setup prepares only the signed-in owner and never bypasses suspended tenants', async () => {
  let ready = false; let tenantStatus = 'ready'; const initialized = []; const ensured = [];
  const setup = load('lib/clone/setup.ts', { './errors': errors,
    '@/lib/db/clone': { getCloneSql: async () => { if (!ready) throw new errors.CloneError('CLONE_NOT_INITIALIZED', 'pending', 409); }, initializeClone: async owner => { initialized.push(owner); ready = true; } },
    '@/lib/tenant/ensure': { ensureTenantForUser: async session => { ensured.push(session.clerkId); return { status: tenantStatus }; } },
  });
  await setup.ensureCloneReady({ clerkId: 'a' }); await setup.ensureCloneReady({ clerkId: 'a' });
  assert.deepEqual(initialized, ['a']); assert.deepEqual(ensured, ['a']);
  ready = false; tenantStatus = 'suspended';
  await assert.rejects(setup.ensureCloneReady({ clerkId: 'b' }), { code: 'SETUP_UNAVAILABLE' }); assert.deepEqual(initialized, ['a']);
});

test('direct speech validates auth and text before setup and uses only the saved personal voice', async () => {
  let signedIn = true; let voice = 'owned-voice'; const calls = [];
  const http = { PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' }, cloneErrorResponse: e => Response.json({ error: e.message }, { status: e.status || 503 }) };
  const route = load('app/api/clone/speech/route.ts', {
    'next/server': { NextResponse: { json: Response.json } }, '@/lib/clone/http': http, '@/lib/clone/errors': errors, '@/lib/clone/guard': guard,
    '@/lib/auth': { requireUser: async () => { if (!signedIn) throw new errors.CloneError('AUTH', 'Sign in', 401); return { clerkId: 'a', sub: 'a' }; } },
    '@/lib/data/users': { findUserById: async () => ({ prefs: { personal_voice_id: voice } }) },
    '@/lib/voice/samples': { personalVoiceId: prefs => prefs.personal_voice_id },
    '@/lib/voice/elevenlabs': { VoiceServiceError: class VoiceServiceError extends Error {} },
    '@/lib/clone/setup': { ensureCloneReady: async session => calls.push(['setup', session.clerkId]) },
    '@/lib/clone/audio': { savedSpeech: async (...args) => { calls.push(args); return { id: 'saved-audio' }; } },
  });
  const request = text => new Request('https://eternime.org/api/clone/speech', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voiceId:'foreign-voice',clerkId:'b',delivery:'steady'})});
  assert.equal((await route.POST(request(' '))).status,400); assert.equal((await route.POST(request('a'.repeat(351)))).status,400); assert.equal(calls.length,0);
  voice = null; assert.equal((await route.POST(request('Hola'))).status,409); assert.equal(calls.length,0); voice='owned-voice';
  const result = await route.POST(request('Hola')); assert.equal(result.status,200); assert.match(result.headers.get('Cache-Control'),/no-store/);
  assert.deepEqual(calls,[['setup','a'],['a','owned-voice','Hola','steady']]);
  signedIn = false; assert.equal((await route.POST(request('Hola'))).status,401); assert.equal(calls.length,2);
});

test('changing voice delivery creates a new audio result while repeats reuse it', async () => {
  let calls = 0;
  const audio = load('lib/clone/audio.ts', { './errors': errors, './media-store': store, '@/lib/voice/elevenlabs': { synthesizePersonalVoice: async () => { calls++; return new Response('speech'); } } });
  const natural = await audio.savedSpeech('a','voice-delivery','Mi prueba','natural');
  const steady = await audio.savedSpeech('a','voice-delivery','Mi prueba','steady');
  const repeated = await audio.savedSpeech('a','voice-delivery','Mi prueba','steady');
  assert.notEqual(natural.id,steady.id); assert.equal(steady.id,repeated.id); assert.equal(calls,2);
});

test('voice replacement atomically keeps the current voice when a stale session tries to replace it', async () => {
  const sql = await getCloneSql('b');
  await sql`CREATE TABLE eternime_users (id text PRIMARY KEY,prefs jsonb)`;
  await sql`INSERT INTO eternime_users VALUES ('a','{"personal_voice_id":"original"}'),('b','{"personal_voice_id":"other"}')`;
  const voices = load('lib/data/personal-voice.ts', { '@/lib/db': { getSql: () => sql } });
  assert.equal(await voices.replacePersonalVoice('a','wrong','new'),false);
  assert.equal((await sql`SELECT prefs FROM eternime_users WHERE id='a'`)[0].prefs.personal_voice_id,'original');
  const results = await Promise.all([voices.replacePersonalVoice('a','original','new-one'),voices.replacePersonalVoice('a','original','new-two')]);
  assert.equal(results.filter(Boolean).length,1);
  assert.equal((await sql`SELECT prefs FROM eternime_users WHERE id='b'`)[0].prefs.personal_voice_id,'other');
});
