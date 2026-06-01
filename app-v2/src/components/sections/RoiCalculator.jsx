import { useMemo, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';

// Fórmula EXACTA de la home actual:
//   PRECIO_MES = 60, AHORRO = 0.80
//   horasAhorradas = round(proyectos * horas * 0.80)
//   dinero = horasAhorradas * tarifa
//   diasPayback = max(0.1, 60 / (tarifa * 8)).toFixed(1)
const PRECIO_MES = 60;
const AHORRO = 0.8;

function Slider({ label, value, min, max, step, onChange, suffix, prefix }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-semibold text-slate-300">
        {label}: <span className="font-extrabold text-brand-300">{prefix}{value}{suffix}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ '--pct': `${pct}%` }}
      />
    </div>
  );
}

export default function RoiCalculator() {
  const [proj, setProj] = useState(3);
  const [hrs, setHrs] = useState(20);
  const [rate, setRate] = useState(35);

  const { horasAhorradas, dinero, diasPayback } = useMemo(() => {
    const h = Math.round(proj * hrs * AHORRO);
    return {
      horasAhorradas: h,
      dinero: (h * rate).toLocaleString('es-PE'),
      diasPayback: Math.max(0.1, PRECIO_MES / (rate * 8)).toFixed(1),
    };
  }, [proj, hrs, rate]);

  return (
    <Section>
      <Reveal className="mx-auto max-w-5xl rounded-3xl border border-white/10 glass p-8 sm:p-10">
        <div className="text-center">
          <h2 className="section-title">Calcula cuánto te ahorrarías con BIMS</h2>
          <p className="mt-2 text-slate-400">Mueve los controles según tu carga real de trabajo</p>
        </div>

        <div className="mt-9 grid items-center gap-8 lg:grid-cols-2">
          {/* Controles */}
          <div>
            <Slider label="Proyectos al mes" value={proj} min={1} max={10} step={1} onChange={setProj} />
            <Slider label="Horas de documentación por proyecto" value={hrs} min={5} max={80} step={5} onChange={setHrs} suffix=" h" />
            <Slider label="Valor de tu hora profesional" value={rate} min={15} max={120} step={5} onChange={setRate} prefix="S/ " />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              <strong className="text-slate-400">Estimación orientativa.</strong> Asume una reducción del 80 % del tiempo
              en tareas automatizables por BIMS (encofrado, refuerzo, exportación a DWG, asignación de rejillas). El ahorro
              real depende del flujo de trabajo de cada estudio.
            </p>
          </div>

          {/* Resultados */}
          <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-ink-800 to-ink-900 p-8 text-center shadow-glow">
            <p className="text-sm text-slate-400">Te ahorras al mes</p>
            <p className="mt-2 font-display text-5xl font-extrabold text-accent-green">{horasAhorradas} h</p>
            <p className="mt-1 text-sm text-slate-400">
              = S/ <span className="font-bold text-white">{dinero}</span> en honorarios recuperados
            </p>
            <div className="mt-5 rounded-xl border border-accent-green/30 bg-accent-green/10 p-4 text-sm text-slate-300">
              La licencia se paga sola en <strong className="text-accent-green">≈ {diasPayback} días</strong> de trabajo.
            </div>
            <a href="#trial" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent-emerald px-5 py-3 font-bold text-white transition-transform hover:-translate-y-0.5">
              Probar gratis 14 días →
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
