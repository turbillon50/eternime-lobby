const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
function load(file,globals={}){const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('exports','module',...Object.keys(globals),code)(module.exports,module,...Object.values(globals));return module.exports;}
const {LiveVoiceSession}=load('lib/voice/live-session.ts');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const tick=()=>new Promise(r=>setImmediate(r));
function harness(options={}){
 const states=[];const bridges=[];const sessions=[];let callbacks;let connections=0;let endings=0;const connected=deferred();
 const session={closed:0,sent:[],greetings:[],close(){this.closed++},sendRealtimeInput(v){this.sent.push(v)},sendClientContent(v){this.greetings.push(v)}};
 const controller=new LiveVoiceSession({timeoutMs:options.timeoutMs??300,status:(s,e)=>states.push({s,e}),message:()=>{},ended:()=>endings++,createBridge:()=>{const bridge={closed:0,preparePlaybackFromUserGesture:async()=>{},start:async f=>{bridge.chunk=f;await options.permission?.promise},close:async()=>{bridge.closed++}};bridges.push(bridge);return bridge},connect:async cb=>{callbacks=cb;connections++;await options.connection?.promise;sessions.push(session);connected.resolve();return session}});
 return {controller,states,bridges,session,connected,get cb(){return callbacks},get connections(){return connections},get endings(){return endings}};
}
test('one microphone/socket, no audio before setup, and an audible greeting after readiness',async()=>{
 const h=harness();const running=h.controller.start();void h.controller.start();await h.connected.promise;await tick();
 assert.equal(h.connections,1);assert.equal(h.bridges.length,1);assert.equal(h.controller.session,undefined);
 h.bridges[0].chunk('early');assert.equal(h.session.sent.length,0);assert.ok(!h.states.some(x=>x.s==='listening'));
 h.cb.onmessage({setupComplete:{}});await running;assert.equal(h.controller.session,h.session);assert.equal(h.session.greetings.length,1);
 h.bridges[0].chunk('after');assert.equal(h.session.sent[0].audio.data,'after');h.controller.stop();assert.equal(h.session.closed,1);assert.equal(h.bridges[0].closed,1);
});
test('cancel while microphone permission is pending never opens a connection later',async()=>{
 const permission=deferred();const h=harness({permission});const running=h.controller.start();await tick();h.controller.stop();await running;permission.resolve();await tick();
 assert.equal(h.connections,0);assert.equal(h.controller.active,false);assert.equal(h.bridges[0].closed,1);assert.equal(h.states.at(-1).s,'idle');
});
test('a socket that finishes connecting after cancellation is immediately closed',async()=>{
 const connection=deferred();const h=harness({connection});const running=h.controller.start();await tick();h.controller.stop();await running;connection.resolve();await tick();
 assert.equal(h.session.closed,1);assert.equal(h.controller.active,false);assert.equal(h.states.at(-1).s,'idle');
});
test('socket rejection before opening ends the wait and releases the microphone',async()=>{
 const connection=deferred();const h=harness({connection});const running=h.controller.start();await tick();h.cb.onclose({code:1008});await running;
 assert.equal(h.controller.active,false);assert.equal(h.states.at(-1).s,'error');assert.equal(h.bridges[0].closed,1);
 connection.resolve();await tick();assert.equal(h.session.closed,1);
});
test('missing setup times out instead of claiming listening; retry can connect',async()=>{
 const h=harness({timeoutMs:15});await h.controller.start();assert.equal(h.states.at(-1).s,'error');assert.equal(h.controller.active,false);assert.equal(h.session.greetings.length,0);
 const retry=h.controller.start();await tick();h.cb.onmessage({setupComplete:{}});await retry;assert.equal(h.states.at(-1).s,'listening');h.controller.stop();
});
test('stale close callbacks cannot stop a new conversation',async()=>{
 const h=harness();const first=h.controller.start();await tick();h.cb.onmessage({setupComplete:{}});await first;const previous=h.cb;h.controller.stop();
 const second=h.controller.start();await tick();h.cb.onmessage({setupComplete:{}});await second;previous.onclose({code:1000});assert.equal(h.controller.active,true);assert.equal(h.states.at(-1).s,'listening');h.controller.stop();
});
function bridgeHarness(permission){
 const contexts=[];let stopped=0;const track={enabled:true,stop:()=>stopped++};const stream={getTracks:()=>[track]};
 class AudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.destination={};this.started=[];contexts.push(this)}
  async resume(){this.state='running'} async close(){this.state='closed'}
  createBuffer(ch,length,rate){return {duration:length/rate,getChannelData:()=>new Float32Array(length)}}
  createBufferSource(){const ctx=this;return {connect(){},start(){ctx.started.push(this)},stop(){}}}
  createMediaStreamSource(){return {connect(){},disconnect(){}}}
  createScriptProcessor(){this.processor={connect(){},disconnect(){}};return this.processor}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
 }
 const {LiveAudioBridge}=load('lib/voice/live-audio-client.ts',{AudioContext,navigator:{mediaDevices:{getUserMedia:async()=>{await permission?.promise;return stream}}}});
 return {bridge:new LiveAudioBridge(),contexts,track,get stopped(){return stopped}};
}
test('both audio contexts are unlocked during the original click, before asking for mic permission',async()=>{
 const h=bridgeHarness();const promise=h.bridge.preparePlaybackFromUserGesture();assert.equal(h.contexts.length,2);assert.ok(h.contexts.every(c=>c.state==='running'));await promise;await h.bridge.start(()=>{});assert.equal(h.contexts.length,2);await h.bridge.close();assert.equal(h.stopped,1);
});
test('late browser permission cannot leave the microphone on after cancellation',async()=>{
 const permission=deferred();const h=bridgeHarness(permission);await h.bridge.preparePlaybackFromUserGesture();const opening=h.bridge.start(()=>{});await h.bridge.close();permission.resolve();await opening;assert.equal(h.stopped,1);assert.ok(h.contexts.every(c=>c.state==='closed'));
});
test('short final PCM packets are flushed and closed bridges ignore late audio',async()=>{
 const h=bridgeHarness();await h.bridge.preparePlaybackFromUserGesture();const output=h.contexts[1];const silent=output.started.length;
 const pcm=Buffer.alloc(2400).toString('base64');await h.bridge.play(pcm);assert.equal(output.started.length,silent);h.bridge.finishPlayback();assert.equal(output.started.length,silent+1);await h.bridge.close();await h.bridge.play(pcm);assert.equal(output.started.length,silent+1);
});
test('mute disables the microphone track and never forwards its captured samples',async()=>{
 const h=bridgeHarness();const sent=[];await h.bridge.preparePlaybackFromUserGesture();await h.bridge.start(chunk=>sent.push(Buffer.from(chunk,'base64')));
 const event={inputBuffer:{sampleRate:16000,getChannelData:()=>new Float32Array([.5,-.5,.25])}};
 h.contexts[0].processor.onaudioprocess(event);assert.ok(sent.at(-1).some(value=>value!==0));
 h.bridge.setMuted(true);assert.equal(h.track.enabled,false);h.contexts[0].processor.onaudioprocess(event);assert.ok(sent.at(-1).every(value=>value===0));
 h.bridge.setMuted(false);assert.equal(h.track.enabled,true);h.contexts[0].processor.onaudioprocess(event);assert.ok(sent.at(-1).some(value=>value!==0));await h.bridge.close();
});
