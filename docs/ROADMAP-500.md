# Eternime — Roadmap de 500 mejoras
Generado por auditoria + Cerebras, organizado por Vulcano. 2026-06-30.

## 1. Landing publica (pre-login)

1. Anadir un video de 30s con testimonios emocionantes que muestre como los recuerdos cobran vida a traves de la voz clonada.
2. Incluir una seccion "Tu legado en 3 pasos" con iconos animados para captar la atencion de usuarios primerizos.
3. Reemplazar la tipografia del encabezado por una fuente serif elegante que transmita serenidad y lujo.
4. Incorporar un fondo sutil de particulas luminiscentes que evoquen la continuidad del tiempo sin distraer la lectura.
5. Mostrar un carrusel de ejemplos de cartas entregadas en fechas futuras, resaltando la emotividad del momento.
6. Anadir un boton "Crear mi primer recuerdo" con efecto hover de sombra suave que invite a la accion inmediata.
7. Implementar micro-interacciones en los iconos de audio, foto y texto que se activen al pasar el cursor.
8. Incluir una barra de progreso visual que indique el nivel de completitud del legado del usuario.
9. Anadir una seccion "Eon, tu guia" con una breve animacion de IA conversando en tiempo real.
10. Integrar testimonios con fotos de usuarios reales y citas emotivas para generar confianza y cercania.
11. Usar una paleta de colores dorado-gris que comunique exclusividad y tranquilidad.
12. Implementar un modo oscuro que recuerde la noche estelar, para una experiencia nocturna comoda.
13. Anadir un FAQ desplegable sobre privacidad, seguridad y legado digital, resaltando la confidencialidad.
14. Incorporar una demo interactiva de la clonacion de voz en la seccion "Como funciona".
15. Mostrar badges de seguridad y cumplimiento al final de la pagina para reforzar la confianza.
16. Anadir una llamada a la accion "Reserva tu legado" con contador a una fecha de lanzamiento premium.
17. Documentar de forma transparente donde y como se almacenan los datos (Neon, encriptado).
18. Ofrecer una comparativa de planes clara con cobertura temporal y limites de almacenamiento.
19. Anadir enlaces a redes sociales con micro-videos de usuarios compartiendo su legado (con permiso).
20. Insertar un cuadro de "Preguntas para tu Eon" que guie al usuario a redactar su primera carta.
21. Usar testimonios de expertos en IA y etica digital en la seccion de manifiesto para validar la vision.
22. Anadir una galeria "Explora recuerdos eternos" filtrable por tipo de medio (texto, foto, audio).
23. Implementar un boton "Compartir mi legado" que genere una URL unica y temporal para presentar a familiares.
24. Incorporar una animacion simbolica al enviar una carta, representando la entrega futura del recuerdo.
25. Anadir un formulario de "Acceso anticipado" para captar leads premium antes de campanas grandes.

## 2. Registro, login y onboarding

26. Disenar pantalla de registro con fondo de aurora difuminada que evoque eternidad.
27. Saludo animado "Bienvenido a tu legado" al cargar el formulario.
28. Campos con bordes suaves y sombra sutil que transmitan calidez visual.
29. Verificacion de correo con copy poetico enviado via Resend.
30. Selector de "memoria inaugural" donde el usuario elige su primer recuerdo a capturar.
31. Avatar generado por IA opcional a partir de la foto de perfil.
32. Indicador de fuerza de contrasena con microfeedback sutil al cumplirse.
33. Login alternativo con OTP por correo ademas de contrasena.
34. Estado inicial de cuenta marcado claramente como "boveda vacia, lista para llenarse".
35. Barra de progreso "casi listo" durante el flujo de registro.
36. Bienvenida con la voz de Eon (ElevenLabs) tras completar el registro.
37. Meditacion guiada breve en audio para conectar emocionalmente al inicio.
38. Eon presentado como avatar/constelacion animada en la primera interaccion.
39. Posibilidad de personalizar el nombre o alias de Eon.
40. Cuestionario rapido inicial para que Eon aprenda tono y preferencias del usuario.
41. Generacion asistida (Gemini) de un primer recuerdo a partir de las respuestas del cuestionario.
42. Visor de recuerdo estilo "carta/pergamino" con animacion de escritura para el primer recuerdo.
43. Opcion de grabar muestra de voz inicial (con consentimiento explicito) para clonacion futura.
44. Codigo de invitacion para compartir con familiares directamente desde onboarding.
45. Tour interactivo breve de la interfaz tras el primer recuerdo.
46. MFA opcional via WebAuthn/passkey para cuentas que lo soliciten.
47. Importacion opcional de fotos desde redes sociales o galeria del telefono.
48. Microanimacion de confirmacion al iniciar sesion exitosamente.
49. Copy de error humano y calido en vez de mensajes tecnicos de auth.
50. Notificacion "tu legado esta seguro" tras primer login exitoso.
51. Checklist de "primeros 3 pasos recomendados" tras onboarding.
52. Guia tipo carrusel ilustrado explicando boveda, Eon y cartas.
53. Modo "silencioso" (sin audio) seleccionable desde el onboarding.
54. Recordatorio semanal sugerido para anadir un nuevo recuerdo.
55. Seccion "mensajes al futuro" introducida en el onboarding como concepto.
56. Exportacion de respaldo personal en PDF disponible desde el primer dia.
57. Feedback visual de como cada respuesta del onboarding alimenta el contexto de Eon.
58. Cierre de onboarding con simbolo de marca (llama/luz constante) reforzando la promesa del producto.
59. Permitir saltar pasos opcionales del onboarding sin perder progreso.
60. Reanudar onboarding exactamente donde se quedo si el usuario cierra la sesion a medias.

## 3. Boveda de recuerdos (texto/foto/audio)

61. Carga de archivos chunked/resumable para evitar interrupciones en uploads grandes.
62. Compresion automatica de imagenes (AVIF/WebP) antes de subir a Vercel Blob.
63. Conversion de audios a formato eficiente (Opus) y normalizacion de volumen al subir.
64. OCR sobre imagenes para extraer texto y sumarlo al indice de busqueda.
65. Extraccion automatica de metadatos EXIF (fecha, ubicacion) al subir fotos.
66. Etiquetado manual de recuerdos con colores/categorias para organizacion visual.
67. Categorias jerarquicas personalizables por el usuario.
68. Historial de versiones por recuerdo (deshacer cambios, auditoria).
69. Fecha de expiracion opcional por recuerdo (revision o borrado automatico).
70. Modo "confidencial" por recuerdo: cifrado en reposo, solo visible con clave del heredero.
71. Tabla unica de embeddings (pgvector) para texto/foto/audio, busqueda hibrida.
72. Pipeline RAG combinando embeddings multimodales para resultados mas precisos.
73. Busqueda semantica con distancia coseno y umbral de relevancia ajustable.
74. Filtros de busqueda por rango de fecha, tipo de medio y etiqueta.
75. Busqueda por voz (speech-to-text) que genera la consulta automaticamente.
76. Resaltado de coincidencias en los resultados de busqueda.
77. Vista de linea de tiempo con zoom interactivo por epocas de vida.
78. Vista de mapa para recuerdos geolocalizados.
79. Agrupamiento automatico de recuerdos en colecciones tematicas sugeridas por IA.
80. Permisos granulares por recuerdo (lectura/edicion/compartir) via scopes en el JWT.
81. Verificacion tipo "pregunta de seguridad" antes de que un heredero acceda a un recuerdo confidencial.
82. Notificacion al usuario cuando un recuerdo es accedido o compartido.
83. Edicion de metadatos sin re-subir el archivo original.
84. Soft delete con ventana de recuperacion de 30 dias antes de borrado definitivo.
85. Log de auditoria por recuerdo: quien y cuando modifico cada campo.
86. Reencriptado masivo disponible si se actualiza el esquema de cifrado.
87. Cache de busquedas frecuentes para reducir latencia.
88. Replica de lectura en Neon para escalar busquedas sin afectar escrituras.
89. Rate limiting por cuenta e IP en endpoints de busqueda y subida.
90. Exportacion de recuerdos a ZIP con manifiesto descriptivo.
91. Importacion desde Google Drive/Dropbox via OAuth para migrar contenido existente.
92. Modo offline: cola local de subidas que sincroniza al recuperar conexion.
93. Deteccion de contenido sensible con aviso antes de publicar a beneficiarios.
94. Transcripcion en vivo de audio antes de confirmar el guardado.
95. Boveda compartida donde varios familiares colaboran organizando recuerdos de un fallecido.
96. Marcar recuerdos como favoritos para priorizarlos en busquedas y en la linea de tiempo.
97. Etiquetado por tono emocional (analisis de sentimiento) para narrativas tipo "los momentos mas felices".
98. Deduplicacion por hash y similitud de embeddings para evitar copias repetidas.
99. Respaldo automatico programado de la base de datos (snapshots).
100. Capa de cifrado por recuerdo con clave envolvente individual (key wrapping).
101. Pagina de "memorial publico" opcional con un subconjunto de recuerdos, sin login.
102. Pruebas de carga periodicas sobre los endpoints de la boveda para validar desempeno bajo concurrencia.
103. Limite configurable de almacenamiento por plan, con aviso anticipado de cercania al limite.
104. Reordenar recuerdos manualmente (drag and drop) dentro de una coleccion.
105. Adjuntar un recuerdo "respuesta" vinculado a un recuerdo existente (hilos de memoria).

## 4. Eon (chat IA, voz en tiempo real, modo legado para herederos)

106. Indice hibrido (palabra clave + embedding) para acelerar recuperacion de recuerdos relevantes.
107. Cache de consultas frecuentes con TTL para bajar latencia del RAG.
108. Deteccion de sentimiento en tiempo real para ajustar el tono de respuesta de Eon.
109. Soporte multi-idioma automatico en la conversacion (deteccion + respuesta en el idioma del usuario).
110. Ventana de contexto dinamica que crece cuando la conversacion se vuelve mas profunda.
111. Mecanismo de feedback (util/no util) sobre respuestas para refinar el ranking del RAG con el tiempo.
112. Transcripcion de voz en tiempo real con latencia objetivo menor a 300ms.
113. Streaming de audio optimizado para llamadas largas sin cortes.
114. Mejora de deteccion de barge-in (interrupcion natural mientras Eon habla).
115. Cancelacion de ruido/eco para uso en movil y exteriores.
116. Opcion de ajustar tono/edad de la voz clonada dentro de limites razonables.
117. Control de prosodia/emocion en la voz segun el contexto de la conversacion.
118. Modo "solo texto" que pausa la voz sin perder la conversacion.
119. Prompting consciente de personalidad: que Eon recuerde frases y habitos tipicos del usuario.
120. Generacion de anecdotas a partir de fragmentos de recuerdos relacionados.
121. Seleccion de "temas sugeridos" para guiar la conversacion (familia, trabajo, momentos clave).
122. Ajuste de formalidad/tono de Eon configurable por el usuario.
123. Modo "memoria profunda": busqueda mas exhaustiva sobre el archivo completo cuando se pide explicitamente.
124. Resumen automatico de cada sesion de conversacion para revision posterior.
125. Etiquetado automatico de recuerdos mencionados durante la charla (familia, trabajo, hobbies).
126. Linea de tiempo visible durante la conversacion para dar contexto al heredero.
127. Control de acceso granular: que recuerdos puede usar Eon segun quien este hablando (usuario vs heredero).
128. Registro explicito de consentimiento del usuario para uso de su voz clonada con terceros.
129. Banco de preguntas predefinidas que el heredero puede dejar preparadas para Eon.
130. Deteccion de interes/curiosidad del heredero para ofrecer contexto adicional relevante.
131. Reproduccion ("replay") de conversaciones previas con la misma voz clonada.
132. Few-shot prompting para que Eon adopte rapido nuevas expresiones o anecdotas recientes del usuario.
133. Soporte de imagenes en el RAG para que Eon pueda describir o referenciar fotos durante la charla.
134. Deteccion de momentos de "transmision de sabiduria" para resaltarlos como recuerdos especiales.
135. Cierre de conversacion con resumen y despedida calida en vez de corte abrupto.
136. Deteccion de fatiga conversacional y sugerencia de pausa.
137. Log de auditoria de quien hablo con Eon, cuando y sobre que temas (visible para el usuario dueno de la boveda).
138. Exportacion de transcripciones en PDF con marca de tiempo para los herederos.
139. Temas visuales de la interfaz de chat que evoquen distintas epocas de vida del usuario.
140. Motor de "preguntas sugeridas" para que el heredero explore temas que aun no ha tocado.
141. Modo offline minimo (snapshot del indice) para consultas basicas sin conexion.
142. Plan de escalamiento de infraestructura para sostener conversaciones concurrentes sin degradar latencia.
143. Limite y aviso de uso de minutos de voz por plan, con upgrade claro.
144. Boton de "corregir a Eon" cuando una respuesta no suena como el usuario, para reentrenar el estilo.
145. Diferenciacion clara en la UI entre "hablando con Eon en vida" vs "modo legado" post-mortem.
146. Confirmacion humana periodica (verificacion de vida) antes de activar el modo legado completo.
147. Panel de "calidad de la voz clonada" con muestras para que el usuario apruebe antes de publicarla.
148. Eon puede sugerir proactivamente que el usuario complete su boveda en areas poco cubiertas.
149. Modo bilingue dentro de la misma conversacion si la familia habla mas de un idioma.
150. Limite configurable de quien puede activar el modo legado conversacional (solo herederos verificados).

## 5. Cartas programadas

151. Editor de texto enriquecido para el cuerpo de la carta.
152. Previsualizacion en tiempo real de como se vera el email entregado.
153. Plantillas predefinidas (cumpleanos, boda, graduacion, "para cuando ya no este").
154. Variables personalizadas insertables ({{nombre}}, {{fecha}}) en el cuerpo.
155. Adjuntos en la carta (PDF, fotos) ademas del texto.
156. Manejo de zona horaria del destinatario al calcular la entrega.
157. Cartas recurrentes (cada cumpleanos, cada aniversario) ademas de fecha unica.
158. Limite de tamano del cuerpo con aviso claro antes de exceder.
159. Vista previa del asunto y remitente antes de programar.
160. Confirmacion in-app al programar exitosamente una carta.
161. Recordatorio al usuario de cartas proximas a entregarse, para revisarlas antes.
162. Edicion o cancelacion de una carta mientras siga pendiente.
163. Historial de versiones de cada carta con fecha de cada cambio.
164. Registro de auditoria: quien y cuando edito la carta.
165. Cifrado del contenido de la carta en reposo hasta el momento de entrega.
166. Enlace de lectura unico y de un solo uso para el destinatario.
167. Verificacion del formato/dominio del correo destinatario al guardar.
168. Checklist automatico antes del envio (email valido, contenido no vacio).
169. Reintento automatico con backoff si el envio via Resend falla.
170. Notificacion al remitente original cuando la carta fue abierta por el destinatario (si aun esta vivo y lo permite).
171. Diseno responsive del email para distintos clientes de correo.
172. Nota privada del usuario sobre la carta, visible solo para el (no se envia).
173. Respaldo periodico de la tabla de cartas pendientes.
174. Exportar una carta a PDF para impresion fisica.
175. Recordatorio sincronizable con Google Calendar/Outlook para fechas de entrega relevantes.
176. Nivel de prioridad de la carta (por si hay multiples el mismo dia).
177. Aviso si el contenido parece sensible antes de programar el envio.
178. Limite de cartas pendientes por plan, con upsell claro si se alcanza.
179. Politica de retencion: que pasa con cartas ya entregadas despues de X anos.
180. Vista de "linea de tiempo de cartas" mostrando todas las programadas y entregadas.
181. Posibilidad de programar una carta dirigida a "toda la familia" (multiples destinatarios).
182. Confirmacion de lectura opcional (sin invadir privacidad si el destinatario no quiere compartirla).
183. Plantilla visual de marca consistente con el resto de Eternime en el email entregado.
184. Reenvio manual desde el admin si una entrega fallo definitivamente.
185. Carta "de emergencia" con entrega inmediata si se activa una condicion especial (ver seccion herederos).

## 6. Beneficiarios y herederos

186. Designar herederos con verificacion de identidad por doble factor antes de aceptar la invitacion.
187. Heredero secundario que entra en accion si el principal no confirma recepcion.
188. Proceso de verificacion de fallecimiento con al menos dos fuentes (ej. acta de defuncion + confirmacion de contacto cercano).
189. Ventana de tiempo configurable entre la confirmacion y la activacion total del legado.
190. Condicion de entrega tipo "responder una pregunta personal" antes de liberar un recuerdo sensible.
191. Nivel de confidencialidad por recuerdo (publico / restringido / ultra confidencial).
192. Targeting por tipo de medio y por tema, no solo por heredero individual.
193. Recuerdos con fecha de liberacion futura aunque el usuario siga vivo (ej. "abrir cuando cumplas 18").
194. Carta de bienvenida automatica al heredero antes de mostrarle el primer recuerdo.
195. Codigo de acceso unico y revocable por heredero, con expiracion configurable.
196. Notificacion al heredero cuando se acerca la fecha de liberacion de algo asignado a el.
197. Marca de agua o vista protegida para recuerdos sensibles antes de la liberacion completa.
198. Linea de tiempo personalizada para cada heredero, solo con lo que le corresponde.
199. Roles diferenciados (custodio, lector, colaborador) con permisos distintos sobre la boveda.
200. Posibilidad de que el heredero anada sus propias notas a un recuerdo recibido (co-memoria).
201. Verificacion biometrica opcional para desbloquear el contenido mas sensible.
202. Panel para el usuario (en vida) de quien ha visto que, antes de fallecer, para ajustar permisos.
203. Mensaje de audio o video de despedida que se reproduce antes de dar acceso al resto del legado.
204. Onboarding dedicado para herederos, distinto al onboarding del usuario titular.
205. Soporte multilenguaje para herederos en otros paises/idiomas.
206. Entrega de recuerdos en fechas significativas futuras (cumpleanos, aniversarios) incluso anos despues.
207. Alerta al usuario si se detecta un intento de acceso anticipado o sospechoso.
208. Revocar o reasignar el acceso de un heredero a recuerdos especificos en cualquier momento.
209. Memorias colaborativas donde varios herederos aportan contenido a un mismo recuerdo compartido.
210. Generacion de un PDF legal con los terminos de entrega para respaldo fuera de la plataforma.
211. Guia de acompanamiento (no terapia) para el primer acceso del heredero al legado.
212. Personalizacion minima del perfil del heredero dentro de la app (nombre, foto).
213. Registro de cadena de custodia visible para el heredero (quien entrego que y cuando).
214. Paquete de "legado completo" que agrupa recuerdos + cartas + accesos en una sola entrega curada.
215. Confirmacion explicita de aceptacion de la invitacion antes de que el heredero vea cualquier contenido.
216. Limite de herederos por plan, con upsell claro.
217. Posibilidad de anadir un "ejecutor de legado" (no heredero, solo gestiona el proceso) sin acceso al contenido.
218. Recordatorio periodico al usuario en vida para revisar y actualizar su lista de herederos.
219. Notificacion clara al usuario cuando un heredero acepta la invitacion.
220. Eliminacion segura de la cuenta y datos tras cumplirse todas las condiciones de entrega, si el usuario asi lo definio.

## 7. Perfil de usuario

221. Foto de portada con micro animacion de transicion suave.
222. Avatar generado/personalizable mas alla de la foto subida.
223. Importacion opcional de contenido desde redes sociales conectadas.
224. Biografia con formato enriquecido (markdown basico) en vez de texto plano.
225. Campos opcionales de datos relevantes para herederos (informacion medica basica, alergias).
226. Linea de tiempo de hitos de vida dentro del perfil (no solo recuerdos sueltos).
227. Boveda de archivos personales con su propia capa de cifrado y MFA.
228. Etiquetado por categoria y color para archivos del perfil.
229. Agrupacion visual tipo "cajas de recuerdos" por tematica dentro del perfil.
230. Control de velocidad/tono al previsualizar la voz clonada antes de aprobarla.
231. Previsualizacion de la voz clonada en distintos dispositivos antes de publicarla.
232. Idioma predeterminado del perfil con traduccion automatica de la biografia si se requiere.
233. Plantillas de portada sugeridas segun intereses declarados.
234. Mensaje de despedida programable directamente desde el perfil.
235. Asignacion rapida de secciones del perfil a herederos especificos.
236. Modo privado que oculta campos sensibles a quien no tenga permiso.
237. Barra de completitud del perfil con sugerencias de que falta.
238. Verificacion de certificados o documentos importantes adjuntos al perfil.
239. Gestor de permisos granular por tipo de archivo dentro de la boveda personal.
240. Firma electronica personalizable para documentos generados desde el perfil.
241. Tema de color del perfil sincronizado con portada y avatar.
242. Integracion de fechas importantes del perfil con recordatorios automaticos.
243. Seccion de "pasiones e intereses" con iconos seleccionables.
244. Notas de audio cortas como complemento de la biografia escrita.
245. Vista "modo legado" del perfil, pensada para cuando lo vean los herederos.
246. Sugerencias de redaccion para la biografia basadas en lo ya capturado en la boveda.
247. Exportacion del perfil completo en PDF o JSON cifrado para respaldo personal.
248. Verificacion biometrica opcional para acciones sensibles del perfil.
249. Ajuste automatico de contraste/brillo segun hora del dia (mas alla del toggle manual).
250. Notificaciones de actividad sobre el perfil (accesos, cambios) para el dueno de la cuenta.

## 8. Panel de administracion

251. Filtros avanzados por fecha, rol y estado en la tabla de usuarios.
252. Busqueda instantanea por email o nombre.
253. Edicion masiva de roles seleccionando varios usuarios a la vez.
254. Vista de actividad reciente por usuario (login, cambios, acciones clave).
255. Desactivar cuenta con confirmacion y motivo registrado.
256. Exportar usuarios a CSV/Excel con columnas configurables.
257. Historial de cambios de perfil con opcion de revertir.
258. Alertas de intentos de login fallidos repetidos.
259. Forzar MFA para cuentas administrativas.
260. Vista de "usuarios pendientes de verificacion" con acciones rapidas.
261. Moderacion de contenido por palabras clave/categoria antes de publicarse.
262. Marcar contenido como inapropiado, notificando al creador.
263. Previsualizacion de cartas pendientes desde el panel antes de su entrega.
264. Aprobar/rechazar contenido sensible con comentario obligatorio al rechazar.
265. Historial de versiones de cartas con opcion de restaurar.
266. Estadisticas diarias de cartas creadas, entregadas y fallidas.
267. Dashboard de monitoreo del cron de cartas (latencia, exitos, fallos).
268. Alertas automaticas si el cron supera un umbral de tiempo o falla repetidamente.
269. Logs detallados de cada ejecucion del cron, filtrables por fecha.
270. Boton de "reintentar" entregas de carta fallidas desde el panel.
271. Vista de salud del sistema (DB, cache, servicios externos) con estado en vivo.
272. Umbrales de alerta configurables con notificacion a Slack/email/WhatsApp.
273. Modulo de incidencias internas (crear, asignar, cerrar tickets de soporte).
274. Adjuntar capturas o logs al crear una incidencia.
275. Vista de tickets abiertos filtrable por prioridad y tiempo de respuesta.
276. Metricas basicas de tiempo de respuesta/resolucion de soporte.
277. Busqueda global de logs del sistema con resaltado de coincidencias.
278. Generacion de reportes periodicos (PDF/CSV) de actividad de usuarios y contenido.
279. Modo mantenimiento que redirige usuarios con aviso claro durante actualizaciones.
280. Panel de politicas de seguridad (expiracion de JWT, requisitos de contrasena).
281. Auditoria de cambios criticos (quien, cuando, que se modifico) en todo el sistema.
282. Desbloqueo manual de IP en caso de falsos positivos de rate limiting.
283. Gestion de roles personalizados mas alla de admin/usuario.
284. Vista consolidada de uso de almacenamiento (Blob) por usuario y total.
285. Vista consolidada de consumo de IA (tokens Gemini) y costo estimado por usuario/total.
286. Vista consolidada de minutos de voz consumidos (ElevenLabs) por usuario y total.
287. Panel de revision de solicitudes de activacion de modo legado (verificacion de fallecimiento).
288. Registro y trazabilidad de cada activacion de legado para auditoria legal.
289. Herramienta para suspender temporalmente una cuenta sin borrar datos (disputas, fraude).
290. Documentacion contextual (tooltips) en cada seccion del panel para nuevos operadores.

## 9. Seguridad y privacidad (prioridad alta dado lo sensible del contenido)

291. Auditoria automatica de secrets: que ningun ENV sensible tenga fallback hardcodeado en el codigo (lo que se corrigio hoy).
292. Escaneo periodico del repo (gitleaks/trufflehog) en CI para detectar credenciales antes del push.
293. Rotacion programada de JWT_SECRET y demas claves criticas, no solo reactiva.
294. Cookies de sesion con HttpOnly, Secure y SameSite estricto.
295. Cifrado en reposo de campos de contenido sensible (recuerdos, transcripciones de voz).
296. CSP estricto definido explicitamente en next.config en vez de quedar por default.
297. Headers de seguridad estandar (X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
298. Rate limiting real en endpoints de auth, subida de archivos y cron, no solo en login.
299. Logs de auditoria de quien accede a que recuerdo/carta/legado, con timestamp.
300. MFA obligatorio para cuentas con rol admin.
301. Principio de menor privilegio en los scopes del JWT (usuario, heredero, admin claramente separados).
302. Verificacion de firmas HMAC en los webhooks entrantes (Resend, ElevenLabs, Clerk si sigue activo).
303. Politica clara de retencion y borrado de datos, accesible al usuario.
304. Derecho de descarga y borrado total de datos (estilo GDPR) desde el perfil.
305. Consentimiento explicito y versionado antes de clonar la voz de alguien.
306. Cambios de configuracion de seguridad que requieran confirmacion adicional (no un solo clic).
307. Alertas de anomalias de acceso (ubicacion o patron inusual) sobre cuentas.
308. Verificacion de integridad (hash) de archivos multimedia al subirlos y antes de servirlos.
309. Limite de tamano de carga por archivo para evitar abuso de almacenamiento.
310. Escaneo de virus/malware en archivos subidos antes de aceptarlos en la boveda.
311. HSTS configurado correctamente a nivel de dominio.
312. Eliminar headers que delaten el stack tecnico (Server, X-Powered-By) en produccion.
313. Revision de todo uso de contenido dinamico en React para descartar XSS.
314. Pruebas de penetracion periodicas, al menos antes de cada lanzamiento mayor.
315. Politica de menor exposicion: lo que no necesita ser publico, no lo es por default (ya aplicado parcial con robots.txt).
316. Doble aprobacion para activar el "modo legado" de una cuenta (evitar activacion prematura o fraudulenta).
317. Encriptado especifico y mas fuerte para contenido marcado como "ultra confidencial" por el usuario.
318. Revision de permisos de Vercel Blob para que nada quede accesible publicamente por error.
319. Backups cifrados y probados (no solo existir, sino verificar que se pueden restaurar).
320. Plan de respuesta a incidentes documentado: que hacer si hay una brecha real (a quien avisar, en cuanto tiempo).
321. Limitar el numero de dispositivos/sesiones activas simultaneas por cuenta, con visibilidad para el usuario.
322. Cierre de sesion remoto desde el perfil (ver y revocar sesiones activas).
323. Verificacion de email obligatoria antes de poder anadir un heredero (evitar invitaciones a direcciones falsas).
324. Captcha o proteccion anti-bot en registro y en formularios publicos.
325. Revision legal de los terminos de "modo legado" para que sean exigibles, no solo UX.
326. Aislar el contenido de cada usuario de forma que un bug de query nunca exponga datos de otro usuario (revision de queries multi-tenant).
327. Politicas de contrasena razonables (longitud minima, sin requisitos absurdos que generen contrasenas debiles reusadas).
328. Notificacion al usuario por correo ante cambios criticos (cambio de contrasena, nuevo heredero anadido, nuevo dispositivo).
329. Revision periodica de dependencias (npm audit / Dependabot) para parches de seguridad.
330. Entrenamiento/checklist interno minimo antes de cada deploy que toque auth o datos sensibles.

## 10. Notificaciones y emails transaccionales

331. Asunto personalizado con nombre y accion especifica en lugar de copy generico.
332. Linea de previsualizacion optimizada para bandeja de entrada.
333. Plantillas responsive consistentes en movil y escritorio.
334. Branding (logo, paleta) de Eternime presente en todos los emails transaccionales.
335. Variables dinamicas (nombre, fecha, enlace) inyectadas via plantilla en vez de strings concatenados.
336. CTA claros y con verbo de accion ("Completa tu perfil", "Lee tu carta").
337. Version web del email por si el cliente de correo rompe el formato.
338. Plazo claro y visible cuando una accion tiene fecha limite.
339. Mensaje breve sobre seguridad/encriptado en correos sensibles, para generar confianza.
340. Numero de referencia unico por notificacion, para soporte y trazabilidad.
341. Tono distinto segun el tipo de email (bienvenida calida vs alerta urgente).
342. Boton "agregar al calendario" (.ics) en recordatorios con fecha.
343. Envio respetando zona horaria del destinatario.
344. Enlaces a ayuda/tutoriales dentro del correo cuando aplique.
345. Opcion de baja de notificaciones no criticas, manteniendo las esenciales.
346. Mini FAQ contextual segun el tipo de correo enviado.
347. Pruebas A/B de asunto/CTA para mejorar tasa de apertura en campanas no urgentes.
348. Indicador de progreso en emails de configuracion de cuenta o boveda.
349. Vista previa segura (sin exponer contenido sensible) en avisos de entrega de carta.
350. Confirmacion de entrega con fecha/hora exacta en la zona horaria del receptor.
351. Reenvio con un clic desde el panel si el usuario lo solicita.
352. Aviso explicito de expiracion de enlaces sensibles ("este enlace caduca en 24h").
353. Acceso directo a gestion de herederos desde el email relevante, sin pasos intermedios.
354. Email de "actividad inusual" cuando se detecta acceso fuera de lo normal.
355. Resumen mensual opcional para el usuario sobre el estado de su legado (cartas pendientes, recuerdos totales).

## 11. Performance, infraestructura y SEO

356. ISR en paginas con contenido cambiante (explora, precios) para mejor tiempo de respuesta.
357. Compresion Brotli activa en Vercel.
358. next/image con AVIF/WebP en todas las imagenes del sitio.
359. Connection pooling correcto a Neon (pgbouncer) para evitar agotar conexiones bajo carga.
360. Cache (Vercel KV/Edge Config) para respuestas de lectura frecuente que no cambian a cada request.
361. Analisis de bundle para identificar y eliminar codigo muerto.
362. Cache-Control agresivo (immutable) en assets estaticos versionados.
363. Lazy loading de componentes pesados (visor de recuerdos, reproductor de voz) con dynamic import.
364. Fuentes locales con font-display swap en vez de cargar de Google Fonts en cada request.
365. Preconnect a dominios externos criticos usados en runtime (ElevenLabs, Gemini, Resend si aplica).
366. next-sitemap o equivalente automatizado para mantener sitemap.xml actualizado sin mantenimiento manual.
367. Meta tags Open Graph y Twitter Card dinamicos por pagina.
368. JSON-LD structured data para mejorar como aparece Eternime en buscadores.
369. Revision periodica de robots.txt para que bloquee correctamente /app, /admin, /api.
370. Titulos y descripciones unicas por pagina, sin duplicados (auditoria SEO basica).
371. Indices en Neon para las consultas mas frecuentes (busqueda de recuerdos, listado de cartas pendientes).
372. Monitoreo de queries lentas en Neon con alertas si superan un umbral.
373. Health checks automaticos con alertas (Vercel + algun canal externo) si el sitio cae.
374. Integracion de monitoreo de errores en produccion (lo que ya usamos hoy via get_runtime_errors, formalizado).
375. Medicion continua de Core Web Vitals (LCP, CLS, INP) con alertas si se degradan.
376. Pruebas de carga periodicas antes de campanas de marketing grandes.
377. Auditoria de dependencias para reducir peso del bundle de cliente.
378. Prefetch inteligente de rutas probables (ej. de /entrar a /app).
379. Revision de que el manifest.json y los iconos PWA esten optimizados para instalacion rapida.
380. Politica de cache clara para /api/eternime/status y endpoints similares de solo lectura.
381. Documentacion tecnica minima del proyecto (README real, no solo el generico de create-next-app).
382. Pipeline de CI que corra build + lint antes de cada merge a main (evitar lo de hoy: push directo sin checks).
383. Ambiente de staging/preview separado de produccion para probar cambios sensibles antes del deploy real.
384. Backups verificados de Neon con prueba de restauracion periodica.
385. Revision de que region de Neon/Vercel sea la mas cercana al mercado objetivo (LATAM/Mexico) para latencia.

## 12. PWA nativa / experiencia tipo app nativa (siguiente fase)

386. Envolver la PWA con Capacitor (recomendado sobre Cordova) para empaque iOS/Android real.
387. Notificaciones push reales via FCM (Android) y APNs (iOS), no solo notificaciones web.
388. Autenticacion biometrica nativa (Face ID/Touch ID) como alternativa al login por contrasena.
389. Almacenamiento offline robusto (IndexedDB con posible capa SQLite via Capacitor) mas alla del cache actual del SW.
390. display:standalone y theme_color correctamente afinados en el manifest para que se vea nativo de verdad.
391. Service worker con precaching mas granular y fallback especifico para contenido multimedia pesado.
392. Modo oscuro que respete la configuracion del sistema operativo automaticamente.
393. Sincronizacion en segundo plano (Background Sync) para subir recuerdos capturados sin conexion.
394. Manejo robusto de conectividad intermitente con cola de sincronizacion visible al usuario.
395. Gestos nativos (swipe entre recuerdos, pinch para zoom en fotos).
396. Acceso nativo a camara y microfono para captura directa de fotos/audio de mayor calidad.
397. Escaneo de QR para invitaciones de herederos o acceso rapido a un recuerdo compartido.
398. Permisos solicitados de forma contextual (no todos de golpe al abrir la app).
399. Code splitting agresivo para que la app cargue rapido incluso en redes moviles lentas.
400. Widget de pantalla de inicio (iOS/Android) mostrando, por ejemplo, "recuerdos de este dia".
401. Conexion persistente (WebSocket) para que hablar con Eon se sienta instantaneo en movil.
402. Speech-to-text y text-to-speech nativos como fallback de accesibilidad.
403. Sistema de versiones de recuerdos con posibilidad de revertir cambios.
404. Share API nativo para compartir un recuerdo (con permiso) fuera de la app.
405. Deep linking para abrir un recuerdo o carta especifica directo desde una notificacion o enlace.
406. Modo invitado (sin cuenta) para que un heredero vea un memorial publico antes de registrarse.
407. PIN como metodo alternativo de desbloqueo si la biometria falla.
408. Busqueda funcional incluso sin conexion sobre lo ya sincronizado localmente.
409. Manejo de archivos grandes (videos largos) sin trabar la app en dispositivos de gama baja.
410. Notificaciones locales programadas para aniversarios y fechas relevantes, sin depender del servidor.
411. UI que respete convenciones nativas (Material en Android, Human Interface en iOS) sin perder la identidad Eternime.
412. Logs de auditoria encriptados accesibles tambien desde la app nativa.
413. Exportar recuerdos en formatos estandar (ZIP, PDF, video) directo desde el dispositivo.
414. Deteccion automatica de zona horaria del dispositivo para timestamps correctos.
415. Pruebas end-to-end automatizadas (Cypress/Playwright) antes de cada release de la app nativa.
416. Modo "ahorro de bateria" que reduzca sincronizaciones en segundo plano si la bateria esta baja.
417. Actualizaciones OTA para cambios menores sin pasar por revision de las tiendas cada vez.
418. Respaldo cifrado en la nube independiente del flujo web, accesible desde la app nativa.
419. Analitica de uso que funcione offline y sincronice despues, sin perder datos de comportamiento.
420. Tutorial interactivo de bienvenida en el primer lanzamiento de la app nativa.
421. Deteccion automatica del idioma del dispositivo para la interfaz.
422. Flujo de "borrar mis datos" accesible y claro al desinstalar/eliminar cuenta, cumpliendo normativas de privacidad.
423. Soporte de pago in-app (Apple Pay/Google Pay) si se monetiza por planes dentro de la app nativa.
424. Publicacion cuidada en App Store y Play Store con metadatos, capturas y politica de privacidad correctos.
425. Revision de seguridad dedicada antes de cada release de la app nativa (mas estricta que la web por el acceso a sensores).
426. Manejo de "app en segundo plano" que pause llamadas de voz con Eon de forma elegante, no abrupta.
427. Indicador claro de estado de sincronizacion (todo guardado / pendiente de subir) visible en la UI movil.
428. Soporte de accesibilidad nativo (VoiceOver/TalkBack) en toda la app, no solo en web.
429. Onboarding de permisos explicando POR QUE se piden camara/microfono/notificaciones, en el tono de marca.
430. Plan de versionado claro (semver) y changelog visible para usuarios curiosos sobre que cambio en cada release.

## 13. Monetizacion, planes, crecimiento y retencion (tono sensible, no growth agresivo)

431. Plan "Familia" con almacenamiento y minutos de voz compartidos para varios miembros.
432. Creditos de voz como micro-compra puntual sin necesidad de cambiar de plan completo.
433. Suscripcion regalo (alguien paga el plan para otra persona), con codigo de activacion.
434. Plan con backup automatico de fotos/videos a mayor nivel de redundancia.
435. Opcion de "bloquear" contenido por anos adicionales a costo bajo (almacenamiento garantizado a largo plazo).
436. Prueba gratuita limitada en almacenamiento y minutos de voz, sin tarjeta requerida.
437. Paquetes tematicos guiados ("primeros pasos", "viajes", "familia") a precio fijo, como ayuda a empezar.
438. Soporte prioritario como beneficio de plan premium, dado lo emocional del producto.
439. Transcripcion automatica de audio a texto incluida en planes superiores.
440. Cambio de plan flexible mes a mes sin penalizacion.
441. Programa de referidos discreto orientado a profesionales (abogados, planificadores patrimoniales).
442. Descuento por permanencia que premia anos de suscripcion continua.
443. Compartir selectivamente una coleccion de recuerdos con alguien externo, como funcion paga puntual.
444. Espacio de almacenamiento adicional comprable por bloques, sin forzar upgrade de plan completo.
445. Suscripcion anual con beneficio claro (mas minutos de voz + mas almacenamiento) frente a mensual.
446. Garantia de restauracion de datos como diferenciador premium, comunicada con claridad.
447. Integracion opcional con servicios de testamento/notarios via API, como linea B2B2C.
448. Renovacion automatica con opcion de "precio congelado" para clientes antiguos, generando confianza.
449. Pagina de precios que explique el valor en terminos humanos, no solo specs (GB, minutos).
450. Comparativa de planes clara mostrando que pasa con el legado si se cancela la suscripcion (politica de gracia).
451. Recordatorio amable antes de que expire una suscripcion, evitando perdida accidental de acceso al legado.
452. Opcion de "pausar" la cuenta en vez de cancelarla, preservando los datos sin cobrar mientras tanto.
453. Reportes de uso enviados al usuario para que entienda cuanto ha llenado su boveda y si necesita mas espacio.
454. Plan especial o descuento para casos de enfermedad terminal, comunicado con sensibilidad (no como promocion).
455. Transparencia total sobre que pasa con el pago si la cuenta entra en modo legado (quien paga despues).
456. Onboarding de precios sin presion: dar tiempo razonable antes de pedir tarjeta.
457. Facturas y recibos claros, exportables, para quienes llevan esto como gasto de planificacion patrimonial.
458. Politica de reembolso clara y humana, sin letra pequena agresiva.
459. Seguimiento de NPS/satisfaccion con preguntas breves, no intrusivas, dado el contexto emocional.
460. Caso de uso B2B2C: alianzas con funerarias o notarias que ofrezcan Eternime como parte de sus servicios.

## 14. Accesibilidad, etica y cumplimiento legal

461. Modo de alto contraste y texto ajustable para baja vision.
462. Soporte real de lector de pantalla con etiquetas ARIA en toda la interfaz.
463. Navegacion completa por teclado sin depender del mouse.
464. Subtitulos automaticos sincronizados en cualquier video del producto.
465. Audiodescripcion disponible para usuarios con discapacidad visual.
466. Formularios claros con ayuda contextual para usuarios con discapacidad cognitiva.
467. Cumplimiento con WCAG 2.2 nivel AA en los flujos criticos (registro, boveda, cartas).
468. Consentimiento informado y explicito de la persona antes de clonar su voz, no implicito por usar la app.
469. Verificacion de parentesco/autorizacion antes de activar el modo legado para un heredero.
470. Proceso simple de revocacion de consentimiento de uso de voz en cualquier momento mientras la persona vive.
471. Aviso claro sobre el impacto emocional de interactuar con una IA que imita a alguien fallecido.
472. Limites configurables de uso (tiempo diario, frecuencia) para evitar dependencia emocional no saludable.
473. Filtro de contenido que evite que la IA genere respuestas daninas, manipuladoras o fuera de caracter.
474. Auditoria de interacciones con el "modo legado" para detectar uso indebido.
475. Canal de reporte para que un familiar denuncie un uso indebido del legado de otra persona.
476. Cumplimiento con normativas de proteccion de datos aplicables a Mexico/LATAM y, si aplica, GDPR para usuarios en UE.
477. Minimizacion de datos: recolectar solo lo necesario para el funcionamiento, nada de mas "por si acaso".
478. Evaluacion de impacto de privacidad antes de lanzar funciones nuevas que toquen datos sensibles (ej. biometria).
479. Politica de retencion y borrado de datos clara y accesible desde la app, no solo en terminos legales.
480. Contrato/terminos especificos que prohiban comercializar o usar el avatar de voz fuera del proposito original.
481. Informar claramente los derechos del usuario (acceso, rectificacion, eliminacion) en lenguaje sencillo.
482. MFA obligatorio para acceder al "modo legado" de una persona fallecida, dado lo sensible.
483. Restriccion de exportacion de modelos de voz fuera de la plataforma para evitar mal uso.
484. Memorial publico desactivado por defecto, el usuario debe activarlo explicitamente.
485. Revision periodica (interna, no necesariamente comite formal aun) antes de anadir capacidades nuevas a Eon.
486. Reporte de transparencia periodico (interno primero, publico despues) sobre uso y denuncias.
487. Tutoriales claros sobre derechos y responsabilidades al usar Eternime, en espanol llano.
488. Posibilidad de designar un "curador" familiar que modere contenido sensible antes de mostrarlo a otros herederos.
489. Recomendacion de apoyo profesional (sin sustituirlo) si el uso del modo legado parece generar malestar.
490. Compatibilidad con tecnologias de asistencia (lectores de pantalla, control por voz) documentada.
491. Plan de contingencia para desactivar permanentemente un modo legado si se detecta abuso.
492. Texto legal especifico sobre que pasa con los datos si la empresa Eternime cerrara operaciones (continuidad para el usuario).
493. Claridad sobre quien es el "dueno legal" del legado digital tras el fallecimiento (usuario en vida lo define explicitamente).
494. Disclaimer visible de que Eon es una recreacion basada en datos, no una continuidad real de la persona.
495. Revision de copy en toda la app para evitar prometer algo que el producto tecnicamente no puede garantizar.
496. Opcion de "vista previa" del modo legado para el propio usuario en vida, para que apruebe como se vera.
497. Politica clara sobre menores de edad como herederos (que pueden ver, a que edad).
498. Acuerdo de procesamiento de datos (DPA) disponible para clientes B2B2C (funerarias, notarias).
499. Idioma legal de los terminos de servicio revisado por alguien con conocimiento legal real, no solo generado por IA.
500. Checklist etico-legal obligatorio antes de cada lanzamiento de feature que toque voz, IA o datos de un fallecido.
