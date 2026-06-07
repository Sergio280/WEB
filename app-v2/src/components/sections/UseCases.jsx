import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import BeforeAfterSlider from '../ui/BeforeAfterSlider.jsx';
import { USE_CASES } from '../../data/useCases.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// ── Visuales por caso de uso ──────────────────────────────────────────────
function EncofradoVisual() {
  const { t } = useLang();
  const v = t.useCases.visuals.encofrado;
  const rows = [
    { label: v.rows[0], w: '88%', from: 'from-emerald-500', to: 'to-accent-green' },
    { label: v.rows[1], w: '70%', from: 'from-brand-600', to: 'to-brand-300' },
    { label: v.rows[2], w: '95%', from: 'from-amber-600', to: 'to-accent-amber' },
  ];
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {v.caption}
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
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
          <div className="font-display text-2xl font-extrabold text-accent-green">22 min</div>
          <div className="text-xs text-slate-400">{v.withBims}</div>
        </div>
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-center">
          <div className="font-display text-2xl font-extrabold text-rose-300">6 h</div>
          <div className="text-xs text-slate-400">{v.manual}</div>
        </div>
      </div>
    </div>
  );
}

function DwgVisual() {
  const { t } = useLang();
  const v = t.useCases.visuals.dwg;
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {v.caption}
      </span>
      <BeforeAfterSlider
        labelBefore={v.labelBefore}
        labelAfter={v.labelAfter}
        before={
          <div className="flex h-full w-full flex-col items-center justify-center bg-rose-950/40 p-6 text-center">
            <span className="text-3xl">🚫🖼️</span>
            <p className="mt-3 text-sm font-bold text-rose-300">{v.beforeTitle}</p>
            <p className="mt-1 text-xs text-rose-200/70">{v.beforeDesc}</p>
          </div>
        }
        after={
          <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-950/40 p-6 text-center">
            <span className="text-3xl">📄✅</span>
            <p className="mt-3 text-sm font-bold text-emerald-300">{v.afterTitle}</p>
            <p className="mt-1 text-xs text-emerald-200/70">{v.afterDesc}</p>
          </div>
        }
      />
    </div>
  );
}

function TarrajeoVisual() {
  const { t } = useLang();
  const v = t.useCases.visuals.tarrajeo;
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {v.caption}
      </span>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <svg viewBox="0 0 260 180" className="w-full" aria-label={v.svgAria}>
          <rect x="20" y="20" width="220" height="140" fill="none" stroke="#4d93ff" strokeWidth="3" />
          <rect x="28" y="28" width="204" height="124" fill="rgba(45,125,255,.08)" stroke="#7db3ff" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="130" y="96" textAnchor="middle" className="fill-slate-400" fontSize="11">{v.svgRoom}</text>
          <text x="130" y="112" textAnchor="middle" className="fill-brand-300" fontSize="9">{v.svgInner}</text>
        </svg>
      </div>
    </div>
  );
}

function AceroVisual() {
  const { t } = useLang();
  const v = t.useCases.visuals.acero;
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {v.caption}
      </span>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <svg viewBox="0 0 160 160" className="mx-auto block w-full max-w-[220px]" aria-label={v.svgAria}>
          {/* Sección de concreto */}
          <rect x="30" y="30" width="100" height="100" fill="rgba(255,255,255,.04)" stroke="#475569" strokeWidth="2" />
          {/* Estribo */}
          <rect x="40" y="40" width="80" height="80" fill="none" stroke="#8b5cf6" strokeWidth="2" />
          {/* Barras de esquina */}
          {[[40, 40], [120, 40], [40, 120], [120, 120]].map(([cx, cy]) => (
            <circle key={`c${cx}${cy}`} cx={cx} cy={cy} r="5" fill="#2d7dff" />
          ))}
          {/* Barras intermedias */}
          {[[80, 40], [80, 120], [40, 80], [120, 80]].map(([cx, cy]) => (
            <circle key={`m${cx}${cy}`} cx={cx} cy={cy} r="4" fill="#7db3ff" />
          ))}
          <text x="80" y="150" textAnchor="middle" className="fill-slate-400" fontSize="10">{v.svgLabel}</text>
        </svg>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">{v.note}</p>
    </div>
  );
}

function NwcVisual() {
  const { t } = useLang();
  const v = t.useCases.visuals.nwc;
  const steps = [
    { icon: '📄', label: v.steps[0] },
    { icon: '🏢', label: v.steps[1] },
    { icon: '🔍', label: v.steps[2] },
  ];
  return (
    <div>
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {v.caption}
      </span>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-2">
            <div className="flex-1 text-center">
              <div className="text-3xl">{s.icon}</div>
              <div className="mt-1 text-xs text-slate-400">{s.label}</div>
            </div>
            {i < steps.length - 1 && <span className="text-xl text-brand-400">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = {
  encofrado: EncofradoVisual,
  dwg: DwgVisual,
  tarrajeo: TarrajeoVisual,
  acero: AceroVisual,
  nwc: NwcVisual,
};

export default function UseCases() {
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const uc = USE_CASES[active]; // estructura: id + visual
  const txt = t.useCases.cases[uc.id]; // texto del idioma activo
  const Visual = VISUALS[uc.visual];

  return (
    <Section id="casos">
      <Reveal className="text-center">
        <span className="eyebrow">{t.useCases.eyebrow}</span>
        <h2 className="section-title mt-4">{t.useCases.title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">{t.useCases.subtitle}</p>
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
            {t.useCases.cases[c.id].tab}
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
            <h3 className="font-display text-lg font-bold leading-snug text-white">
              {txt.title}
            </h3>
            {txt.intro && (
              <p className="mt-3 border-b border-white/10 pb-5 text-sm leading-relaxed text-slate-400">{txt.intro}</p>
            )}
            <ol className="mt-6 space-y-5">
              {txt.steps.map((s) => (
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
            {txt.compliance && (
              <div className="mt-7 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-5">
                <p className="mb-3 text-sm font-bold text-brand-200">{t.useCases.complianceTitle}</p>
                <ul className="space-y-2.5">
                  {txt.compliance.map((it) => (
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
