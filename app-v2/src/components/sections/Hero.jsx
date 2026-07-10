import { motion } from 'framer-motion';
import WindowFrame from '../ui/WindowFrame.jsx';
import AppStoreBadge from '../ui/AppStoreBadge.jsx';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};

const REVIT_VERSIONS = ['Revit 2024', 'Revit 2025', 'Revit 2026', 'Revit 2027'];

export default function Hero() {
  const { t } = useLang();
  const h = t.hero;
  return (
    <header id="inicio" className="relative overflow-hidden">
      {/* Grid de ingeniería de fondo */}
      <div className="eng-grid eng-grid-fade pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        {/* Columna texto */}
        <div>
          <motion.span variants={fadeUp} initial="hidden" animate="show" custom={0} className="eyebrow">
            {h.eyebrow}
          </motion.span>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {h.title.pre}<span className="text-gradient">{h.title.h1}</span>{h.title.mid}
            <br className="hidden sm:block" /> {h.title.post}<span className="text-gradient">{h.title.h2}</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            {h.descPre}<strong className="text-slate-200">{h.descStrong}</strong>{h.descPost}
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-7 flex flex-wrap items-center gap-2">
            {REVIT_VERSIONS.map((v) => (
              <span key={v} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {v}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#trial"
              onClick={() => track('hero_cta_click', { cta: 'trial' })}
              className="btn-primary animate-pulse-ring text-base"
            >
              {h.cta}
            </a>
          </motion.div>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={5} className="mt-4 text-sm text-slate-500">
            {h.subNote}
            <a href="#video-demo" className="text-slate-300 underline underline-offset-2 hover:text-white">
              {h.subNoteLink}
            </a>
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6} className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <span className="font-bold text-accent-green">✓</span>
            {h.guarantee}
          </motion.div>

          {/* Sello de confianza del Autodesk App Store (señal de legitimidad,
              no CTA principal). */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={7} className="mt-5">
            <AppStoreBadge />
          </motion.div>
        </div>

        {/* Columna mockup — es un enlace real a la demo. Antes el ribbon simulaba
            botones "clicables" (efecto hover por tarjeta) que no hacían nada: era
            la fuente principal de dead-clicks en la primera pantalla (Clarity ~33%).
            Ahora todo el mockup es un único destino → #video-demo, y las tarjetas
            del ribbon ya NO fingen ser botones individuales. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <a
            href="#video-demo"
            onClick={() => track('hero_mockup_click', { target: 'video-demo' })}
            aria-label={h.mockup.hint}
            className="group block cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            <div className="animate-floaty">
              <WindowFrame title={h.mockup.title}>
                {/* Ribbon de comandos BIMS (decorativo, no interactivo por tarjeta) */}
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {h.mockup.ribbon.map((c) => (
                    <div
                      key={c.label}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3 text-center transition-colors group-hover:border-brand-500/30"
                    >
                      <span className="text-xl">{c.icon}</span>
                      <span className="text-[0.66rem] font-medium leading-tight text-slate-400">{c.label}</span>
                    </div>
                  ))}
                </div>

                {/* Consola simulada */}
                <div className="mt-3 rounded-lg border border-white/10 bg-ink-950/80 p-3 font-mono text-[0.72rem] leading-relaxed">
                  <p className="text-slate-500">{h.mockup.console[0]}</p>
                  <p className="text-brand-300">{h.mockup.console[1]}</p>
                  <p className="text-accent-green">{h.mockup.console[2]}</p>
                  <p className="text-slate-500">{h.mockup.console[3]}</p>
                  <p className="text-accent-green">{h.mockup.console[4]}</p>
                </div>
              </WindowFrame>
            </div>

            {/* Pista de "reproducir demo" que aparece al pasar el cursor sobre el mockup */}
            <span className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-glow">
                {h.mockup.hint}
              </span>
            </span>
          </a>

          {/* Badge flotante */}
          <div className="pointer-events-none absolute -bottom-4 -left-4 hidden rounded-xl border border-white/10 bg-ink-800/90 px-4 py-3 shadow-glow backdrop-blur-xl sm:block">
            <p className="font-display text-2xl font-extrabold text-accent-green">{h.mockup.badgeValue}</p>
            <p className="text-[0.7rem] text-slate-400">{h.mockup.badgeLabel}</p>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
