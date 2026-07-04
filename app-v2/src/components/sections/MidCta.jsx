import Reveal from '../ui/Reveal.jsx';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Banda de conversión a media página. Clarity mostró que el scroll muere ~44%,
// muy por encima de las secciones Trial/Precios: muchos visitantes nunca llegan
// a un CTA. Esta banda repite el llamado a la acción justo donde se detiene el
// scroll para captar a quien no baja más.
export default function MidCta() {
  const { t } = useLang();
  const c = t.midCta;

  return (
    <section className="px-5 py-16">
      <Reveal className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-brand-500/25 bg-gradient-to-br from-brand-500/[0.12] via-ink-800/40 to-ink-900/40 px-6 py-12 text-center shadow-glow sm:px-12">
        <h2 className="mx-auto max-w-2xl font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          {c.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">{c.desc}</p>
        <div className="mt-7 flex justify-center">
          <a
            href="#trial"
            onClick={() => track('mid_cta_click', { cta: 'trial' })}
            className="btn-primary text-base"
          >
            {c.cta}
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          <span className="font-bold text-accent-green">✓</span> {c.note}
        </p>
      </Reveal>
    </section>
  );
}
