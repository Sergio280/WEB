import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { BENTO } from '../../data/features.js';

const accentRing = {
  brand: 'hover:border-brand-500/40 hover:shadow-glow',
  emerald: 'hover:border-emerald-400/40',
  violet: 'hover:border-violet-400/40',
};
const accentText = {
  brand: 'text-brand-300',
  emerald: 'text-accent-green',
  violet: 'text-violet-300',
};

// Span por tarjeta: la destacada (lg) ocupa 2 columnas; el cierre de alcance
// ocupa el ancho completo. El resto, 1 columna. Sin row-span para que la
// altura la marque el contenido de cada fila (evita huecos vacíos).
const spanFor = (item) => {
  if (item.size === 'lg') return 'sm:col-span-2';
  if (item.size === 'wide') return 'sm:col-span-3';
  return '';
};

function Card({ item }) {
  const isLg = item.size === 'lg';
  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-white/10 glass p-6 transition-all duration-300 hover:-translate-y-1 ${accentRing[item.accent]} ${spanFor(item)}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{item.icon}</span>
        {item.badge && (
          <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-300">
            {item.badge}
          </span>
        )}
      </div>
      <h3 className={`mt-4 font-display font-bold text-white ${isLg ? 'text-2xl' : 'text-lg'}`}>{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>

      {item.points?.length > 0 && (
        <ul className={`mt-4 gap-x-6 gap-y-1.5 ${isLg ? 'grid sm:grid-cols-2' : 'space-y-1.5'}`}>
          {item.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
              <span className={`mt-0.5 ${accentText[item.accent]}`}>▸</span>
              {p}
            </li>
          ))}
        </ul>
      )}

      {item.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-400">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Bento() {
  return (
    <Section id="features">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">Capacidades</span>
        <h2 className="section-title mt-4">Un add-in completo, comando por comando</h2>
        <p className="mt-3 text-slate-400">
          Flujos reales que automatizan tareas completas de documentación estructural.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BENTO.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
