import { createContext, useContext, useEffect, useState } from 'react';
import { translations, SPANISH_COUNTRIES } from './translations.js';

// ─────────────────────────────────────────────────────────────────────────────
// LanguageProvider — estado global de idioma (es | en) Y región de pago.
//
// EL IDIOMA LO DECIDE LA RUTA, y solo la ruta: "/" es la landing en español y
// "/en/" la inglesa, cada una con su <title>, su description y su canonical
// (ver app-v2/en/). Aquí no se elige nada; se lee.
//
// Suena rígido y es a propósito. Antes el idioma lo decidía la geolocalización
// cambiando los TEXTOS sin cambiar la URL, así que "/" se anunciaba como la
// versión en español y a la vez servía inglés a medio mundo, incluido el
// rastreador de Google (que se conecta sobre todo desde Estados Unidos). Para
// un buscador eran dos URLs con el mismo contenido y ninguna forma de saber
// cuál indexar para cada idioma.
//
// A quien llega de un país no hispanohablante se le manda a /en/, pero eso lo
// decide el EDGE (netlify/edge-functions/idioma.js) antes de servir la página:
// así aterriza directamente en inglés, sin destello de español, y la URL y el
// contenido siguen sin contradecirse. Aquí no se redirige nada.
//
// El aviso de idioma (LangBanner) cubre lo que el edge no puede: quien abre un
// enlace compartido de la otra landing, o a quien la geo-IP le adivinó mal.
//
// REGIÓN DE PAGO (independiente del idioma): 'PE' | 'INTL'. Se deriva SOLO del
// país real (no del idioma), porque idioma y moneda son cosas distintas: un
// ingeniero de México ve el sitio en español pero NO puede pagar con Culqi
// (tarjetas peruanas) ni le sirven precios en soles. Regla: país === PE → 'PE'
// (soles + Culqi); cualquier otro país → 'INTL' (USD + Lemon Squeezy). Mientras
// la geo no resuelve (o falla), se asume 'PE' para no degradar el flujo probado
// de Perú; en 'INTL' el usuario igual puede alternar a Culqi en el modal.
//
// El idioma elegido se refleja en <html lang="…"> para accesibilidad y SEO.
// ─────────────────────────────────────────────────────────────────────────────
const LangContext = createContext(null);
const STORAGE_KEY = 'bims_lang';
const REGION_OVERRIDE_KEY = 'bims_region_override';

function savedLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'es' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

// La preferencia se guarda TAMBIÉN en una cookie, no por gusto: localStorage no
// viaja en la petición, así que el edge no puede leerlo. Sin esta cookie, quien
// pulsara «Ver en español» desde /en/ llegaría a "/" y el edge volvería a
// echarlo a /en/ — un bucle del que no se sale.
function guardarCookieIdioma(lang) {
  try {
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* sin cookies el edge decide por geo, que es el comportamiento por defecto */
  }
}

// Corrección manual de región cuando la geo-IP se equivoca (pasa con algunos
// ISPs peruanos cuyo bloque de IP está registrado a nombre de su matriz en el
// extranjero). NO reemplaza la detección automática: solo la sobre-escribe si
// el usuario explícitamente dice "no, estoy en Perú" / "no, estoy afuera".
function savedRegionOverride() {
  try {
    const v = localStorage.getItem(REGION_OVERRIDE_KEY);
    return v === 'PE' || v === 'INTL' ? v : null;
  } catch {
    return null;
  }
}

// Idioma que impone la URL. El inglés vive en /en/ como página propia.
export function langDeLaRuta() {
  return /^\/en(\/|$)/.test(window.location.pathname) ? 'en' : null;
}

// Ruta de la landing en un idioma, conservando promo (?promo=), gclid y ancla:
// cambiar de idioma no puede costarle al visitante su descuento ni el sitio
// exacto de la página donde estaba mirando.
export function rutaDelIdioma(lang) {
  return (lang === 'en' ? '/en/' : '/') + window.location.search + window.location.hash;
}

// LA RUTA DECIDE, SIN EXCEPCIONES: "/" es la landing en español y "/en/" la
// inglesa. Es lo que hace que la URL y el contenido no puedan contradecirse
// nunca — que es justamente lo que un buscador necesita para indexar cada
// idioma por separado, y lo que antes fallaba.
//
// Ni el idioma del navegador ni la preferencia guardada mandan aquí: si no
// coinciden con la página en la que se está, se OFRECE cambiar (ver
// `idiomaSugerido` y LangBanner), pero el texto que se pinta siempre es el que
// esta URL declara ser en su canonical.
function initialLang() {
  return langDeLaRuta() || 'es';
}

export function LanguageProvider({ children }) {
  // No hay setter: el idioma solo cambia navegando a la otra landing, así que
  // dentro de una misma página es un valor fijo desde el primer render.
  const [lang] = useState(initialLang);
  // Idioma que el visitante eligió alguna vez. Ya NO decide qué se pinta (eso
  // lo hace la ruta); sirve para saber si ofrecerle la otra landing y para no
  // repetirle una oferta que ya aceptó.
  const [idiomaGuardado] = useState(savedLang);
  // País real del visitante (ISO alpha-2). Vacío hasta que resuelve la geo.
  // Solo alimenta la región de pago y el aviso de idioma; NO cambia el idioma.
  const [country, setCountry] = useState('');
  // Corrección manual del usuario, si la usó (ver savedRegionOverride).
  const [regionOverride, setRegionOverrideState] = useState(savedRegionOverride);

  // Geolocalización por IP. Alimenta la REGIÓN DE PAGO (soles/Culqi frente a
  // dólares/Lemon Squeezy) y el aviso de idioma. NO toca el idioma: ver la
  // cabecera del archivo.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/geo', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.country) return;
        const cc = String(data.country).toUpperCase();
        setCountry(cc);

        // El beacon de GA4 ahora pasa por nuestro proxy (bimsaddin.com/g/...)
        // para esquivar ad-blockers; Google ya no ve la IP real del visitante,
        // sino la del datacenter de Netlify (EE.UU.) → su geolocalización
        // nativa queda inservible para este tráfico. Mandamos el país REAL
        // (esta misma detección, ya usada para idioma/moneda) como user
        // property propio, para que los reportes de GA4 no dependan de la
        // geo de Google en el tráfico proxied. Requiere registrar la
        // dimensión personalizada "real_country" (alcance Usuario) en
        // GA4 → Administrar → Definiciones personalizadas.
        try {
          if (typeof window.gtag === 'function') {
            window.gtag('set', 'user_properties', { real_country: cc });
          }
        } catch {
          /* nunca romper el flujo de idioma/región por un fallo de analítica */
        }
      })
      .catch(() => {
        /* sin geo: se mantiene la estimación del navegador y región 'PE' */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Región de pago derivada del país (no del idioma). Ver cabecera del archivo.
  // La corrección manual del usuario (regionOverride) tiene prioridad absoluta
  // sobre la geo-IP: si el usuario dijo explícitamente "no, estoy en Perú" (o
  // al revés), eso vale más que cualquier detección automática.
  const geoRegion = country && country !== 'PE' ? 'INTL' : 'PE';
  const region = regionOverride || geoRegion;

  function setRegionOverride(next) {
    setRegionOverrideState(next);
    try {
      if (next === 'PE' || next === 'INTL') localStorage.setItem(REGION_OVERRIDE_KEY, next);
      else localStorage.removeItem(REGION_OVERRIDE_KEY);
    } catch {
      /* almacenamiento no disponible: la corrección dura solo esta sesión */
    }
  }

  // Mantener <html lang>, <title> y la meta description sincronizados con el
  // idioma activo (accesibilidad y SEO básico para la SPA).
  useEffect(() => {
    document.documentElement.lang = lang;
    const meta = translations[lang].meta;
    if (meta) {
      document.title = meta.title;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', meta.description);
    }
  }, [lang]);

  // Cambia de idioma NAVEGANDO a la landing del otro idioma, porque cada uno
  // es una página distinta (/ y /en/). Si solo se cambiara el estado, la URL
  // seguiría anunciando el idioma anterior en su canonical y su hreflang.
  //
  // La preferencia se guarda ANTES de navegar: la página de destino la lee al
  // arrancar, así que quien pide español desde /en/ llega a "/" y ahí se queda,
  // sin que el aviso de idioma vuelva a ofrecerle lo que acaba de rechazar.
  function setLang(next) {
    if (next !== 'es' && next !== 'en') return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* almacenamiento no disponible: la elección dura solo esta navegación */
    }
    // La cookie es la que ve el edge; sin ella la geo volvería a decidir.
    guardarCookieIdioma(next);
    if (next === lang) return;
    window.location.assign(rutaDelIdioma(next));
  }

  function toggleLang() {
    setLang(lang === 'es' ? 'en' : 'es');
  }

  // Idioma que se le OFRECE al visitante, o null si no hay nada que ofrecer.
  // Nunca se le impone: es la alternativa a redirigir por geo, que habría hecho
  // que Google tomara la landing española por una redirección (su rastreador
  // sale casi siempre de Estados Unidos).
  //
  // Dos motivos para ofrecer, por orden:
  //   1. Ya eligió ese idioma antes y ha llegado a la otra landing — un
  //      marcador viejo, un enlace compartido, un anuncio. Su elección pesa
  //      más que su ubicación.
  //   2. No ha elegido nunca y su país habla el otro idioma.
  let sugerido = null;
  if (idiomaGuardado && idiomaGuardado !== lang) {
    sugerido = idiomaGuardado;
  } else if (!idiomaGuardado && country) {
    const porPais = SPANISH_COUNTRIES.has(country) ? 'es' : 'en';
    if (porPais !== lang) sugerido = porPais;
  }

  const value = { lang, setLang, toggleLang, t: translations[lang], country, region, setRegionOverride, idiomaSugerido: sugerido };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang debe usarse dentro de <LanguageProvider>');
  return ctx;
}
