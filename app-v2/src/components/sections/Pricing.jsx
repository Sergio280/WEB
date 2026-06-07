import { useEffect, useRef, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import CulqiModal from './CulqiModal.jsx';
import { CATALOG } from '../../data/culqi.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

const accentMap = {
  brand: { ring: 'border-brand-500/30', btn: 'bg-brand-500 hover:bg-brand-400', text: 'text-brand-300' },
  violet: { ring: 'border-violet-400/40 shadow-glow', btn: 'bg-violet-500 hover:bg-violet-400', text: 'text-violet-300' },
  emerald: { ring: 'border-emerald-400/30', btn: 'bg-accent-emerald hover:bg-emerald-500', text: 'text-accent-green' },
};

export default function Pricing() {
  const { t } = useLang();
  const p = t.pricing;
  const [modalPlan, setModalPlan] = useState(null);
  const sectionRef = useRef(null);

  // view_pricing: se dispara una vez cuando la sección entra en viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fired) {
          fired = true;
          track('view_pricing');
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function openPlan(key) {
    track('select_plan', { plan: key });
    setModalPlan(key);
  }

  return (
    <Section id="precios">
      <div ref={sectionRef} />
      <Reveal className="text-center">
        <span className="eyebrow">{p.eyebrow}</span>
        <h2 className="section-title mt-4">{p.title}</h2>
        <p className="mt-3 text-slate-400">{p.subtitle}</p>
      </Reveal>

      {/* Garantía */}
      <Reveal delay={0.05} className="mx-auto mt-8 flex max-w-2xl items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-5">
        <span className="text-3xl">🛡️</span>
        <p className="text-sm leading-relaxed text-slate-300">
          <strong className="text-white">{p.guaranteeStrong}</strong>{p.guaranteeRest}
        </p>
      </Reveal>

      {/* Tarjetas */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {CATALOG.map((c, i) => {
          const a = accentMap[c.accent];
          const txt = p.catalog[c.key];
          return (
            <Reveal key={c.key} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border ${a.ring} glass p-7 transition-transform hover:-translate-y-1 ${
                  c.featured ? 'lg:scale-[1.03]' : ''
                }`}
              >
                {txt.ribbon && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1 text-xs font-extrabold uppercase tracking-wide text-ink-950">
                    {txt.ribbon}
                  </span>
                )}
                <span className={`text-xs font-bold uppercase tracking-wider ${a.text}`}>{txt.badge}</span>
                <h3 className="mt-2 font-display text-xl font-extrabold text-white">{txt.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{txt.desc}</p>

                <div className="mt-5">
                  {c.priceFrom != null ? (
                    <p className="font-display text-3xl font-extrabold text-white">
                      {p.priceFrom}{c.priceFrom}
                      <span className="text-sm font-semibold text-slate-500">{p.perMonth}</span>
                    </p>
                  ) : (
                    <p className="font-display text-2xl font-extrabold text-white">{p.custom}</p>
                  )}
                </div>

                {c.whatsapp ? (
                  <>
                    <a
                      href={c.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('whatsapp_click', { context: 'pricing_empresa' })}
                      className={`mt-5 rounded-xl ${a.btn} px-5 py-3 text-center font-bold text-white transition-colors`}
                    >
                      {p.contactSales}
                    </a>
                    <p className="mt-2 text-center text-xs text-slate-500">{p.contactNote}</p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openPlan(c.key)}
                      className={`mt-5 rounded-xl ${a.btn} px-5 py-3 font-bold text-white transition-colors`}
                    >
                      {p.buy}{txt.badge}
                    </button>
                    <p className="mt-2 text-center text-xs text-slate-500">{p.buyNote}</p>
                    <a href="#trial" className="mt-1 text-center text-xs font-semibold text-brand-300 hover:text-white">
                      {p.orTrial}
                    </a>
                  </>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-slate-500">
        {p.footnotePre}<strong className="text-slate-300">{p.footnoteDurations}</strong>{p.footnoteMid}<strong className="text-slate-300">{p.footnoteDiscount}</strong>{p.footnotePost}
      </p>

      {/* Tabla comparativa */}
      <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-900 text-white">
              <th className="px-4 py-3 text-left font-bold">{p.tableHead}</th>
              {p.compare.cols.map((col, i) => (
                <th key={col} className={`px-4 py-3 text-center font-bold ${i === 1 ? 'bg-violet-500/15 text-violet-200' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.compare.rows.map((row) => (
              <tr key={row.label} className="border-t border-white/5">
                <td className="px-4 py-3 text-slate-300">{row.label}</td>
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3 text-center ${i === 1 ? 'bg-violet-500/[0.06]' : ''} ${
                      cell === '✓' ? 'font-bold text-accent-green' : cell === '—' ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      {modalPlan && <CulqiModal planKey={modalPlan} onClose={() => setModalPlan(null)} />}
    </Section>
  );
}
