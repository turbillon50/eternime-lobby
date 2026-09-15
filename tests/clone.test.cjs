const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, stubs = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'server-only') return {};
    if (Object.hasOwn(stubs, name)) return stubs[name];
    if (name === './personal-settings') return load('lib/voice/personal-settings.ts');
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const profile = load('lib/clone/profile.ts');
const samples = load('lib/voice/samples.ts');
const identity = load('lib/identity.ts');
const errors = load('lib/clone/errors.ts');

test('coverage counts distinct confirmed topics; no ratings never means 0% similarity', () => {
  const fact = { topic: 'historia', content: 'Un recuerdo', revision: 1 };
  const progress = profile.cloneProgress([fact, fact, { topic: 'valores', content: ' ', revision: 1 }], []);
  assert.equal(progress.coveragePercent, 20);
  assert.equal(progress.recognitionPercent, null);
  assert.equal(profile.cloneProgress([], [{ recognized: true }, { recognized: false }]).recognitionPercent, 50);
});
test('photos count six distinct angles, excluding optional video and duplicates', () => {
  const rows = [...identity.IDENTITY_POSES, { pose: 'motion' }].map(x => ({ pose: x.id || x.pose }));
  assert.equal(identity.completedIdentityPoses([...rows, { pose: 'front' }]).size, 6);
});
test('voice rejects oversized batches and a seventh file instead of silently dropping samples', () => {
  assert.match(samples.validateVoiceSamples([{ type: 'audio/mpeg', size: 3_800_001 }]), /3.8 MB/);
  assert.match(samples.validateVoiceSamples(Array(7).fill({ type: 'audio/mpeg', size: 100 })), /seis/);
  assert.ok(samples.validateVoiceSamples([{ type: 'image/jpeg', size: 100 }]));
  assert.equal(samples.validateVoiceSamples([{ type: 'audio/mp4', size: 300_000 }]), null);
  assert.equal(samples.recordingExtension('audio/mp4;codecs=mp4a.40.2'), 'm4a');
  assert.equal(samples.personalVoiceId({ eon_voice_id: 'legacy-personal' }), 'legacy-personal');
});
test('voice availability uses the actual ElevenLabs entitlement', async () => {
  const old = global.fetch;
  const oldKey = process.env.ELEVENLABS_API_KEY;
  process.env.ELEVENLABS_API_KEY = 'test-key';
  try {
    global.fetch = async () => Response.json({ can_use_instant_voice_cloning: false });
    assert.equal((await load('lib/voice/elevenlabs.ts').cloningCapability()).available, false);
    global.fetch = async () => Response.json({ can_use_instant_voice_cloning: true });
    assert.equal((await load('lib/voice/elevenlabs.ts').cloningCapability()).available, true);
  } finally { global.fetch = old; if (oldKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = oldKey; }
});
test('new Neon branches resolve a missing inline connection URI', async () => {
  const old = global.fetch;
  const names = ['NEON_API_KEY', 'NEON_PROJECT_ID', 'DATABASE_URL'];
  const saved = Object.fromEntries(names.map(n => [n, process.env[n]]));
  Object.assign(process.env, { NEON_API_KEY: 'test', NEON_PROJECT_ID: 'test', DATABASE_URL: 'postgres://owner:secret@control.example/maindb' });
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options?.method });
    return calls.length === 1 ? Response.json({ branch: { id: 'br-test' } }) : Response.json({ uri: 'postgres://owner:secret@ep-test.neon.tech/maindb' });
  };
  try {
    const branch = await load('lib/neon/branches.ts').createTenantBranch('person-a');
    assert.equal(branch.branchId, 'br-test');
    const lookup = new URL(calls[1].url);
    assert.equal(lookup.searchParams.get('branch_id'), 'br-test');
    assert.equal(lookup.searchParams.get('database_name'), 'maindb');
    assert.equal(new URL(branch.pooledUrl).hostname, 'ep-test-pooler.neon.tech');
    assert.equal(calls.length, 2);
  } finally { global.fetch = old; for (const n of names) if (saved[n] === undefined) delete process.env[n]; else process.env[n] = saved[n]; }
});
test('clone resolver selects a second database for each person and refuses suspended owners', async () => {
  let owner = { status: 'ready', branchId: 'br-user', encrypted: 'ciphertext' };
  const seen = [];
  const resolver = load('lib/db/clone.ts', {
    '@neondatabase/serverless': { neon: url => { seen.push(new URL(url)); return async () => []; } },
    'drizzle-orm/neon-http': { drizzle: x => x },
    'drizzle-orm/neon-http/migrator': { migrate: async () => {} },
    'drizzle-orm': { eq: () => true },
    '@/lib/db/control': { getControlDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: async () => owner ? [owner] : [] }) }) }) }) },
    '@/lib/db/schema/control-plane': { users: {} },
    '@/lib/crypto/tenant-url': { decryptTenantUrl: () => 'postgres://owner:secret@ep-user-pooler.neon.tech/eon' },
    '@/lib/clone/errors': errors,
  });
  await resolver.getCloneSql('person-a'); await resolver.getCloneSql('person-b');
  assert.notEqual(seen[0].pathname, '/eon');
  assert.notEqual(seen[0].pathname, seen[1].pathname);
  assert.equal(seen[0].hostname, 'ep-user-pooler.neon.tech');
  owner = { ...owner, status: 'suspended' };
  await assert.rejects(resolver.getCloneSql('person-a'), { code: 'TENANT_UNAVAILABLE' });
  assert.equal(seen.length, 2);
});
test('clone chat uses authenticated ownership and rejects unauthenticated requests before data access', async () => {
  let signedIn = true;
  const owners = [];
  class AuthError extends Error { constructor() { super('No autenticado'); this.status = 401; } }
  const route = load('app/api/clone/messages/route.ts', {
    'next/server': { NextResponse: { json: Response.json } },
    '@/lib/auth': { requireUser: async () => { if (!signedIn) throw new AuthError(); return { clerkId: 'person-a', name: 'Persona' }; } },
    '@/lib/ai/gemini': { complete: async input => { assert.match(input.systemPrompt, /No eres Eon/); return 'Respuesta del clon'; } },
    '@/lib/data/clone': {
      getCloneExchange: async owner => { owners.push(owner); return undefined; },
      cloneSnapshot: async owner => { owners.push(owner); return { facts: [{ topic: 'historia', content: 'Recuerdo confirmado', revision: 1 }], messages: [] }; },
      profileSignature: () => 'revision-1',
      saveCloneExchange: async (owner, exchange) => { owners.push(owner); return exchange; },
    },
    '@/lib/clone/profile': profile,
    '@/lib/clone/guard': load('lib/clone/guard.ts', { './errors': errors }),
    '@/lib/clone/media-store': { reserveJob: async () => ({ fresh: true, job: { id: 'job' } }), digest: () => 'hash', consumeAllowance: async () => {}, updateJob: async () => {} },
    '@/lib/clone/errors': errors,
    '@/lib/clone/http': { UUID: /^[0-9a-f-]{36}$/, PRIVATE_HEADERS: {}, cloneErrorResponse: e => Response.json({ error: e.message }, { status: e.status || 503 }) },
  });
  const request = () => new Request('https://example.test/api/clone/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', content: 'Hola', clerkId: 'person-b' }) });
  assert.equal((await route.POST(request())).status, 201);
  assert.deepEqual(owners, ['person-a', 'person-a', 'person-a']);
  signedIn = false;
  assert.equal((await route.POST(request())).status, 401);
  assert.equal(owners.length, 3);
});

test('personal speech uses multilingual quality model and explicit voice settings', async () => {
  const original = global.fetch; const key = process.env.ELEVENLABS_API_KEY;
  process.env.ELEVENLABS_API_KEY = 'test-only';
  global.fetch = async (url, init) => {
    assert.match(url,/\/owned-voice$/);
    const body = JSON.parse(init.body); assert.equal(body.model_id,'eleven_multilingual_v2'); assert.equal(body.text,'Hola');
    assert.equal(body.voice_settings.style,0); assert.equal(body.voice_settings.stability,.7); assert.equal(body.voice_settings.use_speaker_boost,true);
    return new Response('synthetic-audio');
  };
  try { assert.equal(await (await load('lib/voice/elevenlabs.ts').synthesizePersonalVoice('owned-voice','Hola','steady')).text(),'synthetic-audio'); }
  finally { global.fetch=original; if(key===undefined) delete process.env.ELEVENLABS_API_KEY;else process.env.ELEVENLABS_API_KEY=key; }
});
