import assert from "node:assert/strict";
import { cloneSnapshot, getCloneExchange, profileSignature, reviewCloneExchange, saveCloneExchange, saveCloneFact } from "../lib/data/clone";
const a = "test-a", b = "test-b";
assert.equal((await cloneSnapshot(a)).facts.length, 0);
assert.equal((await cloneSnapshot(b)).facts.length, 0);
await saveCloneFact(a, "historia", "Recuerdo sintético A", 0);
assert.equal((await cloneSnapshot(b)).facts.length, 0, "No personal facts cross database boundaries");
const concurrent = await Promise.allSettled([
  saveCloneFact(a, "historia", "Corrección A", 1),
  saveCloneFact(a, "historia", "Corrección B", 1),
]);
assert.equal(concurrent.filter(x => x.status === "fulfilled").length, 1);
assert.equal(concurrent.filter(x => x.status === "rejected").length, 1);
const snapshot = await cloneSnapshot(a);
assert.equal(snapshot.facts[0].revision, 2);
assert.equal(snapshot.versions.length, 2);
assert(snapshot.versions.some(v => v.content === "Recuerdo sintético A"));
const id = "11111111-1111-4111-8111-111111111111";
const exchange = { id, userText: "¿Cómo lo diría?", cloneText: "Respuesta sintética", signature: profileSignature(snapshot.facts) };
await saveCloneExchange(a, exchange); await saveCloneExchange(a, exchange);
assert.equal((await cloneSnapshot(a)).messages.length, 2, "Retries preserve a single exchange");
await reviewCloneExchange(a, id, true);
assert.equal((await cloneSnapshot(a)).progress.recognitionPercent, 100);
assert.equal(await getCloneExchange(b, id), undefined);
await assert.rejects(reviewCloneExchange(b, id, false), { code: "MESSAGE_NOT_FOUND" });
await saveCloneFact(a, "historia", "Versión actual corregida", 2);
assert.equal((await cloneSnapshot(a)).progress.recognitionPercent, null, "An old review does not certify a new profile version");
assert.equal((await cloneSnapshot(a)).progress.coveragePercent, 20);
assert.equal((await cloneSnapshot(b)).messages.length, 0);
console.log("PASS: separate databases, atomic corrections, version history, safe retries, scoped reviews and honest progress.");
