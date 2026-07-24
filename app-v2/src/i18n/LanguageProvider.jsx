import { createContext, useContext, useEffect, useState } from 'react';
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

// Estimación instantánea (sin red) a partir del idioma del navegador.
function browserLang() {
  const nav = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

function initialLang() {
  return savedLang() || browserLang();
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  // Si el usuario ya eligió manualmente, la geo no debe sobreescribir el IDIOMA.
  const [explicit, setExplicit] = useState(() => savedLang() != null);
  // País real del visitante (ISO alpha-2). Vacío hasta que resuelve la geo.
  // Solo alimenta la región de pago; NO lo condiciona la elección de idioma.
  const [country, setCountry] = useState('');
  // Corrección manual del usuario, si la usó (ver savedRegionOverride).
  const [regionOverride, setRegionOverrideState] = useState(savedRegionOverride);

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
        if (!explicit) setLangState(SPANISH_COUNTRIES.has(cc) ? 'es' : 'en');

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
  }, [explicit]);

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

  function setLang(next) {
    setExplicit(true);
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* almacenamiento no disponible: la elección dura solo esta sesión */
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
