import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { WHATSAPP_URL, APPSTORE_URL } from '../../data/nav.js';
import { REVIEWS, RESUMEN } from '../../data/reviews.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Reseñas REALES del Autodesk App Store. Ver data/reviews.js: se copian a mano
// desde la ficha oficial y cada tarjeta enlaza a ella, porque lo que sostiene
// esta sección es que el visitante pueda ir a comprobarlas.
//
// El texto de cada reseña va tal como lo escribió su autor, sin traducir, en
// las dos versiones del sitio.

function Estrellas({ n, etiqueta }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent-amber" role="img" aria-label={etiqueta}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true" className={i <= n ? '' : 'text-slate-600'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function Testimonials() {
  const { t, lang } = useLang();
  const tt = t.testimonials;
  const fichaUrl = APPSTORE_URL[lang] || APPSTORE_URL.es;

  const fecha = (iso) =>
    new Date(iso + 'T12:00:00Z').toLocaleDateString(t.roi.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Section>
      <Reveal className="text-center">
        <span className="eyebrow">{tt.eyebrow}</span>
        <h2 className="section-title mt-4">{tt.title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">{tt.desc}</p>
      </Reveal>

      {/* Resumen de valoración */}
      <Reveal delay={0.05} className="mx-auto mt-9 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-6 text-center">
        <p className="font-display text-5xl font-extrabold leading-none text-white">
          {RESUMEN.media.toFixed(1)}
        </p>
        <Estrellas n={5} etiqueta={tt.starsAria.replace('{n}', RESUMEN.media.toFixed(1))} />
        <p className="text-sm text-slate-400">
          {tt.summary.replace('{n}', RESUMEN.total)}
        </p>
        <a
          href={fichaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('appstore_reviews_click', { lang })}
          className="text-sm font-semibold text-brand-300 underline-offset-2 hover:text-white hover:underline"
        >
          {tt.verify} →
        </a>
      </Reveal>

      {/* Reseñas */}
      {/* `items-start`: cada tarjeta con su alto natural. Una reseña de dos
          palabras estirada al alto de otra más larga deja un hueco que parece
          contenido que falta — y aquí no falta nada, el autor escribió eso. */}
      <div className="mx-auto mt-8 grid max-w-4xl items-start gap-5 sm:grid-cols-2">
        {REVIEWS.map((r, i) => (
          <Reveal key={r.id} delay={0.1 + i * 0.08}>
            <figure className="flex flex-col rounded-2xl border border-white/10 glass p-6">
              <Estrellas n={r.estrellas} etiqueta={tt.starsAria.replace('{n}', r.estrellas)} />
              <blockquote className="mt-3">
                <p className="font-display font-bold text-white">{r.titulo}</p>
                {/* El texto puede repetir el título cuando el autor escribió lo
                    mismo en los dos campos; no se inventa relleno para evitarlo. */}
                {r.texto !== r.titulo && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">“{r.texto}”</p>
                )}
              </blockquote>
              <figcaption className="mt-4 border-t border-white/10 pt-3 text-sm">
                <span className="font-semibold text-slate-200">{r.autor}</span>
                <span className="block text-xs text-slate-500">
                  <time dateTime={r.fecha}>{fecha(r.fecha)}</time> · {tt.source}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      {/* Invitación a dejar la suya */}
      <Reveal delay={0.2} className="mt-9 text-center">
        <p className="text-sm text-slate-400">{tt.inviteDesc}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a
            href={fichaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('appstore_review_cta', { lang })}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-200 transition-colors hover:border-brand-500/40 hover:text-white"
          >
            {tt.inviteAppStore}
          </a>
          <a
            href={`${WHATSAPP_URL}?text=${tt.whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { context: 'reviews' })}
            className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            {tt.cta}
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          {tt.footerPre}
          <a href="#trial" className="font-semibold text-brand-300 hover:text-white">{tt.footerLink1}</a>
          {tt.footerMid}
          <a href="#casos" className="font-semibold text-brand-300 hover:text-white">{tt.footerLink2}</a>
          {tt.footerPost}
        </p>
      </Reveal>
    </Section>
  );
}
