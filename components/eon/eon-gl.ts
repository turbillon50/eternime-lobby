/**
 * EON — motor gráfico de la presencia.
 *
 * WebGL1 crudo sobre un canvas pequeño. CERO dependencias nuevas: three y
 * @react-three/* estaban en package.json pero sin uso real, y meter el runtime
 * completo de three (~600 KB) para dibujar UNA esfera no se justifica. Aquí
 * son ~9 KB de shader propio, control total del coste y fallback garantizado.
 *
 * No es un vídeo, ni un GIF, ni una esfera girando: es un orbe de cristal
 * óptico con filamentos vivos, caústicas internas, partículas volumétricas,
 * refracción en el canto y respiración casi imperceptible.
 */

export type EonState =
  | "idle"
  | "listening"
  | "thinking"
  | "acting"
  | "success"
  | "error"
  | "offline";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform float uSpeed;     // ritmo del flujo interno
uniform float uExpand;    // expansión / contracción del cuerpo
uniform float uAmber;     // pulsos ámbar (memoria, compromiso, atención)
uniform float uFocus;     // concentración violeta (pensamiento)
uniform float uBright;    // energía global
uniform float uFlash;     // apertura luminosa breve (éxito)
uniform vec2  uPointer;   // reacción sutil al cursor / touch
uniform float uAudio;     // nivel de audio real (escucha)
uniform vec2  uDir;       // dirección de los filamentos (acción)
uniform float uShells;    // calidad: número de capas internas

const vec3 VIOLET = vec3(0.545, 0.361, 1.0);
const vec3 ULTRA  = vec3(0.427, 0.212, 1.0);
const vec3 INDIGO = vec3(0.204, 0.125, 0.435);
const vec3 AMBER  = vec3(1.0, 0.667, 0.271);
const vec3 IVORY  = vec3(0.957, 0.937, 0.910);
const vec3 CYAN   = vec3(0.475, 0.906, 1.0);

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// Filamento: cresta fina y orgánica, no una mancha difusa
float filament(vec3 p, float sharp) {
  float n = fbm(p);
  float ridge = 1.0 - abs(n * 2.0 - 1.0);
  return pow(clamp(ridge, 0.0, 1.0), sharp);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float r = length(uv);

  float R = 0.78 * uExpand;
  float t = uTime * uSpeed;

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  // ── Resplandor exterior: ceñido al canto, nunca una mancha difusa ────
  float glow = exp(-max(r - R, 0.0) * 13.0);
  vec3 glowCol = mix(ULTRA, VIOLET, 0.5 + 0.5 * sin(t * 0.6));
  glowCol = mix(glowCol, AMBER, uAmber * 0.5);
  col += glowCol * glow * 0.22 * uBright;
  alpha += glow * 0.26;

  if (r < R) {
    // Normal de la esfera (bordes perfectamente nítidos por el mask)
    float z = sqrt(max(R * R - r * r, 0.0));
    vec3 N = vec3(uv, z) / R;
    vec3 V = vec3(0.0, 0.0, 1.0);

    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);

    // Lensing: el interior se comprime hacia el canto como en vidrio real
    float lens = 1.0 + fres * 0.55;
    vec3 P = vec3(uv * lens, z);

    // Luz que responde al puntero (sutil, nunca protagonista)
    vec3 L = normalize(vec3(uPointer.x * 0.55 - 0.30, uPointer.y * 0.40 + 0.44, 0.82));

    // ── Capas internas: profundidad real, no un plano ─────────────────
    vec3 inner = vec3(0.0);
    float shells = uShells;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= shells) break;
      float fi = float(i) / max(shells - 1.0, 1.0);

      // Cada capa vive a distinta profundidad dentro de la esfera
      vec3 q = P * (1.25 + fi * 1.9);
      q.z -= fi * 0.6;

      // Domain warping -> movimiento fluido y NO repetitivo
      vec3 flow = vec3(uDir * 0.5, 0.28);
      vec3 w = q + flow * t * 0.55;
      float warp = fbm(w * 0.9 + vec3(0.0, 0.0, t * 0.18));
      vec3 qq = q + vec3(warp) * (1.5 + uFocus * 1.1) + flow * t * 0.3;

      // Dos familias anisótropas que se cruzan -> malla de hilos, no nube.
      // El estirado del dominio alarga las crestas hasta volverlas filamentos.
      float sharp = 9.0 + uFocus * 5.0;
      float f1 = filament(qq * vec3(1.0, 2.7, 1.0), sharp);
      float f2 = filament(qq.zxy * vec3(2.7, 1.0, 1.0) + 5.73, sharp);

      // Caústicas internas: familia lenta y ancha que modula el brillo
      float caus = filament(qq * 0.5 - vec3(0.0, 0.0, t * 0.22), 3.4);
      // El umbral abre huecos negros reales entre hilo e hilo
      float fil = max(max(f1, f2 * 0.85) - 0.055, 0.0) * (0.5 + caus * 0.85);

      // Absorción por profundidad: el fondo de la esfera se apaga (masa)
      float depthW = mix(1.0, 0.18, fi * fi);

      // Color por profundidad: ultravioleta al fondo, violeta al frente
      vec3 layerCol = mix(ULTRA, VIOLET, fi);
      layerCol = mix(layerCol, INDIGO, 0.32 * (1.0 - fi));

      // Corriente ámbar: humanidad y memoria. Viaja por la segunda familia
      // de hilos, así violeta y ámbar se entretejen en vez de mezclarse.
      float amberFlow = smoothstep(0.28, 0.85, f2) * smoothstep(0.35, 0.9, caus);
      layerCol = mix(layerCol, AMBER, clamp(amberFlow * (0.55 + uAmber * 1.6), 0.0, 0.92));

      inner += layerCol * fil * depthW;
    }
    inner *= 2.45 / max(shells * 0.5, 1.0);

    // El cristal absorbe hacia el canto: silueta oscura, interior vivo
    inner *= mix(1.0, 0.28, smoothstep(0.45, 1.0, r / R));

    // Cuerpo de cristal oscuro: absorbe, no ilumina
    inner += INDIGO * 0.035;

    // Núcleo: masa y conciencia — ceñido, no un globo de luz
    float core = exp(-r * r * 15.0);
    inner += mix(ULTRA, VIOLET, 0.5) * core * 0.14;
    inner += IVORY * pow(core, 2.5) * (0.10 + uFlash * 0.85);

    // Sombreado direccional: volumen, no disco plano
    float lam = clamp(dot(N, L), 0.0, 1.0);
    inner *= 0.42 + 0.86 * lam;

    // Partículas volumétricas / destellos marfil — pocos y pequeños
    float sp = vnoise(P * 30.0 + vec3(0.0, 0.0, t * 1.6));
    float sparkle = smoothstep(0.955, 0.999, sp);
    inner += IVORY * sparkle * 0.34 * (0.5 + uAudio);

    // Señal técnica cian, excepcional y mínima
    float pin = smoothstep(0.965, 1.0, vnoise(P * 13.0 - vec3(t * 0.5)));
    inner += CYAN * pin * 0.22;

    // ── Canto óptico: refracción y reflejo interno ────────────────────
    vec3 rimCol = mix(VIOLET, IVORY, 0.42);
    rimCol = mix(rimCol, AMBER, uAmber * 0.35);
    inner += rimCol * fres * (0.5 + uFlash * 0.7);

    // Reflejo especular pequeño y nítido: cristal, no plástico
    vec3 H = normalize(L + V);
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), 190.0);
    inner += IVORY * spec * 0.42;

    // El cuerpo absorbe luz en el centro-bajo: cristal ÓSCURO
    inner *= mix(0.72, 1.15, smoothstep(0.0, 1.0, 0.5 + 0.5 * N.y));

    col += inner * uBright;

    // Borde perfectamente nítido (antialias de 2 px)
    float px = 2.0 / min(uRes.x, uRes.y);
    float mask = 1.0 - smoothstep(R - px, R, r);
    alpha = max(alpha, mask);
    col *= mix(1.0, 1.0, mask);
  }

  // Vignette interna para que el negro OLED respire
  col *= 1.0 - 0.18 * smoothstep(0.3, 1.2, r);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

type Target = {
  speed: number;
  expand: number;
  amber: number;
  focus: number;
  bright: number;
  dirX: number;
  dirY: number;
};

/** Perfil visual de cada estado. Sólo se conectan a actividad REAL. */
const STATES: Record<EonState, Target> = {
  //         speed expand amber focus bright dirX dirY
  idle:      { speed: 0.30, expand: 1.00, amber: 0.22, focus: 0.10, bright: 1.00, dirX: 0.0,  dirY: 0.0 },
  listening: { speed: 0.52, expand: 1.07, amber: 0.34, focus: 0.18, bright: 1.16, dirX: 0.0,  dirY: 0.3 },
  thinking:  { speed: 1.05, expand: 0.985, amber: 0.10, focus: 1.00, bright: 1.10, dirX: 0.0,  dirY: 0.0 },
  acting:    { speed: 0.82, expand: 1.03, amber: 0.62, focus: 0.55, bright: 1.20, dirX: 0.85, dirY: 0.18 },
  success:   { speed: 0.42, expand: 1.05, amber: 0.42, focus: 0.15, bright: 1.34, dirX: 0.0,  dirY: 0.0 },
  // Contracción sutil y pulso contenido — NO rojo agresivo
  error:     { speed: 0.24, expand: 0.935, amber: 0.80, focus: 0.30, bright: 0.86, dirX: 0.0,  dirY: -0.25 },
  // Energía mínima, estable y reconocible
  offline:   { speed: 0.07, expand: 0.97, amber: 0.05, focus: 0.0,  bright: 0.46, dirX: 0.0,  dirY: 0.0 },
};

export type EonRendererOptions = {
  /** 0 = mínima (móvil limitado), 1 = completa */
  quality?: number;
};

export class EonRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private running = false;
  private t0 = 0;
  private cur: Target = { ...STATES.idle };
  private target: Target = { ...STATES.idle };
  private pointer = { x: 0, y: 0 };
  private audio = 0;
  private flash = 0;
  private shells: number;
  private dpr: number;
  private lost = false;

  constructor(
    private canvas: HTMLCanvasElement,
    opts: EonRendererOptions = {},
  ) {
    const q = opts.quality ?? 1;
    // Menos capas y menor DPR en equipos limitados
    this.shells = q >= 1 ? 5 : q >= 0.6 ? 4 : 3;
    this.dpr = Math.min(window.devicePixelRatio || 1, q >= 1 ? 2 : 1.4);
  }

  /** true si WebGL quedó listo; false -> el llamador usa el fallback CSS. */
  init(): boolean {
    const attrs: WebGLContextAttributes = {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: false,
    };
    const gl = (this.canvas.getContext("webgl", attrs) ||
      this.canvas.getContext("experimental-webgl", attrs)) as WebGLRenderingContext | null;
    if (!gl) return false;
    this.gl = gl;

    const vs = this.compile(gl.VERTEX_SHADER, VERT);
    const fs = this.compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return false;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = prog;
    gl.useProgram(prog);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // Triángulo que cubre el viewport
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    for (const n of ["uRes","uTime","uSpeed","uExpand","uAmber","uFocus","uBright","uFlash","uPointer","uAudio","uDir","uShells"]) {
      this.loc[n] = gl.getUniformLocation(prog, n);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    this.canvas.addEventListener("webglcontextlost", this.onLost, false);
    this.canvas.addEventListener("webglcontextrestored", this.onRestored, false);

    this.resize();
    this.t0 = performance.now();
    return true;
  }

  private compile(type: number, src: string): WebGLShader | null {
    const gl = this.gl!;
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[EON] shader:", gl.getShaderInfoLog(s));
      }
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.stop();
  };

  private onRestored = () => {
    this.lost = false;
    if (this.init()) this.start();
  };

  resize() {
    const gl = this.gl;
    if (!gl) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * this.dpr));
    const h = Math.max(1, Math.round(rect.height * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }

  setState(state: EonState) {
    const next = STATES[state] ?? STATES.idle;
    this.target = { ...next };
    // El éxito abre luz un instante y luego relaja
    if (state === "success") this.flash = 1;
  }

  setPointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  /** Nivel de audio real 0..1 (sólo si ya hay permiso y stream). */
  setAudio(level: number) {
    this.audio = Math.max(0, Math.min(1, level));
  }

  /** Un solo frame — usado por reduced-motion (versión estática elegante). */
  renderStatic() {
    this.cur = { ...this.target };
    this.draw(2.2);
  }

  start() {
    if (this.running || this.lost || !this.gl) return;
    this.running = true;
    this.t0 = performance.now();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const t = (performance.now() - this.t0) / 1000;
      // Interpolación suave: los estados no saltan, fluyen
      const k = 0.055;
      const c = this.cur, g = this.target;
      c.speed  += (g.speed  - c.speed)  * k;
      c.expand += (g.expand - c.expand) * k;
      c.amber  += (g.amber  - c.amber)  * k;
      c.focus  += (g.focus  - c.focus)  * k;
      c.bright += (g.bright - c.bright) * k;
      c.dirX   += (g.dirX   - c.dirX)   * k;
      c.dirY   += (g.dirY   - c.dirY)   * k;
      this.flash *= 0.94;
      this.draw(t);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private draw(t: number) {
    const gl = this.gl;
    if (!gl || !this.program) return;
    const c = this.cur;
    // Respiración casi imperceptible, siempre presente
    const breath = 1 + Math.sin(t * 0.55) * 0.012;
    gl.uniform2f(this.loc.uRes!, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.loc.uTime!, t);
    gl.uniform1f(this.loc.uSpeed!, c.speed);
    gl.uniform1f(this.loc.uExpand!, c.expand * breath);
    gl.uniform1f(this.loc.uAmber!, c.amber);
    gl.uniform1f(this.loc.uFocus!, c.focus);
    gl.uniform1f(this.loc.uBright!, c.bright);
    gl.uniform1f(this.loc.uFlash!, this.flash);
    gl.uniform2f(this.loc.uPointer!, this.pointer.x, this.pointer.y);
    gl.uniform1f(this.loc.uAudio!, this.audio);
    gl.uniform2f(this.loc.uDir!, c.dirX, c.dirY);
    gl.uniform1f(this.loc.uShells!, this.shells);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.stop();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    const gl = this.gl;
    if (gl) {
      if (this.buffer) gl.deleteBuffer(this.buffer);
      if (this.program) gl.deleteProgram(this.program);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    }
    this.gl = null;
    this.program = null;
    this.buffer = null;
  }
}
