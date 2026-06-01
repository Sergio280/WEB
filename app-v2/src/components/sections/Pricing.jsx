import { useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import CulqiModal from './CulqiModal.jsx';
import { CATALOG, PLAN_COMPARE } from '../../data/culqi.js';

const accentMap = {
  brand: { ring: 'border-brand-500/30', btn: 'bg-brand-500 hover:bg-brand-400', text: 'text-brand-300' },
  violet: { ring: 'border-violet-400/40 shadow-glow', btn: 'bg-violet-500 hover:bg-violet-400', text: 'text-violet-300' },
  emerald: { ring: 'border-emerald-400/30', btn: 'bg-accent-emerald hover:bg-emerald-500', text: 'text-accent-green' },
};

export default function Pricing() {
  const [modalPlan, setModalPlan] = useState(null);

  return (
    <Section id="precios">
      <Reveal className="text-center">
        <span className="eyebrow">Planes y precios</span>
        <h2 className="section-title mt-4">Activa BIMS al instante</h2>
        <p className="mt-3 text-slate-400">
          Paga seguro con tarjeta a través de Culqi y recibe tu clave por email en minutos.
        </p>
      </Reveal>

      {/* Garantía */}
      <Reveal delay={0.05} className="mx-auto mt-8 flex max-w-2xl items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-5">
        <span className="text-3xl">🛡️</span>
        <p className="text-sm leading-relaxed text-slate-300">
          <strong className="text-white">Garantía de 7 días.</strong> Si BIMS no te convence, escríbenos dentro de los 7
          días siguientes a tu compra y te devolvemos el 100% de tu dinero. Sin preguntas.
        </p>
      </Reveal>

      {/* Tarjetas */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {CATALOG.map((c, i) => {
          const a = accentMap[c.accent];
          return (
            <Reveal key={c.key} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border ${a.ring} glass p-7 transition-transform hover:-translate-y-1 ${
                  c.featured ? 'lg:scale-[1.03]' : ''
                }`}
              >
                {c.ribbon && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1 text-xs font-extrabold uppercase tracking-wide text-ink-950">
                    {c.ribbon}
                  </span>
                )}
                <span className={`text-xs font-bold uppercase tracking-wider ${a.text}`}>{c.badge}</span>
                <h3 className="mt-2 font-display text-xl font-extrabold text-white">{c.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{c.desc}</p>

                <div className="mt-5">
                  {c.priceFrom != null ? (
                    <p className="font-display text-3xl font-extrabold text-white">
                      desde S/{c.priceFrom}
                      <span className="text-sm font-semibold text-slate-500"> /mes</span>
                    </p>
                  ) : (
                    <p className="font-display text-2xl font-extrabold text-white">A medida</p>
                  )}
                </div>

                {c.whatsapp ? (
                  <a
                    href={c.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-5 rounded-xl ${a.btn} px-5 py-3 text-center font-bold text-white transition-colors`}
                  >
                    Contactar ventas
                  </a>
                ) : (
                  <button
                    onClick={() => setModalPlan(c.key)}
                    className={`mt-5 rounded-xl ${a.btn} px-5 py-3 font-bold text-white transition-colors`}
                  >
                    Elegir {c.badge}
                  </button>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-slate-500">
        Al comprar eliges la duración: <strong className="text-slate-300">1, 3, 6 o 12 meses</strong>. Mientras más larga
        la licencia, mayor el descuento — hasta <strong className="text-slate-300">−17%</strong> frente al precio mensual.
      </p>

      {/* Tabla comparativa */}
      <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-900 text-white">
              <th className="px-4 py-3 text-left font-bold">Qué incluye</th>
              {PLAN_COMPARE.cols.map((col, i) => (
                <th key={col} className={`px-4 py-3 text-center font-bold ${i === 1 ? 'bg-violet-500/15 text-violet-200' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARE.rows.map((row) => (
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
