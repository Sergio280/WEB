import { useEffect, useState } from 'react';
import { NAV_LINKS } from '../../data/nav.js';

export default function Navbar() {
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
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#trial" className="ml-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-400">
              Prueba gratis →
            </a>
          </li>
        </ul>

        {/* Hamburguesa móvil */}
        <button
          className="ml-auto flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          <span className={`h-0.5 w-6 rounded bg-slate-200 transition-all ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-0.5 w-6 rounded bg-slate-200 transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 rounded bg-slate-200 transition-all ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/10 bg-ink-900/95 px-5 py-3 backdrop-blur-xl md:hidden">
          {NAV_LINKS.map((l) => (
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
              href="#trial"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-full bg-brand-500 px-4 py-2.5 text-center text-sm font-bold text-white"
            >
              Prueba gratis →
            </a>
          </li>
        </ul>
      )}
    </nav>
  );
}
