import { createContext, useContext, useEffect, useState } from 'react';
import { translations, SPANISH_COUNTRIES } from './translations.js';

// ─────────────────────────────────────────────────────────────────────────────
// LanguageProvider — estado global de idioma (es | en).
//
// Prioridad de detección:
//   1. Preferencia explícita del usuario guardada en localStorage (el toggle).
//   2. Geolocalización por IP vía la edge function /api/geo (Netlify), que
//      determina el país real del visitante → español si es país hispano, en
//      caso contrario inglés.
//   3. Mientras la geo carga (o si falla), se usa el idioma del navegador como
//      estimación instantánea para evitar un parpadeo visible.
//
// El idioma elegido se refleja en <html lang="…"> para accesibilidad y SEO.
// ─────────────────────────────────────────────────────────────────────────────
const LangContext = createContext(null);
const STORAGE_KEY = 'bims_lang';

function savedLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
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
  return savedLang() || browserLang();
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  // Si el usuario ya eligió manualmente, la geo no debe sobreescribir.
  const [explicit, setExplicit] = useState(() => savedLang() != null);

  // Refinar con geolocalización por IP solo si no hay elección explícita.
  useEffect(() => {
    if (explicit) return;
    let cancelled = false;
    fetch('/api/geo', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.country) return;
        setLangState(SPANISH_COUNTRIES.has(String(data.country).toUpperCase()) ? 'es' : 'en');
      })
      .catch(() => {
        /* sin geo: se mantiene la estimación del navegador */
      });
    return () => {
      cancelled = true;
    };
  }, [explicit]);

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

  const value = { lang, setLang, toggleLang, t: translations[lang] };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang debe usarse dentro de <LanguageProvider>');
  return ctx;
}
