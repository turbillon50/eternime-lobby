type AudioChunkHandler = (base64Pcm16: string) => void;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const stride = 0x8000;
  for (let i = 0; i < bytes.length; i += stride) binary += String.fromCharCode(...bytes.subarray(i, i + stride));
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downsample(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    output[i] = sum / Math.max(1, end - start);
  }
  return output;
}

function floatToPcm16(input: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

/** Micrófono PCM 16 kHz hacia Gemini y salida PCM 24 kHz hacia bocina. */
export class LiveAudioBridge {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private playbackAt = 0;
  private playing = new Set<AudioBufferSourceNode>();

  async start(onChunk: AudioChunkHandler) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    this.inputContext = new AudioContext({ latencyHint: "interactive" });
    await this.inputContext.resume();
    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(2048, 1, 1);
    this.silentGain = this.inputContext.createGain();
    this.silentGain.gain.value = 0;
    this.processor.onaudioprocess = (event) => {
      const mono = event.inputBuffer.getChannelData(0);
      onChunk(bytesToBase64(floatToPcm16(downsample(mono, event.inputBuffer.sampleRate, 16_000))));
    };
    this.inputSource.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.inputContext.destination);
  }

  async play(base64Pcm16: string) {
    if (!base64Pcm16) return;
    if (!this.outputContext) this.outputContext = new AudioContext({ latencyHint: "interactive", sampleRate: 24_000 });
    await this.outputContext.resume();
    const bytes = base64ToBytes(base64Pcm16);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const samples = Math.floor(bytes.byteLength / 2);
    const audio = this.outputContext.createBuffer(1, samples, 24_000);
    const channel = audio.getChannelData(0);
    for (let i = 0; i < samples; i += 1) channel[i] = view.getInt16(i * 2, true) / 0x8000;
    const source = this.outputContext.createBufferSource();
    source.buffer = audio;
    source.connect(this.outputContext.destination);
    this.playbackAt = Math.max(this.playbackAt, this.outputContext.currentTime + 0.015);
    source.start(this.playbackAt);
    this.playbackAt += audio.duration;
    this.playing.add(source);
    source.onended = () => this.playing.delete(source);
  }

  stopPlayback() {
    for (const source of this.playing) try { source.stop(); } catch { /* already stopped */ }
    this.playing.clear();
    this.playbackAt = this.outputContext?.currentTime ?? 0;
  }

  async close() {
    this.stopPlayback();
    this.processor?.disconnect();
    this.inputSource?.disconnect();
    this.silentGain?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    await Promise.allSettled([this.inputContext?.close(), this.outputContext?.close()].filter(Boolean) as Promise<void>[]);
    this.inputContext = null;
    this.outputContext = null;
    this.processor = null;
    this.inputSource = null;
    this.silentGain = null;
    this.stream = null;
  }
}
