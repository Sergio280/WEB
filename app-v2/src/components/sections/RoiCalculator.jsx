import { useMemo, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { useLang } from '../../i18n/LanguageProvider.jsx';
import { precioDesde, PRECIOS_USD } from '../../data/pricing.js';

// Fórmula EXACTA de la home actual:
//   horasAhorradas = round(proyectos * horas * 0.80)
//   dinero = horasAhorradas * tarifa
//   diasPayback = max(0.1, precioMensual / (tarifa * 8)).toFixed(1)
//
// El precio mensual SALE DE pricing.js, no escrito a mano: antes había aquí un
// `const PRECIO_MES = 60` que era una copia más del precio. Si se cambiaba la
// tarifa, esta calculadora seguía prometiendo un retorno calculado sobre el
// precio viejo — es decir, mentía al visitante justo en el argumento de venta.
//
// La MONEDA depende de la región de pago, no del idioma (igual que en Pricing):
// un ingeniero de México lee la web en español pero paga en dólares. Antes el
// símbolo venía escrito dentro de las traducciones, y el bloque en inglés lo
// tenía como 'S/ ': quien entraba desde fuera de Perú leía «Your professional
// hourly rate: S/ 35» y «= S/ 4,200» en una página donde todo lo demás estaba
// en dólares. Además el retorno se dividía SIEMPRE entre el precio en soles,
// así que la cuenta mezclaba dos monedas.
const AHORRO = 0.8;

function Slider({ id, label, value, min, max, step, onChange, suffix, prefix }) {
  const pct = ((value - min) / (max - min)) * 100;
  // `htmlFor` + `id` atan la etiqueta al control: sin eso el <label> era
  // decorativo y un lector de pantalla anunciaba «control deslizante, 35» sin
  // decir de qué. Además hace que pulsar sobre el texto enfoque el control.
  return (
    <div className="mb-6">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-300">
        {label}: <span className="font-extrabold text-brand-300">{prefix}{value}{suffix}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        // El valor que se anuncia lleva su unidad o su moneda; el número pelado
        // («35») no dice nada por sí solo.
        aria-valuetext={`${prefix || ''}${value}${suffix || ''}`}
        style={{ '--pct': `${pct}%` }}
      />
    </div>
  );
}

export default function RoiCalculator() {
  const { t, region } = useLang();
  const r = t.roi;
  const intlPay = region === 'INTL';
  const curSym = intlPay ? '$' : 'S/';
  // Precio mensual del plan de entrada EN LA MONEDA DEL VISITANTE, que es el
  // que hay que dividir entre lo que gana por hora para saber en cuánto se le
  // paga sola la licencia.
  const precioMes = intlPay ? PRECIOS_USD.individual.monthly : precioDesde('individual');
  const [proj, setProj] = useState(3);
  const [hrs, setHrs] = useState(20);
  const [rate, setRate] = useState(35);

  const { horasAhorradas, dinero, diasPayback } = useMemo(() => {
    const h = Math.round(proj * hrs * AHORRO);
    return {
      horasAhorradas: h,
      dinero: (h * rate).toLocaleString(r.locale),
      diasPayback: Math.max(0.1, precioMes / (rate * 8)).toFixed(1),
    };
  }, [proj, hrs, rate, r.locale, precioMes]);

  return (
    <Section>
      <Reveal className="mx-auto max-w-5xl rounded-3xl border border-white/10 glass p-8 sm:p-10">
        <div className="text-center">
          <h2 className="section-title">{r.title}</h2>
          <p className="mt-2 text-slate-400">{r.subtitle}</p>
        </div>

        <div className="mt-9 grid items-center gap-8 lg:grid-cols-2">
          {/* Controles */}
          <div>
            <Slider id="roi-proyectos" label={r.projects} value={proj} min={1} max={10} step={1} onChange={setProj} />
            <Slider id="roi-horas" label={r.hours} value={hrs} min={5} max={80} step={5} onChange={setHrs} suffix={r.hoursSuffix} />
            <Slider id="roi-tarifa" label={r.rate} value={rate} min={15} max={120} step={5} onChange={setRate} prefix={`${curSym} `} />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              <strong className="text-slate-400">{r.note.strong}</strong>{r.note.rest}
            </p>
          </div>

          {/* Resultados */}
          <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-ink-800 to-ink-900 p-8 text-center shadow-glow">
            <p className="text-sm text-slate-400">{r.resultLabel}</p>
            <p className="mt-2 font-display text-5xl font-extrabold text-accent-green">{horasAhorradas}{r.resultHours}</p>
            <p className="mt-1 text-sm text-slate-400">
              {r.moneyPre}<span className="font-bold text-white">{curSym} {dinero}</span>{r.moneyPost}
            </p>
            <div className="mt-5 rounded-xl border border-accent-green/30 bg-accent-green/10 p-4 text-sm text-slate-300">
              {r.paybackPre}<strong className="text-accent-green">{r.paybackBold.replace('{d}', diasPayback)}</strong>{r.paybackPost}
            </div>
            <a href="#trial" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent-emerald px-5 py-3 font-bold text-white transition-transform hover:-translate-y-0.5">
              {r.cta}
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
