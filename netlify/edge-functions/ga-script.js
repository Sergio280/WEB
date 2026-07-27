// ─────────────────────────────────────────────────────────────────────────────
// ga-script.js — Sirve gtag.js DESDE bimsaddin.com en vez de googletagmanager.com.
//
// POR QUÉ: la mayoría de bloqueadores (uBlock, AdGuard, Brave, Safari ITP)
// bloquean el DOMINIO googletagmanager.com, así que el script de GA4 nunca carga
// y GA4 no ve la visita aunque el navegador sí abrió la página. Sirviendo el
// MISMO script desde un dominio propio, los bloqueadores (que filtran por
// dominio, no por contenido) dejan de detectarlo.
//
// POR QUÉ EDGE Y NO FUNCTION: esto antes era una Netlify Function (Lambda), y
// como el <script> está en el <head> de todas las páginas, cada visitante nuevo
// pagaba un cold start (~200-800 ms) y una invocación facturable sólo para
// servir un archivo estático. Una edge function corre en el PoP más cercano, sin
// cold start, y además puede cachear la respuesta upstream entre peticiones.
//
// La ruta se configura en netlify.toml ([[edge_functions]] path="/ga4/gtag.js").
// ─────────────────────────────────────────────────────────────────────────────

// Measurement ID de GA4 del sitio (público por diseño, va en el HTML igual).
// No se acepta ningún id por query: así este proxy no puede usarse para servir
// el script de OTRO sitio.
const GA_MEASUREMENT_ID = 'G-P5ZL4FBL4S';
const UPSTREAM = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

// Cache en memoria del PoP. gtag.js cambia con poca frecuencia; 1 h es lo que
// usa el propio Google. Evita ir a googletagmanager en cada petición.
const TTL_MS = 60 * 60 * 1000;
let cached = null; // { body, contentType, at }

export default async (request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405 });
  }

  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    try {
      const upstream = await fetch(UPSTREAM, {
        headers: {
          // Reenviamos el User-Agent del visitante: Google sirve variantes del
          // script según el navegador.
          'User-Agent': request.headers.get('user-agent') || '',
        },
      });
      if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
      cached = {
        body: await upstream.text(),
        contentType: upstream.headers.get('content-type') || 'application/javascript',
        at: now,
      };
    } catch {
      // Si Google no responde y no hay copia previa, devolvemos un script vacío
      // con 200: un 5xx aquí dejaría un error visible en consola en cada carga
      // de página, y la analítica nunca debe romper el sitio.
      if (!cached) {
        return new Response('/* ga unavailable */', {
          status: 200,
          headers: {
            'content-type': 'application/javascript; charset=utf-8',
            'cache-control': 'public, max-age=60',
          },
        });
      }
      // Con copia previa: se sirve aunque esté vencida.
    }
  }

  return new Response(cached.body, {
    status: 200,
    headers: {
      'content-type': cached.contentType,
      'cache-control': 'public, max-age=3600',
    },
  });
};
