import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import BeforeAfterSlider from '../ui/BeforeAfterSlider.jsx';
import { USE_CASES, BBS_DEMO_ROWS } from '../../data/useCases.js';

// ── Visuales por caso de uso ──────────────────────────────────────────────
function BbsVisual() {
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Vista previa — Planilla BBS generada automáticamente por BIMS
      </span>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gradient-to-r from-brand-700 to-brand-500 text-left text-white">
              {['Marca', 'Ø', 'Cant.', 'Long.', 'Forma'].map((h) => (
                <th key={h} className="px-3 py-2 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BBS_DEMO_ROWS.map((r, i) => (
              <motion.tr
                key={r[0]}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border-b border-white/5 last:border-0 odd:bg-white/[0.02]"
              >
                <td className="px-3 py-2 font-extrabold text-violet-300">{r[0]}</td>
                <td className="px-3 py-2 text-slate-300">{r[1]}</td>
                <td className="px-3 py-2 text-slate-300">{r[2]}</td>
                <td className="px-3 py-2 text-slate-300">{r[3]}</td>
                <td className="px-3 py-2 font-mono text-slate-400">{r[4]}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EncofradoVisual() {
  const rows = [
    { label: 'Columna → 4 paneles', w: '88%', from: 'from-emerald-500', to: 'to-accent-green' },
    { label: 'Viga → 3 caras', w: '70%', from: 'from-brand-600', to: 'to-brand-300' },
    { label: 'Losa → suelo inferior', w: '95%', from: 'from-amber-600', to: 'to-accent-amber' },
  ];
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Resultado — Paneles de encofrado generados
      </span>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 text-xs text-slate-400">{r.label}</div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: r.w }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${r.from} ${r.to}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DwgVisual() {
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Antes vs. después — Exportación DWG (arrastra)
      </span>
      <BeforeAfterSlider
        labelBefore="❌ Nativa de Revit"
        labelAfter="✓ Exportación BIMS"
        before={
          <div className="flex h-full w-full flex-col items-center justify-center bg-rose-950/40 p-6 text-center">
            <span className="text-3xl">🚫🖼️</span>
            <p className="mt-3 text-sm font-bold text-rose-300">Imágenes perdidas</p>
            <p className="mt-1 text-xs text-rose-200/70">o quedan como enlaces rotos</p>
          </div>
        }
        after={
          <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-950/40 p-6 text-center">
            <span className="text-3xl">📄✅</span>
            <p className="mt-3 text-sm font-bold text-emerald-300">Imágenes embebidas (OLE)</p>
            <p className="mt-1 text-xs text-emerald-200/70">dentro del archivo DWG</p>
          </div>
        }
      />
    </div>
  );
}

function TarrajeoVisual() {
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Esquema — Tarrajeo generado en planta
      </span>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <svg viewBox="0 0 260 180" className="w-full" aria-label="Planta de habitación con tarrajeo">
          <rect x="20" y="20" width="220" height="140" fill="none" stroke="#4d93ff" strokeWidth="3" />
          <rect x="28" y="28" width="204" height="124" fill="rgba(45,125,255,.08)" stroke="#7db3ff" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="130" y="96" textAnchor="middle" className="fill-slate-400" fontSize="11">Habitación</text>
          <text x="130" y="112" textAnchor="middle" className="fill-brand-300" fontSize="9">tarrajeo hacia el interior</text>
        </svg>
      </div>
    </div>
  );
}

const VISUALS = { bbs: BbsVisual, encofrado: EncofradoVisual, dwg: DwgVisual, tarrajeo: TarrajeoVisual };

export default function UseCases() {
  const [active, setActive] = useState(0);
  const uc = USE_CASES[active];
  const Visual = VISUALS[uc.visual];

  return (
    <Section id="casos">
      <Reveal className="text-center">
        <span className="eyebrow">Casos de uso práctico</span>
        <h2 className="section-title mt-4">Flujos completos de principio a fin</h2>
        <p className="mt-3 text-slate-400">Cómo BIMS resuelve tareas reales de documentación</p>
      </Reveal>

      {/* Tabs */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {USE_CASES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActive(i)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
              i === active
                ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-brand-500/40 hover:text-slate-200'
            }`}
          >
            {c.tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={uc.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="mt-10 grid items-start gap-10 lg:grid-cols-2"
        >
          {/* Stepper */}
          <div>
            <h3 className="border-b border-white/10 pb-4 font-display text-lg font-bold leading-snug text-white">
              {uc.title}
            </h3>
            <ol className="mt-6 space-y-5">
              {uc.steps.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-extrabold text-white">
                    {s.n}
                  </span>
                  <div>
                    <strong className="block text-sm font-bold text-white">{s.t}</strong>
                    <p className="mt-0.5 text-sm text-slate-400">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Aporte normativo */}
            {uc.compliance && (
              <div className="mt-7 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-5">
                <p className="mb-3 text-sm font-bold text-brand-200">{uc.compliance.title}</p>
                <ul className="space-y-2.5">
                  {uc.compliance.items.map((it) => (
                    <li key={it.k} className="text-sm leading-relaxed text-slate-300">
                      <strong className="text-white">{it.k}</strong> {it.v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Visual */}
          <div className="rounded-2xl border border-white/10 glass p-5 lg:sticky lg:top-24">
            <Visual />
          </div>
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}
