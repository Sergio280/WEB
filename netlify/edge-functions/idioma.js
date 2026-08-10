import { SPANISH_COUNTRIES } from '../../app-v2/src/i18n/paises-hispanos.js';

// ─────────────────────────────────────────────────────────────────────────────
// idioma.js — manda a "/en/" al visitante que no está en un país hispanohablante.
//
// POR QUÉ EN EL EDGE Y NO EN EL NAVEGADOR
// La versión anterior cambiaba los TEXTOS sin cambiar la URL: "/" se anunciaba
// como la página en español (canonical + hreflang) y a la vez servía inglés a
// medio mundo. Para un buscador eran dos URLs con el mismo contenido y ninguna
// forma de saber cuál indexar para cada idioma.
//
// Aquí la decisión se toma ANTES de servir nada, así que:
//   · el visitante internacional aterriza directamente en /en/ — sin ver un
//     destello de español ni esperar a que resuelva una petición de geo;
//   · la URL y el contenido nunca se contradicen: "/" siempre es la página en
//     español y "/en/" siempre la inglesa.
//
// POR QUÉ LOS RASTREADORES NO SE REDIRIGEN
// El rastreador de Google sale casi siempre de IPs estadounidenses. Si se le
// redirigiera, vería la landing del mercado principal —Perú— como una simple
// redirección y podría dejar de indexarla en español. Excluyéndolo, recibe
// exactamente el contenido que "/" declara ser en su canonical, que es la
// versión honesta; y "/en/" sigue siendo alcanzable por su propia URL, está en
// el sitemap y ambas se declaran con hreflang recíproco, así que las dos se
// indexan por separado. No es encubrimiento: a nadie se le enseña algo distinto
// de lo que la URL dice ser.
//
// LA ELECCIÓN DEL USUARIO MANDA SOBRE TODO
// `setLang` (app-v2/src/i18n/LanguageProvider.jsx) escribe la cookie bims_lang
// además de guardar la preferencia en localStorage, precisamente para que se
// pueda leer AQUÍ. Sin eso, quien pulsara «Ver en español» desde /en/ llegaría
// a "/" y esta función volvería a echarlo a /en/ en un bucle sin salida.
// ─────────────────────────────────────────────────────────────────────────────

// No se redirige a rastreadores ni a los robots que generan las vistas previas
// de enlaces (WhatsApp, Slack, Telegram…): la miniatura debe corresponder a la
// URL que se compartió.
const ROBOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|embedly|quora|pinterest|slack|discord|vkshare|preview|scraper|archiver|lighthouse|headlesschrome/i;

export default async (request, context) => {
  const url = new URL(request.url);

  // Solo la home en español. "/en/" NO se toca nunca — es lo que hace imposible
  // un bucle de redirecciones.
  if (url.pathname !== '/') return;

  if (ROBOTS.test(request.headers.get('user-agent') || '')) return;

  // Preferencia explícita: gana a la geolocalización, en los dos sentidos.
  const elegido = /(?:^|;\s*)bims_lang=(es|en)/.exec(request.headers.get('cookie') || '')?.[1];
  if (elegido === 'es') return;
  if (elegido === 'en') return aIngles(url);

  // Sin país (geo indeterminada) se queda en español: la base instalada es
  // mayoritariamente peruana, así que es el fallback menos dañino.
  const pais = (context.geo?.country?.code || '').toUpperCase();
  if (!pais || SPANISH_COUNTRIES.has(pais)) return;

  return aIngles(url);
};

function aIngles(url) {
  const destino = new URL(url);
  destino.pathname = '/en/';
  // La query se conserva tal cual: ahí viajan ?promo= y el gclid del anuncio.
  // Perder cualquiera de los dos le costaría al visitante su descuento o a
  // nosotros la atribución de la campaña. El ancla la reaplica el navegador.
  return new Response(null, {
    status: 302, // temporal: "/" sigue siendo una página por derecho propio
    headers: {
      location: destino.toString(),
      // La respuesta depende de la cookie de idioma: que ninguna caché
      // intermedia sirva esta redirección a quien ya eligió español.
      vary: 'Cookie',
      'cache-control': 'no-store',
    },
  });
}
