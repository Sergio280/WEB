# Análisis de la web BIMS — bugs y optimizaciones

Auditoría de `bimsaddin.com`: landing React (`app-v2/`, servida en `/`), funciones
Netlify (`netlify/functions/`) y configuración de despliegue (`netlify.toml`).
Fecha: 2026-07-27. Rama: `claude/website-bugs-optimizations-tmcenl`.

Método: lectura completa del código, `npx vite build` para medir el bundle real,
`file(1)` sobre los assets, y contraste con el plugin (`bims-vanilla-revit`) para
verificar qué endpoints y rutas se consumen de verdad.

Este documento es **sólo análisis**. No se ha modificado código de producción.

---

## Resumen

| Severidad | Nº | Titular |
|---|---|---|
| Crítico | 4 | Webhook de Culqi confía en el body sin verificar · SKU de S/5 en producción · `/api/usage` abierto · botón de pago que se queda colgado |
| Medio | 8 | Iconos JPEG disfrazados de PNG · GA4 sin User-Agent · rate-limit que descarta analítica · inglés invisible para Google |
| Menor | 9 | Accesibilidad de modales, `prefers-reduced-motion`, anclajes bajo el navbar, etc. |
| Optimización | 13 | Bundle de 574 KB sin dividir · Lambda en el camino crítico · 40 MB de binarios por deploy |

Lo más urgente son **B1** y **B2**: juntos permiten obtener una licencia
Profesional de larga duración por S/5 o gratis.

---

## Bugs críticos

### B1 · `culqi-webhook` verifica contra la API de Culqi pero luego usa el body no confiable

`netlify/functions/culqi-webhook.js:82-104`, `159-197`

El diseño es correcto en la intención: como Culqi v2 no firma los webhooks, se
valida el `id` contra la API de Culqi con la clave secreta. El problema es que
`verifyChargeWithCulqi()` **descarta el objeto que devuelve la API** y sólo
retorna un booleano:

```js
let verified = false;
if (isCharge) verified = await verifyChargeWithCulqi(object.id);  // sólo bool
...
if (isCharge) await handleCharge(object);   // ← `object` viene del body
```

Y `handleCharge()` lee del body todo lo que determina la licencia:

```js
const email    = charge.email;
const meta     = charge.metadata || {};
const months   = parseInt(meta.months || DURATION_MONTHS[duration] || 1);
const maxDev   = parseInt(meta.maxDevices || PLAN_MAX_DEVICES[plan] || 1);
```

**Explotación.** El endpoint `/api/culqi-webhook` es público (`netlify.toml`) y no
puede exigir autenticación. Basta con conocer un `chr_` válido — se obtiene
haciendo una compra cualquiera, incluida la de S/5 del bug B2 — y hacer:

```
POST /api/culqi-webhook
{ "object": "charge", "id": "chr_<válido>", "email": "atacante@x.com",
  "metadata": { "plan": "profesional", "months": "120", "maxDevices": "99" } }
```

La verificación pasa (el cargo existe y su outcome es `venta_exitosa`) y se
provisiona una licencia Profesional de 10 años para el email del atacante. La
deduplicación por `users_v2/{uid}/payments/{chargeId}` no protege, porque el
`uid` se deriva del email del body: un email nuevo es siempre un `uid` sin
historial.

Lo mismo aplica a suscripciones: `verifySubscriptionWithCulqi()` acepta
cualquier estado y `handleSubscription()` lee `sub.metadata.email`.

**Corrección.** Que `verifyChargeWithCulqi` devuelva el objeto de la API y que
`handleCharge`/`handleSubscription` trabajen exclusivamente con él. El `email`,
el `amount` y la `metadata` autorizados son los que Culqi tiene registrados, no
los que llegan por HTTP.

---

### B2 · SKU de prueba de S/5 activo en el endpoint de cobro de producción

`netlify/functions/culqi-charge.js:20-22`

```js
test: {
    'test': { title: 'BIMS TEST – S/5', amount: 500, months: 1 },
},
```

El frontend nunca envía `plan: 'test'`, pero el endpoint sólo valida el `Origin`
(trivialmente falsificable con `curl -H "Origin: https://bimsaddin.com"`) y
acepta cualquier clave del catálogo. La cadena completa funciona:

`plan:'test', duration:'test'` → cobro real de S/5 → webhook → `handleCharge`
con `months=1` → **licencia Monthly completa**. Precio de catálogo: S/60.

Además es la vía más barata de conseguir el `chr_` válido que necesita B1.

**Corrección.** Eliminar la entrada, o condicionarla a
`process.env.ALLOW_TEST_SKU === 'true'` (nunca activa en producción).

---

### B3 · `/api/usage` escribe en Firebase sin autenticación ni límite

`netlify/functions/usage-event.js:41-83`

```js
const origin = event.headers.origin || '';
if (origin && !ALLOWED_ORIGINS.includes(origin)) return ok({ ignored: 'origin' });
```

El filtro sólo actúa **si el header viene**; omitirlo lo salta por completo. El
`uid` llega en el body sin verificar, no hay rate-limit (a diferencia de
`proxy-core.js`, que sí lo tiene) y se escribe con el Admin SDK:

```js
await db.ref('usage_events').push({ func, uid, n, lic, ver, at });
```

Cualquiera puede inflar la RTDB sin límite (coste y cuota de Firebase) y
envenenar los datos de uso. Esto último importa: el propio encabezado del
archivo dice que estos eventos sirven para *"decidir con datos cuáles [funciones]
capar y con qué N"*.

**Corrección.** Exigir el `idToken` del usuario (como hace `verify-license.js`) o,
como mínimo, aplicar el `gate()` de `proxy-core.js` y rechazar peticiones sin
`Origin`.

---

### B4 · El botón de pago se queda bloqueado en "Procesando…" si se cierra el checkout

`src/hooks/useCulqi.js:22-26` + `src/components/sections/CulqiModal.jsx:69`

`handlePay()` pone `setProcessing(true)` **antes** de abrir Culqi. El callback
global tiene dos salidas tempranas que no avisan a la UI:

```js
if (window.Culqi.error) { console.warn('[Culqi] Error/cancelado:', ...); return; }
if (!window.Culqi.token) return;
```

Ninguna llama a `ctx.onError`, así que `processing` nunca vuelve a `false`.
Cerrar el popup de Culqi o que la tarjeta sea rechazada deja el botón
`disabled` de forma permanente: el usuario tiene que recargar la página para
volver a intentarlo.

Es un fallo de conversión directo, en el punto exacto donde se paga, y afecta
al caso más común (el usuario que abre el checkout y se lo piensa).

**Corrección.** Llamar a `ctx.onError(...)` en ambas ramas, o mover
`setProcessing(true)` a después de que Culqi confirme el token.

---

## Bugs medios

### B5 · Los iconos de `/icono` son JPEG con extensión `.png`

```
icono/favicon-16.png:       JPEG image data ... 16x16     (11.7 KB)
icono/favicon-32.png:       JPEG image data ... 32x32     (12.6 KB)
icono/favicon-512.png:      JPEG image data ... 512x512   (132 KB)
icono/apple-touch-icon.png: JPEG image data ... 180x180   (37 KB)
```

Se declaran como `type="image/png"` en `app-v2/index.html:28-31` y Netlify los
sirve con `Content-Type: image/png` (deduce por extensión). Consecuencias:

- **Sin canal alfa.** JPEG no tiene transparencia: el favicon y el
  apple-touch-icon llevan un fondo opaco incrustado.
- **Peso absurdo.** Un PNG real de 16×16 pesa ~200 bytes; aquí son 11.7 KB
  (JPEG a calidad máxima con cabecera de 300 DPI). El logo del Navbar
  (`Navbar.jsx:45`) y del Footer (`Footer.jsx:13`) usan `favicon-32.png`.
- Consumidores estrictos del MIME (manifests PWA, algunos scrapers) los rechazan.

---

### B6 · Los beacons de GA4 proxied pierden el User-Agent y la IP real

`netlify/functions/_lib/proxy-core.js:86-90`

```js
upstream = await fetch(targetUrl, {
    method,
    headers: body != null ? { 'Content-Type': contentType } : undefined,
    body,
});
```

Sólo se reenvía `Content-Type`. Todo lo que sale por `/g/*` llega a Google con
el User-Agent de Node/undici y la IP del datacenter de Netlify.

El equipo ya detectó y parcheó la mitad del problema — el commit `fa83deb` manda
el país real como user property `real_country` precisamente porque la geo de
Google quedó inservible. Pero **dispositivo, navegador, sistema operativo y
resolución siguen igual de rotos** en todos los informes de GA4 desde que se
activó el proxy. Cualquier decisión basada en "% de tráfico móvil" o "navegador
más usado" está tomada sobre datos falsos.

**Corrección.** Reenviar `user-agent`, `accept-language` y `X-Forwarded-For` con
la IP del cliente (`x-nf-client-connection-ip`) en `forward()`.

---

### B7 · El rate-limit del proxy también descarta beacons de analítica

`netlify/functions/_lib/proxy-core.js:58-71` aplicado en `ga-collect-proxy.js:18`

60 peticiones por minuto **por hash de IP**. Una oficina detrás de NAT comparte
una sola IP pública: con 10-15 personas navegando el sitio a la vez se supera el
umbral y GA4 pierde hits en silencio (respuesta 429, sin reintento).

Es justo el perfil de su cliente objetivo — las constructoras cuyos firewalls
motivaron los proxies en primer lugar.

Además, `if (_hits.size > 5000) _hits.clear()` resetea la ventana de **todos**
los clientes de golpe, lo que hace el límite errático.

**Corrección.** Excluir `ga-collect-proxy` del rate-limit, o darle un umbral
propio mucho más alto. El de `gauth`/`gdb` (que protege contra fuerza bruta de
login) sí tiene sentido tal cual.

---

### B8 · La versión en inglés del sitio es invisible para Google

La landing es una SPA en una sola URL:

- `<link rel="canonical" href="https://bimsaddin.com/">` fijo
- `og:locale` fijo a `es_PE`
- el idioma se decide en cliente (geo-IP + `localStorage`) y sólo entonces se
  reescriben `document.title` y la meta description (`LanguageProvider.jsx:127-135`)
- no hay `hreflang`, ni URL `/en`, ni prerender

Googlebot rastrea desde EE.UU. y ejecuta JS, pero el HTML servido, el canonical
y los Open Graph son siempre los españoles. No existe ninguna URL indexable en
inglés.

Con BIMS publicado en el Autodesk App Store (`nav.js:19-22`, fichas ES y EN), el
tráfico objetivo es global y mayoritariamente anglófono. Es la mayor pérdida de
SEO del sitio.

Faltan también: `robots.txt`, `sitemap.xml` y JSON-LD (`SoftwareApplication` y
`FAQPage` — el FAQ ya está estructurado en `translations.js`, sale casi gratis).

---

### B9 · Permissions Policy inválida en el iframe del demo

`src/components/sections/VideoDemo.jsx:28`

```jsx
allow="accelerated-feedback; autoplay; encrypted-media; picture-in-picture"
```

`accelerated-feedback` no existe. Es un typo de `accelerometer`, que está bien
escrito en `Clips.jsx:49`. El navegador ignora el token desconocido.

---

### B10 · `maxresdefault.jpg` sin fallback

`src/components/sections/VideoDemo.jsx:41`

YouTube no genera `maxresdefault` para todos los vídeos; cuando falta devuelve
404 y queda una imagen rota en la portada del demo — la primera pieza visual
después del hero. `Clips.jsx:80` usa `hqdefault`, que siempre existe.

No pude confirmar si el vídeo `U9LvemehIkQ` tiene maxres (este entorno no tiene
salida a `i.ytimg.com`), pero el `onError` que cae a `hqdefault` cuesta una línea
y elimina el riesgo.

---

### B11 · `setMonth()` desborda al calcular el vencimiento

`netlify/functions/culqi-webhook.js:285`

```js
baseDate.setMonth(baseDate.getMonth() + info.months);
```

Comprar el 31 de enero un plan de 1 mes da el 2 o 3 de marzo (febrero no tiene
31). Regala 2-3 días en toda compra de fin de mes. `provision-license.js` tiene
el mismo patrón.

---

### B12 · PII en logs, de forma inconsistente

`create-trial-license.js` enmascara con cuidado (`logSafeEmail()` →
`ju***n@gmail.com`) y documenta la política en su cabecera. El resto no la sigue:
`culqi-webhook` (7 sitios), `culqi-charge:140`, `culqi-subscription`,
`lemonsqueezy-webhook:53`, `admin-create-license` y `provision-license` escriben
el email completo en los logs de Netlify.

Además `culqi-charge.js:124` vuelca el objeto de error de Culqi entero
(`console.error('[culqi-charge] Error:', data)`), que puede incluir datos del
intento de pago.

---

## Bugs menores

| # | Dónde | Qué pasa |
|---|---|---|
| B13 | `CulqiModal.jsx:118` | `AnimatePresence` está **dentro** del componente que el padre desmonta, así que las animaciones `exit` nunca se reproducen. `Clips.jsx:131` lo hace bien (el `AnimatePresence` vive en el padre). |
| B14 | `CulqiModal.jsx`, `Clips.jsx` (Lightbox) | Modales sin `role="dialog"`, `aria-modal`, focus trap ni restauración de foco. Se puede tabular al contenido de detrás mientras el modal está abierto. |
| B15 | `LanguageProvider.jsx:106` | `explicit` está en las dependencias del efecto de geo: el primer cambio de idioma dispara un segundo `fetch('/api/geo')` cuyo resultado ya no se usa para el idioma. |
| B16 | `Navbar.jsx:96` | El menú móvil no bloquea el scroll del body ni se cierra al tocar fuera. |
| B17 | `index.css:10-12` | `scroll-behavior: smooth` + navbar sticky sin `scroll-margin-top`: los anclajes (`#precios`, `#trial`, `#faq`) aterrizan parcialmente debajo de la barra. |
| B18 | global | Ningún `prefers-reduced-motion`. El marquee infinito, `animate-floaty`, `animate-pulse-ring` y todos los `Reveal` ignoran la preferencia del sistema. |
| B19 | `BeforeAfterSlider.jsx:26-31` | Sin `preventDefault` en `touchmove`: al arrastrar el slider en móvil la página hace scroll a la vez. Tampoco hay control por teclado ni `role="slider"`. |
| B20 | `Download.jsx:31` | El atributo `download` se ignora en URLs cross-origin. Funciona igual porque GitHub manda `Content-Disposition`, pero el atributo no hace nada. |
| B21 | `verify-license.js:22-23` | El comentario promete *"nonce de un solo uso"*, pero el servidor sólo lo hace eco: no hay almacén de nonces. Funciona como challenge-response **si el cliente lo compara**; el comentario describe una garantía que el servidor no da. |

---

## Optimizaciones

### O1 · Bundle único de 574 KB (187 KB gzip) — la más rentable

Medido con `npx vite build`:

```
dist/assets/index-*.css   37.05 kB │ gzip:   7.00 kB
dist/assets/index-*.js   574.06 kB │ gzip: 187.33 kB
(!) Some chunks are larger than 500 kB after minification.
```

No hay code-splitting ni `manualChunks` (`vite.config.js` sólo define `outDir`).
Todo se descarga antes del primer render. Reparto aproximado:

- **chart.js + react-chartjs-2 (~200 KB)** — para tres gráficos que están a ~60%
  del scroll. `Metrics.jsx` importa y registra Chart.js en el módulo raíz, así
  que entra en el bundle inicial sí o sí.
- **framer-motion (~110 KB)** — usado en 6 componentes.
- **`translations.js` (1226 líneas, ~60 KB)** — los dos idiomas completos, aunque
  sólo se muestre uno.

Acciones, por relación coste/beneficio:

1. `React.lazy` + `Suspense` sobre `Metrics` → saca Chart.js del arranque
   (**≈ −35 % del bundle**) sin coste visible: la sección está muy por debajo del
   pliegue.
2. Partir `translations.js` en `es.js` / `en.js` y cargar el segundo con
   `import()` dinámico al pulsar el toggle.
3. `build.rollupOptions.output.manualChunks` para separar el vendor y que la
   caché del navegador sobreviva a los deploys.

Objetivo realista: **~90-110 KB gzip** en el arranque.

---

### O2 · `/ga4/gtag.js` es una Lambda en el camino crítico de cada visita

`netlify.toml` enruta `/ga4/gtag.js` → `ga-script-proxy` (función serverless).
Cada visitante nuevo paga un cold start (~200-800 ms) y una invocación
facturable, sólo para servir un script estático.

`geo.js` ya demuestra que saben usar edge functions. Esta es el caso de libro:
una edge function corre en el PoP más cercano, sin cold start de Lambda, y puede
cachear la respuesta upstream.

---

### O3 · 40 MB de binarios en el repo y en cada despliegue

```
update/BIMS.exe          23.9 MB
update/BIMS-update.zip   17.3 MB
```

Verificado que **nada los consume**:

- El updater del plugin (`UpdateChecker.cs:29`) lee
  `updates/latest.json` de Firebase RTDB, y su `downloadUrl` apunta a GitHub
  Releases.
- `Download.jsx:6` apunta a GitHub Releases.
- `update/version.json` apunta a GitHub Releases.
- La única referencia a `/update/` en todo el repo son las cabeceras de
  `netlify.toml:64-76`.

Y `copy-legacy.mjs:44-50` los copia a `dist/` en **cada** build, así que se
suben 40 MB a Netlify en cada deploy, además de estar en el historial de git.

Antes de borrarlos conviene mirar los logs de acceso de Netlify por si alguna
versión antigua del plugin todavía pide esas rutas.

---

### O4 · Fuentes: 3 familias, 12 pesos, render-blocking

`app-v2/index.html:60` carga desde Google Fonts, con `<link rel="stylesheet">` en
`<head>` (bloquea el primer render; `display=swap` evita el FOIT pero no la
petición):

- Bricolage Grotesque con eje óptico `12..96` en 4 pesos — caro
- Plus Jakarta Sans en 5 pesos
- JetBrains Mono en 3 pesos

JetBrains Mono sólo se usa en la consola simulada del hero. Recortar a los pesos
realmente usados, añadir `<link rel="preload" as="style">` y considerar
autoalojar los `.woff2` críticos (elimina la conexión a `fonts.gstatic.com` del
camino crítico y encaja mejor con la CSP existente).

---

### O5 · Assets de imagen sin optimizar

Además de B5 (reexportar los iconos como PNG real, con alfa):
`og-cover.jpg` son **276 KB** a 1200×630 con densidad 300 DPI. Recomprimido a
calidad 82 debería quedar en ~80 KB sin diferencia visible.

---

### O6 · `background-attachment: fixed` en el `body`

`index.css:14-21`: dos `radial-gradient` de 60rem con `background-attachment:
fixed`. Es un patrón conocido de jank en móvil — obliga a repintar el fondo en
cada frame de scroll. Alternativa sin coste visual: un pseudo-elemento
`position: fixed; inset: 0; z-index: -1` con los mismos gradientes.

---

### O7 · Exceso de `backdrop-blur-xl` simultáneos

La clase `.glass` (`index.css:43-45`) incluye `backdrop-blur-xl` y se aplica a
casi todas las tarjetas: precios (3), métricas rápidas (3), gráficos (3), casos
de uso, FAQ, formulario de trial, bento. El desenfoque de fondo es de los
efectos más caros del compositor; decenas a la vez penalizan el scroll en
portátiles sin GPU dedicada — el hardware típico de un proyectista con Revit
abierto de fondo.

Sugerencia: reservar `backdrop-blur` para los elementos realmente superpuestos
(navbar, modales) y usar un fondo semi-opaco plano en las tarjetas.

---

### O8 · Código muerto y texto duplicado

Sin ninguna importación en todo el proyecto:

- `data/nav.js` → `NAV_LINKS` (el Navbar usa `t.nav.links`)
- `data/culqi.js` → `PLAN_COMPARE` (Pricing usa `p.compare`)
- `data/commands.js` → `RIBBON_COMMANDS` (MarqueeStrip usa `t.marquee.commands`)
- `data/faq.js` → `FAQ` entero (Faq usa `t.faq.items`)

Y parcialmente muerto: de `CATALOG` sólo se usan `key`, `accent`, `featured`,
`priceFrom` y `whatsapp` — `badge`, `name`, `desc` y `ribbon` los pisa la
traducción; de `CLIPS` sólo se usa `yt` (`Clips.jsx:108` descarta `title` y
`desc`).

Es texto duplicado en dos sitios que se va a desincronizar. Vite lo elimina del
bundle por tree-shaking, así que el coste no es de peso sino de mantenimiento.

---

### O9 · Precios en USD duplicados en dos componentes

- `CulqiModal.jsx:31-34` → `USD` (mensual y anual, los 4 valores)
- `Pricing.jsx:17` → `USD_FROM` (sólo mensual, los 2 valores)

Coinciden con los precios reales documentados en `_lib/ls-plans.js:10-13`, pero
un cambio de precio en Lemon Squeezy obliga a tocar tres archivos. Deberían
vivir en `data/culqi.js`, junto a los slugs de checkout.

---

### O10-O13 · Varios

| # | Dónde | Qué |
|---|---|---|
| O10 | `VideoDemo.jsx:44` | La miniatura usa `loading="eager"` aunque en móvil queda bajo el pliegue: compite con el LCP del hero. |
| O11 | `app-v2/index.html` | Sin `preconnect` a `i.ytimg.com` (10 miniaturas entre demo y clips) ni a `checkout.culqi.com`. |
| O12 | `app-v2/index.html:64` | El script de Culqi v4 se carga **síncrono en `<head>`**, bloqueando el parser, aunque sólo hace falta cuando se abre el modal de compra. `defer` o carga bajo demanda. |
| O13 | `Clips.jsx:108` | `CLIPS.map(...)` recrea el array en cada render y fuerza el rerender de las 6 tarjetas. Un `useMemo` sobre `t.clips.items` lo evita. |

---

## Lo que está bien

Vale la pena dejarlo por escrito, porque condiciona qué se puede tocar:

- La **CSP** de `netlify.toml` es una allowlist real, documentada recurso por
  recurso, no un `default-src *`. Se comprobó que cubre lo que el sitio carga hoy,
  incluida la navegación a Lemon Squeezy.
- `create-trial-license.js` es sólido: honeypot, blocklist de desechables,
  rate-limit atómico por transacción, normalización de alias de Gmail, IP tomada
  de `x-nf-client-connection-ip` (no spoofable), enmascarado de PII y rollback
  del rate-limit en cada rama de fallo.
- `verify-license.js` firma el veredicto con ECDSA P-256 y decide con el reloj
  del servidor. El uso de `dsaEncoding: 'ieee-p1363'` por compatibilidad con
  .NET Framework está bien razonado.
- El webhook de **Lemon Squeezy** sí hace lo correcto: HMAC-SHA256 sobre el
  cuerpo crudo con `timingSafeEqual`, más un guard explícito de `test_mode`. Es
  exactamente el modelo que le falta a `culqi-webhook` (B1).
- Los proxies `gauth`/`gdb` reenvían la credencial del cliente en vez de usar el
  Admin SDK, así que las reglas de Firebase siguen aplicando y no son un gateway
  abierto. La allowlist de paths de `gdb-proxy.js:19` es estricta.
- La separación idioma/región de pago en `LanguageProvider` está bien pensada, y
  la corrección manual de región (`Pricing.jsx:144-152`) cubre el fallo real de
  geo-IP con ISPs peruanos.

---

## Orden sugerido

1. **B2** (borrar el SKU de S/5) — una línea, cierra la vía barata a B1.
2. **B1** (usar la respuesta de la API de Culqi como fuente de verdad) — el
   agujero de ingresos de verdad.
3. **B4** (botón colgado) — dos líneas, impacto directo en conversión.
4. **B3** (cerrar `/api/usage`).
5. **O1** (lazy-load de Chart.js) — la mayor mejora de rendimiento por esfuerzo.
6. **B6 + B7** — sin esto, los datos con los que se miden los puntos anteriores
   no son fiables.
7. **B8** (SEO en inglés) — el de mayor techo, y el de más trabajo.
