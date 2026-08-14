# Auditoria Eternime — 14-ago-2026 (post PR #20)

## SEGURIDAD
- **app/layout.tsx** Añadir encabezados de seguridad globales (Content‑Security‑Policy, Strict‑Transport‑Security, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy, X‑XSS‑Protection) mediante `headers()` en `next.config.js` o `middleware.ts`.  
- **app/api/** Implementar middleware de limitación de velocidad (rate‑limit) usando `@upstash/ratelimit` o similar en todos los endpoints públicos (`/api/*`) para prevenir DoS y abuso de API.  
- **app/api/upload/route.ts** Validar el parámetro `purpose` contra una lista blanca (`["avatar","cover","file"]`) y rechazar valores no permitidos → evita rutas arbitrarias y posibles traversal.  
- **app/api/upload/route.ts** Restringir tipos MIME aceptados (ej. solo `image/jpeg|png|gif|pdf|audio/*`) y rechazar archivos con `file.type` no permitido → previene cargas de contenido malicioso.  
- **app/api/upload/route.ts** Limitar el tamaño total del cuerpo HTTP (ej. 10 MiB) mediante `request.body` → evita payloads gigantes que agoten memoria.  
- **lib/data/memories.ts** Reemplazar la construcción manual de `pgTextArray` por un parámetro PostgreSQL (`sql.array(media, 'text')`) para evitar inyección de SQL a través de `mediaUrls`.  
- **app/api/voice/transcript/route.ts** Aplicar límite máximo de longitud del cuerpo JSON (p. 200 KB) y validar que `turns` sea un array de objetos con los campos esperados antes de procesar → protege contra payloads explosivos.  
- **app/api/** Añadir verificación de autorización en rutas con IDs de recurso (`[id]`) asegurando que el recurso pertenezca al `session.sub` (ej. `/api/beneficiaries/[id]/*`, `/api/letters/[id]`, `/api/files/[id]`) para eliminar IDOR.  
- **app/api/** Configurar `export const config = { api: { bodyParser: { sizeLimit: "1mb" } } }` en rutas que aceptan `POST` con `JSON` para evitar cargas excesivas.  
- **app/api/webhooks/clerk/route.ts** Validar firma del webhook (usar `Clerk` SDK o HMAC) antes de procesar → previene falsificación de eventos.  
- **app/api/** Forzar `Content-Type: application/json` en respuestas de error y éxito, y deshabilitar `JSON.stringify` de objetos que puedan contener datos sensibles.  
- **next.config.js** Establecer `crossOrigin

[capa: cerebras | 1393ms]


## RENDIMIENTO
- lib/db.ts → crear índices compuestos (user_id, source) en eternime_memories para acelerar countConversationMemories y listMemories.  
- lib/data/memories.ts → añadir paginación (LIMIT + OFFSET) a listMemories para evitar cargar miles de filas de golpe.  
- lib/data/memories.ts → reemplazar el bucle for de appendGuideMessage en voice/transcript por INSERT masivo (con VALUES (...),(...)) para reducir N+1 queries.  
- app/api/letters/route.ts → añadir índice (user_id) en eternime_letters para consultas de listado y filtrado.  
- app/api/beneficiaries/[id]/memories/route.ts → añadir índices (beneficiary_id) y (user_id) en eternime_memories para las búsquedas por beneficiario.  
- lib/data/users.ts → crear índice único (email) en eternime_users para acelerar la fase de upsert y búsqueda por email.  
- app/api/eternime/search/route.ts → cambiar runtime a "edge" y usar streaming directo para respuestas de búsqueda ligera.  
- app/api/eternime/status/route.ts → establecer Cache-Control: s-maxage=60 para respuestas estáticas y reducir carga en Vercel.  
- app/api/voice/agent/route.ts → usar runtime "edge" y evitar dependencias de node para acelerar la creación de sesiones de voz.  
- app/api/upload/route.ts → enviar file directamente a Vercel Blob sin cargarlo completamente en memoria (stream pipe).  
- components/app/CartasClient.tsx → cargar Componentes de lista (paginador, tarjetas) con dynamic import para disminuir el bundle inicial.  
- components/motion/index.ts → lazy‑load framer‑motion solo cuando se usa animación para reducir tamaño del cliente.  
- app/layout.tsx → eliminar import de globals.css no utilizado y usar next/font para fuentes en vez de CSS tradicional.  
- public assets → reemplazar imágenes JPEG por WebP/AVIF y servirlas mediante next/image para aprovechar optimización y tamaños menores.  
- lib/ai/gemini.ts → implementar caché in‑memory (LRU) para generateEmbedding y evitar llamadas repetidas a Gemini en búsquedas idénticas.  

[capa: cerebras | 1402ms]


## UX
- **app/layout.tsx** añadir un enlace “Saltar al contenido” visible solo con teclado para mejorar la navegación inicial.  
- **components/motion/PageTransition.tsx** respetar la preferencia `prefers-reduced-motion` y desactivar animaciones cuando está habilitada.  
- **components/app/HablarConEon.tsx** cambiar el botón a un área táctil ≥ 48 × 48 px para asegurar un objetivo de toque adecuado en móviles.  
- **components/app/HablarConEon.tsx** desactivar el botón mientras el estado es `connecting` para evitar clics duplicados.  
- **components/app/HablarConEon.tsx** añadir un region `aria-live="assertive"` para los mensajes de error y de estado, garantizando que lectores de pantalla anuncien cambios inmediatamente.  
- **components/app/HablarConEon.tsx** mover el foco al caption cuando la conversación termina, mejorando la continuidad auditiva para usuarios de SR.  
- **components/app/HablarConEon.tsx** mostrar una UI de fallback (mensaje y botón de reintento) cuando `navigator.mediaDevices` no está disponible.  
- **components/app/CartasClient.tsx** implementar skeleton loaders mientras se recuperan las cartas, evitando pantallas en blanco.  
- **components/app/RecuerdosClient.tsx** renderizar un estado vacío con texto y botón “Crear primer recuerdo” cuando la lista está vacía.  
- **app/(public)/entrar/page.tsx** validar campos en cliente (email, contraseña) con mensajes inline y desactivar el botón “Entrar” hasta que el formulario sea válido.  
- **app/(public)/crear/page.tsx** convertir el proceso de creación en un wizard con barra de progreso / stepper que muestre claramente el avance del onboarding.  
- **components/admin/UsersManager.tsx** integrar toast notifications para operaciones de crear, editar o eliminar usuarios, mostrando mensajes claros de éxito o error.  
- **components/app/VoiceClone.tsx** añadir barra de progreso o spinner mientras se genera el clon de voz, con mensaje “Procesando tu voz…”.  
- **app/api/upload/route.ts** unificar la respuesta de error en `{ error, requestId }` y exponer `requestId` en los logs, permitiendo

[capa: cerebras | 2055ms]


## CALIDAD

- **[app/api/*] Wrapper de manejo de errores** : crear un middleware/función de utilidad que rodee todos los route handlers para capturar `AuthError` y errores inesperados, devolviendo respuestas JSON consistentes y evitando código repetido.  
- **[app/api/*] Logger estructurado** : reemplazar `console.error` por un logger centralizado (p. ej., pino o winston) con niveles, timestamps y contexto (route, userId) para mejorar trazabilidad y observabilidad.  
- **[app/api/upload/route.ts, app/api/voice/transcript/route.ts] Validación de entrada** : usar Zod (o Yup) para validar query‑params, body JSON y `FormData`; rechazar peticiones inválidas antes de la lógica de negocio y devolver mensajes claros.  
- **[app/api/upload/route.ts] Eliminar código duplicado de actualización de avatar/cover** : extraer la lógica de actualización de perfil (llamada a `updateUserProfile`) a una función helper reutilizable.  
- **[app/api/voice/transcript/route.ts] Tipado estricto de `unknown`** : definir interfaces específicas para el payload (`interface TranscriptPayload { turns: Turn[] }`) y evitar `any/unknown` en la deserialización.  
- **[components/app/HablarConEon.tsx] Tipos y enums compartidos** : mover `Status`, `Mode` y `Turn` a un archivo de tipos (`types/voice.ts`) y usar `enum` en vez de strings literales para prevenir errores de typo.  
- **[components/app/HablarConEon.tsx] Hook reutilizable para flushTranscript** : encapsular la lógica de envío beacon/fetch en un custom hook (`useFlushTranscript`) con pruebas unitarias, separando UI de side‑effects.  
- **[lib/ai/gemini.ts] Tipado explícito de retornos** : evitar `any` en resultados del SDK de Google, definir interfaces (`GeminiChatResponse`, `GeminiEmbeddingResult`) y exportarlas para uso externo.  
- **[lib/auth.ts] Pruebas unitarias e integración** : cubrir `getSession`, `requireUser` y `requireAdmin` con mocks de Clerk; asegurar que el flujo de auto‑creación de usuario funciona correctamente.  
- **[app/api/*] Pruebas unitarias de rutas** : escribir tests (Jest + Supertest) para `/api/upload` y `/api/voice/transcript`, verificando validaciones, manejo de errores y respuestas correctas.  
- **[config] Constantes centralizadas** : mover `MAX_BYTES`, `MAX_TURNS`, `MAX_TURN_LENGTH`, etc., a `src/config/constants.ts` y exportarlos; facilita ajustes y evita divergencias.  
- **[app/api/*] Rate limiting y cabeceras de seguridad** : agregar middleware simple (por ejemplo, `next-rate-limit`) para limitar peticiones y establecer headers CORS/Content‑Security‑Policy donde aplique.  
- **[lib/ai/gemini.ts] Eliminación de imports innecesarios** : revisar y remover `import "server-only"` en archivos donde no aporta restricción, reduciendo carga de módulos.  
- **[app/api/voice/transcript/route.ts] Manejo específico de

[capa: cerebras | 1291ms]

## SEO-PWA-A11Y

- **public/manifest.json** → añadir `display`, `background_color`, `theme_color`, `shortcuts` y versiones 192 px y 512 px de los iconos para PWA completa.  
- **app/layout.tsx** → añadir `<meta name="theme-color" content="#08080c">` y `<meta name="robots" content="index,follow">` dentro del objeto `metadata`.  
- **app/sitemap.ts** → generar sitemap estático que incluya todas las rutas públicas (`/`, `/como-funciona`, `/precios`, `/privacidad`, etc.) y añadir `robots.txt` que apunte a él.  
- **components/pwa-register.tsx** → registrar `service worker` con `workbox` y habilitar `offline fallback` (`navigateFallback: "/offline"`).  
- **app/layout.tsx** → usar `<link rel="preload" href="/fonts/eternime.woff2" as="font" type="font/woff2" crossorigin>` para fuentes críticas y mejorar LCP.  
- **components/app/HablarConEon.tsx** → añadir `role="dialog"` y `aria-modal="true"` al contenedor cuando el estado es `connected` para mejorar la accesibilidad del modal de voz.  
- **components/app/HablarConEon.tsx** → establecer `tabIndex={0}` en el botón principal y asegurar que el foco vuelva al botón al cerrar la sesión.  
- **app/(public)/*** → añadir atributos `alt` descriptivos a todas las imágenes `<Image>` y `<img>` que actualmente carecen de ellos.  
- **components/*** → añadir `aria-label` o `aria-labelledby` a iconos interactivos sin texto (ej. los botones de reproducción/pausa en componentes de audio).  
- **styles/globals.css** → incrementar contraste del texto principal (`var(--et-text)`) contra el fondo oscuro (`#08080c`) a al menos 4.5:1 (ej. usar `#e0e0e0` o ajustar opacidad).  
- **components/*** → garantizar que todos los enlaces tengan `:focus-visible` estilo visible (outline 2 px solid var(--et-gold)).  
- **app/layout.tsx** → añadir un “skip navigation” link al inicio del `<body>` (`<a href="#main" className="skip-link">Saltar al contenido</a>`) y `id="main"` en el contenedor principal.  
- **components/admin/*** → usar `role="table"` y `aria-sort` en tablas de gestión para que lectores de pantalla comprendan la ordenación.  
- **components/motion/PageTransition.tsx** → marcar transiciones como `aria-live="polite"` para anunciar cambios de página a usuarios de lector de pantalla.  
- **app/layout.tsx** → optimizar el atributo `lang` a `"es-MX"` y añadir `dir="ltr"` para que los navegadores de accesibilidad interpreten correctamente el idioma y dirección.

[capa: cerebras | 3145ms]

## COSTOS

- **app/api/voice/transcript/route.ts**: agrupar múltiples memorias antes de generar embeddings (batch → un solo `storeMemoryEmbedding` por conversación)  
- **lib/ai/gemini.ts**: implementar caché de embeddings en la tabla `memory_embeddings` y reutilizar cuando `text` ya exista (evita llamadas duplicadas a Gemini)  
- **app/api/eternime/search/route.ts**: usar caché de query‑embeddings por usuario (hash → resultado) y evitar generar embedding en cada búsqueda  
- **lib/ai/gemini.ts – describeImage**: añadir verificación de peso (< 2 MB) y resolución antes de llamar a Gemini; omitir imágenes grandes/irrelevantes  
- **app/api/voice/clone/route.ts**: crear el clon de voz solo una vez por usuario y guardar `voiceId` en DB; reutilizar en llamadas posteriores en vez de volver a generar  
- **app/api/voice/agent/route.ts**: limitar el número de sesiones activas por usuario (máx = 1) y rechazar nuevas peticiones hasta que la anterior finalice (reduce llamadas a ElevenLabs)  
- **app/api/upload/route.ts**: aplicar política de expiración automática (TTL = 30 días) a objetos en Vercel Blob para evitar acumulación de archivos costosos  
- **app/api/upload/route.ts**: habilitar compresión gzip al subir archivos estáticos (imágenes, PDFs) para disminuir consumo de ancho de banda y storage  
- **components/app/HablarConEon.tsx**: debounce del `flushTranscript` (300 ms) para evitar envíos redundantes de `POST /api/voice/transcript` al cerrar sesión rápidamente  
- **app/api/voice/transcript/route.ts**: limitar `MAX_TURNS` a 100 y descartar turnos antiguos (> 30 min) antes de generar embedding (reduce tamaño de payload)  
- **app/api/eternime/voice/route.ts**: reutilizar el mismo token de ElevenLabs en llamadas subsecuentes durante la misma sesión (evita generación de token extra)  
- **lib/ai/gemini.ts**: usar `generateContentStream` solo una vez por interacción chat (no hacer llamadas de “complete” extra para resúmenes)  
- **components/app/VoiceClone.tsx**: agregar control de frecuencia (max 5 clones / día) y mostrar aviso al usuario antes de intentar nueva clonación (previene uso innecesario de ElevenLabs)  

[capa: cerebras | 1050ms]

