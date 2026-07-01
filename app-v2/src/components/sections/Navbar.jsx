import { useEffect, useState } from 'react';
import { useLang } from '../../i18n/LanguageProvider.jsx';
import { track } from '../../lib/track.js';

// Botón para cambiar de idioma (ES ⇄ EN). Muestra el idioma al que se cambia.
function LangToggle({ className = '' }) {
  const { t, lang, toggleLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => {
        track('lang_switch', { to: lang === 'es' ? 'en' : 'es' });
        toggleLang();
      }}
      aria-label={t.langSwitch.aria}
      title={t.langSwitch.toGo}
      className={`flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 transition-colors hover:border-brand-500/40 hover:text-white ${className}`}
    >
      <span aria-hidden="true">🌐</span>
      {t.langSwitch.label}
    </button>
  );
}

export default function Navbar() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'border-b border-white/10 bg-ink-950/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
        <a href="#inicio" className="flex items-center gap-2.5 font-display text-lg font-extrabold text-white">
          <img src="/icono/favicon-32.png" alt="BIMS" className="h-7 w-7 rounded-md" />
          BIMS
        </a>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {t.nav.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="ml-1">
            <a
              href="#descargar"
              onClick={() => track('nav_download_click')}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition-colors hover:border-brand-500/40 hover:text-white"
            >
              <span aria-hidden="true">⬇</span>
              {t.nav.download}
            </a>
          </li>
          <li>
            <LangToggle />
          </li>
          <li>
            <a href="#trial" className="ml-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-400">
              {t.nav.cta}
            </a>
          </li>
        </ul>

        {/* Toggle de idioma + hamburguesa (móvil) */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <LangToggle />
          <button
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
            onClick={() => setOpen((v) => !v)}
            aria-label={t.nav.menu}
          >
            <span className={`h-0.5 w-6 rounded bg-slate-200 transition-all ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-0.5 w-6 rounded bg-slate-200 transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-6 rounded bg-slate-200 transition-all ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/10 bg-ink-900/95 px-5 py-3 backdrop-blur-xl md:hidden">
          {t.nav.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#descargar"
              onClick={() => { track('nav_download_click'); setOpen(false); }}
              className="mt-1 block rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm font-bold text-slate-200"
            >
              ⬇ {t.nav.download}
            </a>
          </li>
          <li>
            <a
              href="#trial"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-full bg-brand-500 px-4 py-2.5 text-center text-sm font-bold text-white"
            >
              {t.nav.cta}
            </a>
          </li>
        </ul>
      )}
    </nav>
  );
}
