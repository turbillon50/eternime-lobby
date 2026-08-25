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
uniform float uSpeed;
uniform float uExpand;
uniform float uAmber;
uniform float uFocus;
uniform float uBright;
uniform float uFlash;
uniform vec2  uPointer;
uniform float uAudio;
uniform vec2  uDir;
uniform float uShells;

const vec3 VIOLET = vec3(0.545, 0.361, 1.0);
const vec3 ULTRA  = vec3(0.427, 0.212, 1.0);
const vec3 INDIGO = vec3(0.204, 0.125, 0.435);
const vec3 AMBER  = vec3(1.0, 0.667, 0.271);
const vec3 IVORY  = vec3(0.957, 0.937, 0.910);

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
             mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec3(11.7, 5.3, 7.1);
    a *= 0.5;
  }
  return v;
}

/* Hebra: convierte un campo de ruido en hilos finos de luz. */
float hebra(float n, float k) {
  return pow(clamp(1.0 - abs(2.0 * n - 1.0), 0.0, 1.0), k);
}

/* Una capa de filamentos con domain-warp organico, nunca repetitivo. */
float capa(vec3 q, float t, float warpAmp) {
  vec3 w = q + warpAmp * vec3(
    fbm(q * 1.15 + vec3(0.0, 0.0, t * 0.05)),
    fbm(q * 1.15 + vec3(9.2, 4.1, -t * 0.045)),
    0.0);
  float n = fbm(w * 2.1 + vec3(0.0, 0.0, t * 0.03));
  return hebra(n, 16.0);
}

void main() {
  vec2 frag = (vUv * 0.5 + 0.5) * uRes;
  vec2 p = (frag * 2.0 - uRes) / min(uRes.x, uRes.y);
  float t = uTime * uSpeed;

  float R = 0.74 * uExpand;
  float r = length(p);

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  /* Halo exterior minimo: una exhalacion, no un resplandor. */
  float halo = exp(-max(r - R, 0.0) * 10.0) * step(R, r);
  col += ULTRA * halo * 0.05;
  alpha = max(alpha, halo * 0.16);

  if (r < R + 0.02) {
    vec2 pn = p / R;
    float rr = clamp(dot(pn, pn), 0.0, 1.0);
    vec3 N = vec3(pn, sqrt(1.0 - rr));

    /* Los hilos viven DENTRO del cristal: se apagan hacia el limbo. */
    float cuerpo = smoothstep(0.06, 0.45, N.z);

    /* Corrientes: la energia fluye en cauces curvos, no llena la esfera. */
    float ang = 0.55 + t * 0.012;
    float ca = cos(ang);
    float sa = sin(ang);
    vec2 st = mat2(ca, -sa, sa, ca) * pn;
    st *= vec2(0.72, 1.18);
    float dens = smoothstep(0.34, 0.80, fbm(vec3(pn * 0.85, t * 0.012 + 5.2)));

    float warpAmp = 0.55 + uAudio * 0.3;
    vec2 drift = uDir * t * 0.02 + uPointer * 0.05;

    float shells2 = step(1.5, uShells);
    float shells3 = step(2.5, uShells);

    vec3 q1 = vec3(st * 1.25 - N.xy * 0.30 + drift, 1.9 + t * 0.014);
    vec3 q2 = vec3(st * 1.02 - N.xy * 0.16 + drift * 1.2, 0.8 - t * 0.011);
    vec3 q3 = vec3(st * 0.86 - N.xy * 0.05 + drift * 1.5, -0.6 + t * 0.017);

    float f1 = capa(q1, t, warpAmp);
    float f2 = capa(q2, t * 1.13, warpAmp) * shells2;
    float f3 = capa(q3, t * 0.87, warpAmp) * shells3;

    /* Profundidad por color: lejos ultravioleta tenue, cerca violeta claro. */
    vec3 hilos = ULTRA * f1 * 0.38
               + mix(ULTRA, VIOLET, 0.6) * f2 * 0.55
               + VIOLET * f3 * 0.72;

    /* Aliento calido minimo: la memoria humana siempre esta presente. */
    hilos += AMBER * f3 * 0.06;

    /* Pulsos ambar: escasos, lentos, humanos. */
    float aMask = smoothstep(0.66, 0.92, fbm(vec3(pn * 1.05, t * 0.02 + 31.7)));
    hilos = mix(hilos, AMBER * (f2 + f3) * 0.5, aMask * uAmber * 0.75);

    /* Pensamiento: las hebras cercanas se avivan. */
    hilos += VIOLET * f3 * uFocus * 0.35;

    /* Nunca quemar, nunca plasma. */
    hilos *= (0.14 + 0.86 * dens);
    hilos = hilos / (1.0 + (hilos.r + hilos.g + hilos.b) * 0.6);
    col += hilos * cuerpo * uBright;

    /* Chispas marfil diminutas. */
    float sp = hash(vec3(floor(pn * 52.0), floor(t * 0.5)));
    float tw = smoothstep(0.9962, 1.0, sp) * (0.35 + 0.65 * abs(sin(t * 2.4 + sp * 40.0)));
    col += IVORY * tw * 0.5 * cuerpo;

    /* Cuerpo de cristal: presencia oscura, no relleno. */
    col += INDIGO * 0.045 * (1.0 - N.z) * uBright;

    /* Rim: un solo canto fino, sin aros ni bandas. */
    float fres = pow(1.0 - N.z, 4.0);
    col += mix(ULTRA, VIOLET, 0.5) * fres * (0.34 + uFlash * 0.5);

    /* Canto especular superior, pequeno y nitido. */
    vec3 L = normalize(vec3(-0.35, 0.72, 0.58));
    float spec = pow(clamp(dot(N, L), 0.0, 1.0), 90.0);
    col += IVORY * spec * 0.22;

    /* Exito: apertura breve y serena. */
    col += (VIOLET * 0.35 + IVORY * 0.12) * uFlash * cuerpo;

    float px = 2.0 / min(uRes.x, uRes.y);
    float mask = 1.0 - smoothstep(R - px, R, r);
    alpha = max(alpha, mask * 0.94);
  }

  col *= 1.0 - 0.14 * smoothstep(0.35, 1.25, r);
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
      // OJO: NO se llama a WEBGL_lose_context.loseContext(). React reutiliza
      // el mismo <canvas> cuando cambia el tamaño (p. ej. al colapsar la
      // sidebar); forzar la pérdida del contexto lo dejaba inservible y el
      // orbe caía al fallback CSS para siempre. El contexto se libera solo
      // cuando el canvas se recolecta.
    }
    this.gl = null;
    this.program = null;
    this.buffer = null;
  }
}
