import type { LiveServerMessage, Session } from "@google/genai";

export type VoiceStatus = "idle" | "microphone" | "connecting" | "listening" | "speaking" | "acting" | "error";
export type VoiceBridge = {
  preparePlaybackFromUserGesture(): Promise<void>;
  start(onChunk: (chunk: string) => void): Promise<void>;
  close(): Promise<void>;
};
type Callbacks = { onopen: () => void; onmessage: (message: LiveServerMessage) => void; onerror: () => void; onclose: (event: { code: number }) => void };
type Dependencies = {
  createBridge: () => VoiceBridge;
  connect: (callbacks: Callbacks, signal: AbortSignal) => Promise<Session>;
  status: (status: VoiceStatus, error?: string) => void;
  message: (message: LiveServerMessage) => void;
  ended: () => void;
  timeoutMs?: number;
};

/** Owns one microphone/socket attempt. Late promises cannot reopen a stopped call. */
export class LiveVoiceSession {
  private attempt: { abort: AbortController; bridge: VoiceBridge; session?: Session; ready: boolean } | null = null;
  constructor(private readonly dependencies: Dependencies) {}
  get active() { return this.attempt !== null; }
  get session() { return this.attempt?.ready ? this.attempt.session : undefined; }

  stop(status: "idle" | "error" = "idle", message?: string) {
    const current = this.attempt;
    this.attempt = null;
    current?.abort.abort();
    try { current?.session?.close(); } catch { /* socket already closed */ }
    if (current) { void current.bridge.close(); this.dependencies.ended(); }
    this.dependencies.status(status, message);
  }

  async start() {
    if (this.attempt) return;
    const current = { abort: new AbortController(), bridge: this.dependencies.createBridge(), ready: false, session: undefined as Session | undefined };
    this.attempt = current;
    const valid = () => this.attempt === current && !current.abort.signal.aborted;
    this.dependencies.status("microphone");
    let timer: ReturnType<typeof setTimeout>;
    const stopped = new Promise<never>((_, reject) => {
      current.abort.signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
      timer = setTimeout(() => { if (valid()) this.stop("error", "No pude conectar a tiempo. Revisa el permiso de micrófono y vuelve a intentar."); }, this.dependencies.timeoutMs ?? 35_000);
    });
    let setupReady: () => void = () => {};
    const setup = new Promise<void>(resolve => { setupReady = resolve; });
    const establish = async () => {
      await current.bridge.preparePlaybackFromUserGesture();
      if (!valid()) return;
      await current.bridge.start(data => {
        if (!valid() || !current.ready) return;
        try { current.session?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }); }
        catch { this.stop("error", "La conexión se interrumpió. Toca Volver a conectar."); }
      });
      if (!valid()) return;
      this.dependencies.status("connecting");
      const session = await this.dependencies.connect({
        onopen: () => {}, // An open socket alone does not mean the model is ready.
        onmessage: message => {
          if (!valid()) return;
          if (message.setupComplete) setupReady();
          this.dependencies.message(message);
        },
        onerror: () => { if (valid()) this.stop("error", "No pude mantener la conexión. Toca Volver a conectar."); },
        onclose: () => { if (valid()) this.stop("error", "La conversación terminó. Puedes volver a conectar."); },
      }, current.abort.signal);
      if (!valid()) { session.close(); return; }
      current.session = session;
      await setup;
      if (!valid()) return;
      current.ready = true;
      this.dependencies.status("listening");
      // Audible confirmation: the user should know the connection really works.
      session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Salúdame brevemente en español y dime que ya puedes escucharme." }] }], turnComplete: true });
    };
    try { await Promise.race([establish(), stopped]); }
    catch (error) {
      if (valid()) {
        const name = error instanceof Error ? error.name : "";
        const message = name === "NotAllowedError" ? "Permite el micrófono en tu navegador y vuelve a intentar."
          : name === "NotFoundError" ? "No encuentro un micrófono. Conecta uno o escríbeme."
          : name === "NotReadableError" ? "Otra aplicación está usando el micrófono. Ciérrala y vuelve a intentar."
          : name === "TypeError" ? "No pude conectar con el servicio de voz. Revisa tu internet y vuelve a intentar."
          : error instanceof Error ? error.message : "No pude iniciar la voz. Vuelve a intentar.";
        this.stop("error", message);
      }
    } finally { clearTimeout(timer!); }
  }
}
