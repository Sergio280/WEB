import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { QUICK_METRICS } from '../../data/metrics.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Las gráficas viven en su propio módulo y se cargan aparte: arrastran Chart.js
// (~200 KB), que antes viajaba en el bundle principal y lo descargaba todo el
// mundo antes de ver la portada, aunque no bajara nunca hasta aquí.
const MetricsCharts = lazy(() => import('./MetricsCharts.jsx'));

const accentBorder = {
  brand: 'border-brand-500/40',
  emerald: 'border-emerald-400/40',
  violet: 'border-violet-400/40',
};

export default function Metrics() {
  const { t } = useLang();
  const m = t.metrics;

  // Solo se pide el módulo de las gráficas cuando la sección se acerca al
  // viewport. Con `rootMargin` de 400px empieza a descargarse un poco antes de
  // que se vea, así que para el usuario ya está lista cuando llega — pero quien
  // no baja hasta aquí nunca paga el coste.
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sin IntersectionObserver (navegadores muy viejos) se cargan directamente:
    // mejor mostrar las gráficas que dejar un hueco vacío.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section id="efectividad">
      <Reveal className="text-center">
        <span className="eyebrow">{m.eyebrow}</span>
        <h2 className="section-title mt-4">{m.title}</h2>
        <p className="mt-3 text-slate-400">{m.subtitle}</p>
      </Reveal>

      {/* Métricas rápidas */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {QUICK_METRICS.map((metric, i) => (
          <Reveal key={metric.value} delay={i * 0.1}>
            <div className={`rounded-2xl border ${accentBorder[metric.accent]} glass p-6 text-center`}>
              <p className="text-sm text-slate-400">{m.quickLabels[i]}</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{metric.value}</p>
              <p className="mt-1 text-xs text-slate-500">{m.quickCaption}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Punto de observación + gráficas diferidas. El contenedor reserva alto
          mientras cargan para que el contenido de abajo no dé un salto. */}
      <div ref={ref}>
        {visible && (
          <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl border border-white/10 glass" />}>
            <MetricsCharts m={m} />
          </Suspense>
        )}
      </div>
    </Section>
  );
}
