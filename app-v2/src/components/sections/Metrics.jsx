import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import ErrorBoundary from '../ui/ErrorBoundary.jsx';
import { QUICK_METRICS } from '../../data/metrics.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Las gráficas viven en su propio módulo y se cargan aparte: arrastran Chart.js
// (~200 KB), que antes viajaba en el bundle principal y lo descargaba todo el
// mundo antes de ver la portada, aunque no bajara nunca hasta aquí.
//
// El import se REINTENTA una vez antes de darse por vencido: el fallo típico en
// móvil es una petición que se corta, y a la segunda entra. Si tampoco entra,
// la <ErrorBoundary> de abajo deja el hueco de las gráficas y la página sigue
// viva — sin ella, este error tiraba abajo TODA la landing (pantalla en blanco:
// ni portada, ni precios, ni formulario de prueba).
const MetricsCharts = lazy(() =>
  import('./MetricsCharts.jsx').catch(
    () =>
      new Promise((resolve, reject) => {
        setTimeout(() => import('./MetricsCharts.jsx').then(resolve, reject), 1200);
      })
  )
);

const accentBorder = {
  brand: 'border-brand-500/40',
  emerald: 'border-emerald-400/40',
  violet: 'border-violet-400/40',
};

/**
 * Espacio reservado para las gráficas mientras no están cargadas.
 * Copia las mismas clases de alto y separación que usa MetricsCharts, así que
 * ocupa exactamente lo mismo y la página no da un salto al aparecer las
 * gráficas de verdad. Si allí cambian las alturas, aquí también.
 */
function HuecoGraficas() {
  return (
    <div aria-hidden="true">
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 glass p-5">
            <p className="mb-4 h-5" />
            <div className="h-64 animate-pulse rounded-xl bg-white/[0.03]" />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 glass p-5">
        <p className="mb-4 h-5" />
        <div className="mx-auto h-80 max-w-xl animate-pulse rounded-xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

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

      {/* Punto de observación + gráficas diferidas.
          El hueco replica la ESTRUCTURA y las alturas exactas de MetricsCharts
          (dos gráficas de h-64 y un radar de h-80, con sus mismos márgenes) para
          que al cargar no cambie el alto de la página. No es solo estética: un
          salto aquí empuja todo lo de abajo, y eso rompía el scroll a #precios
          desde un enlace externo, además de contar como layout shift. */}
      <div ref={ref}>
        {visible && (
          <ErrorBoundary fallback={<HuecoGraficas />}>
            <Suspense fallback={<HuecoGraficas />}>
              <MetricsCharts m={m} />
            </Suspense>
          </ErrorBoundary>
        )}
        {!visible && <HuecoGraficas />}
      </div>
    </Section>
  );
}
