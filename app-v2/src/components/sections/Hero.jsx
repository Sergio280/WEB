import { motion } from 'framer-motion';
import WindowFrame from '../ui/WindowFrame.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};

// Comandos simulados en el mockup del ribbon BIMS.
const RIBBON = [
  { icon: '🏗️', label: 'Encofrado' },
  { icon: '🔩', label: 'Acero' },
  { icon: '🎨', label: 'Tarrajeo' },
  { icon: '📐', label: 'DWG → NWC' },
  { icon: '📤', label: 'Exportar DWG' },
  { icon: '🧰', label: 'Utilidades' },
];

export default function Hero() {
  return (
    <header id="inicio" className="relative overflow-hidden">
      {/* Grid de ingeniería de fondo */}
      <div className="eng-grid eng-grid-fade pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        {/* Columna texto */}
        <div>
          <motion.span variants={fadeUp} initial="hidden" animate="show" custom={0} className="eyebrow">
            Add-in para Autodesk Revit
          </motion.span>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Lo que en Revit te toma <span className="text-gradient">4 horas</span>,
            <br className="hidden sm:block" /> BIMS lo hace en <span className="text-gradient">4 minutos</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Add-in con <strong className="text-slate-200">30+ herramientas</strong> para estructura, refuerzo, encofrado
            y exportación de planos a DWG con imágenes embebidas — único en su categoría.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-7 flex flex-wrap items-center gap-2">
            {['Revit 2024', 'Revit 2025', 'Revit 2026'].map((v) => (
              <span key={v} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {v}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#trial" className="btn-primary animate-pulse-ring text-base">
              Empezar prueba gratis de 14 días →
            </a>
          </motion.div>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={5} className="mt-4 text-sm text-slate-500">
            Sin tarjeta de crédito · Activación instantánea ·{' '}
            <a href="#video-demo" className="text-slate-300 underline underline-offset-2 hover:text-white">
              Ver demo de 45 s
            </a>
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6} className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <span className="font-bold text-accent-green">✓</span>
            Garantía de devolución del 100% en 7 días si no te convence
          </motion.div>
        </div>

        {/* Columna mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="animate-floaty">
            <WindowFrame title="Proyecto-Estructural.rvt — Autodesk Revit 2026">
              {/* Ribbon de comandos BIMS */}
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {RIBBON.map((c) => (
                  <div
                    key={c.label}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3 text-center transition-colors hover:border-brand-500/40 hover:bg-brand-500/10"
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[0.66rem] font-medium leading-tight text-slate-400">{c.label}</span>
                  </div>
                ))}
              </div>

              {/* Consola simulada */}
              <div className="mt-3 rounded-lg border border-white/10 bg-ink-950/80 p-3 font-mono text-[0.72rem] leading-relaxed">
                <p className="text-slate-500">&gt; Ejecutando Encofrado…</p>
                <p className="text-brand-300">→ 142 elementos analizados</p>
                <p className="text-accent-green">✓ Paneles generados en 22 s</p>
                <p className="text-slate-500">&gt; Exportar Planos a DWG…</p>
                <p className="text-accent-green">✓ 10 láminas · imágenes embebidas (OLE)</p>
              </div>
            </WindowFrame>
          </div>

          {/* Badge flotante */}
          <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-white/10 bg-ink-800/90 px-4 py-3 shadow-glow backdrop-blur-xl sm:block">
            <p className="font-display text-2xl font-extrabold text-accent-green">−80%</p>
            <p className="text-[0.7rem] text-slate-400">tiempo en tareas repetitivas</p>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
