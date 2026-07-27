import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { translations, SPANISH_COUNTRIES } from './translations.js';

// ─────────────────────────────────────────────────────────────────────────────
// LanguageProvider — estado global de idioma (es | en) Y región de pago.
//
// Prioridad de detección del IDIOMA:
//   1. Preferencia explícita del usuario guardada en localStorage (el toggle).
//   2. Geolocalización por IP vía la edge function /api/geo (Netlify), que
//      determina el país real del visitante → español si es país hispano, en
//      caso contrario inglés.
//   3. Mientras la geo carga (o si falla), se usa el idioma del navegador como
//      estimación instantánea para evitar un parpadeo visible.
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

// Idioma pedido explícitamente por la URL (?lang=es|en). Es la señal de MÁXIMA
// prioridad: da a cada idioma una URL propia, rastreable e indexable por Google
// y compartible por el usuario. Sin esto la versión en inglés no existía como
// URL y era invisible para los buscadores.
function urlLang() {
  try {
    const v = new URLSearchParams(window.location.search).get('lang');
    return v === 'es' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

// Estimación instantánea (sin red) a partir del idioma del navegador.
function browserLang() {
  const nav = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

function initialLang() {
  return urlLang() || savedLang() || browserLang();
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  // Si el usuario ya eligió manualmente (o llegó con ?lang=), la geo no debe
  // sobreescribir el IDIOMA.
  const [explicit, setExplicit] = useState(() => urlLang() != null || savedLang() != null);
  // País real del visitante (ISO alpha-2). Vacío hasta que resuelve la geo.
  // Solo alimenta la región de pago; NO lo condiciona la elección de idioma.
  const [country, setCountry] = useState('');
  // Corrección manual del usuario, si la usó (ver savedRegionOverride).
  const [regionOverride, setRegionOverrideState] = useState(savedRegionOverride);

  // `explicit` se lee dentro del efecto vía ref para que cambiar de idioma NO
  // vuelva a disparar la petición de geo: el efecto sólo debe correr una vez por
  // carga. Antes `explicit` estaba en las dependencias, así que el primer toggle
  // provocaba un segundo fetch cuyo resultado ya no se usaba para el idioma.
  const explicitRef = useRef(explicit);
  explicitRef.current = explicit;

  // Refinar con geolocalización por IP. El país SIEMPRE se captura (para la
  // región de pago); el idioma solo se ajusta si no hay elección explícita.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/geo', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.country) return;
        const cc = String(data.country).toUpperCase();
        setCountry(cc);
        if (!explicitRef.current) setLangState(SPANISH_COUNTRIES.has(cc) ? 'es' : 'en');

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

  // Mantener <html lang>, <title>, la meta description, el canonical y los Open
  // Graph sincronizados con el idioma activo.
  //
  // SEO bilingüe: la landing es una sola SPA, así que sin esto la versión en
  // inglés no tenía NINGUNA URL indexable — canonical fijo a "/" y og:locale
  // es_PE siempre. Con ?lang=en existe una URL propia que Google puede rastrear
  // e indexar, declarada en el sitemap y enlazada desde los hreflang del HTML.
  useEffect(() => {
    document.documentElement.lang = lang;
    const meta = translations[lang].meta;
    if (!meta) return;

    document.title = meta.title;

    const setMeta = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', value);
    };
    setMeta('meta[name="description"]', meta.description);
    setMeta('meta[property="og:title"]', meta.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[property="og:locale"]', lang === 'en' ? 'en_US' : 'es_PE');
    setMeta('meta[name="twitter:title"]', meta.title);
    setMeta('meta[name="twitter:description"]', meta.description);

    const canonical = document.querySelector('link[rel="canonical"]');
    const url = lang === 'en' ? 'https://bimsaddin.com/?lang=en' : 'https://bimsaddin.com/';
    if (canonical) canonical.setAttribute('href', url);
    setMeta('meta[property="og:url"]', url);
  }, [lang]);

  function setLang(next) {
    setExplicit(true);
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* almacenamiento no disponible: la elección dura solo esta sesión */
    }
    // Reflejar el idioma en la URL para que sea compartible y coincida con el
    // canonical. replaceState: no ensucia el historial ni recarga la SPA.
    try {
      const url = new URL(window.location.href);
      if (next === 'en') url.searchParams.set('lang', 'en');
      else url.searchParams.delete('lang');
      window.history.replaceState({}, '', url);
    } catch {
      /* sin History API: el idioma sigue funcionando, sólo no se refleja */
    }
  }

  function toggleLang() {
    setLang(lang === 'es' ? 'en' : 'es');
  }

  const value = { lang, setLang, toggleLang, t: translations[lang], country, region, setRegionOverride };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang debe usarse dentro de <LanguageProvider>');
  return ctx;
}
