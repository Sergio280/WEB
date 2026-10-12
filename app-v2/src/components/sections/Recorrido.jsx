import { useEffect, useRef, useState } from 'react';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// ── Recorrido con el scroll ──────────────────────────────────────────────────
// Un edificio que se convierte y se encofra mientras el visitante baja. No es
// un vídeo: son N fotogramas exportados de Revit (el edificio de ejemplo de
// CYPECAD importado y encofrado con BIMS) que se pintan en un <canvas> según
// cuánto se ha avanzado dentro de la sección. Bajar avanza, subir retrocede.
//
// Por qué fotogramas y no un <video> con currentTime: el vídeo solo se puede
// colocar con precisión en los fotogramas clave y en Safari/iOS el salto se
// atasca; con imágenes cada posición del scroll es exacta en todos los
// navegadores.
//
// Peso: los fotogramas NO entran en la carga inicial. Se piden cuando la
// sección se acerca a la pantalla y en orden grueso→fino (cada 16, luego cada
// 8, 4, 2, 1): con muy pocos ya se puede recorrer entero y el resto rellena
// los huecos. Mientras falta uno se pinta el más cercano ya cargado.
//
// Pantalla vertical (móvil): hay una serie aparte, renderizada en vertical desde
// Revit con el edificio en la parte alta, y con la mitad de fotogramas (solo
// los pares) para que pese un tercio. Se pinta ajustada al ANCHO y pegada
// arriba; lo que sobra abajo es el mismo azul oscuro del fondo del render.
//
// Movimiento reducido: quien lo pide en su sistema ve el último fotograma fijo
// y los cuatro textos seguidos, sin animación ligada al scroll.

export const RECORRIDO_FOTOGRAMAS = 160;
const CARPETA = '/recorrido';

// Tramos del avance (0..1) en los que manda cada texto. Deben coincidir con los
// tiempos con los que se generaron los fotogramas: fantasma, conversión,
// encofrado y edificio completo.
const TRAMOS = [
  [0, 0.12],
  [0.12, 0.55],
  [0.55, 0.85],
  [0.85, 1.01],
];

// Color del borde inferior de los renders (fondo degradado de la vista 3D):
// rellena lo que el fotograma no cubre en pantallas verticales.
const FONDO_INFERIOR = 'rgb(10,14,25)';
const FONDO_SUPERIOR = 'rgb(40,52,78)';

const esVertical = () => window.innerHeight > window.innerWidth;

function rutaFotograma(n, movil) {
  return `${CARPETA}/${movil ? 'm' : 'd'}/f${String(n).padStart(3, '0')}.webp`;
}

// Orden de carga grueso→fino sin repetir.
function ordenDeCarga(total, minimo) {
  const orden = [];
  const visto = new Set();
  for (const paso of [16, 8, 4, 2, 1].filter((p) => p >= minimo)) {
    for (let i = 0; i < total; i += paso) {
      if (!visto.has(i)) { visto.add(i); orden.push(i); }
    }
  }
  return orden;
}

export default function Recorrido() {
  const { t } = useLang();
  const r = t.recorrido;
  const seccionRef = useRef(null);
  const canvasRef = useRef(null);
  const imagenes = useRef([]);
  const actual = useRef(-1);
  const [avance, setAvance] = useState(0);
  const [reducido, setReducido] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducido(mq.matches);
    const cambio = (e) => setReducido(e.matches);
    mq.addEventListener?.('change', cambio);
    return () => mq.removeEventListener?.('change', cambio);
  }, []);

  // Pinta el fotograma n, o el cargado más cercano si aún no ha llegado.
  const pintar = (n) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgs = imagenes.current;
    let img = null;
    for (let d = 0; d < RECORRIDO_FOTOGRAMAS && !img; d++) {
      for (const k of [n - d, n + d]) {
        const c = imgs[k];
        if (c && c.complete && c.naturalWidth) { img = c; break; }
      }
    }
    if (!img) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const vertical = img.naturalHeight > img.naturalWidth;
    if (vertical) {
      // Serie vertical: ajustada al ancho y pegada arriba; si el fotograma es
      // más bajo que la pantalla, el resto se rellena con su color de fondo.
      ctx.fillStyle = FONDO_INFERIOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const esc = canvas.width / img.naturalWidth;
      ctx.drawImage(img, 0, 0, canvas.width, img.naturalHeight * esc);
    } else {
      // Serie apaisada: ajustada al ALTO. En pantallas anchas el edificio se
      // corre a la derecha para dejar la columna de texto libre; el hueco que
      // queda a la izquierda se pinta con el mismo degradado vertical que el
      // fondo del render, así que no se nota la costura.
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, FONDO_SUPERIOR);
      g.addColorStop(1, FONDO_INFERIOR);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let esc = canvas.height / img.naturalHeight;
      if (img.naturalWidth * esc < canvas.width * 0.75) esc = (canvas.width * 0.75) / img.naturalWidth;
      const dw = img.naturalWidth * esc, dh = img.naturalHeight * esc;
      const ancha = canvas.width / canvas.height > 1.25;
      const centro = ancha ? canvas.width * 0.64 : canvas.width / 2;
      ctx.drawImage(img, centro - dw / 2, (canvas.height - dh) / 2, dw, dh);
    }
  };

  // Carga diferida de los fotogramas cuando la sección se acerca.
  useEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;
    let cancelado = false;
    const arrancar = () => {
      const movil = esVertical();
      // El último fotograma de la serie móvil es el par más alto.
      const ultimo = movil ? (RECORRIDO_FOTOGRAMAS - 1) & ~1 : RECORRIDO_FOTOGRAMAS - 1;
      const lista = reducido ? [ultimo] : ordenDeCarga(RECORRIDO_FOTOGRAMAS, movil ? 2 : 1);
      let i = 0;
      // Cuatro descargas a la vez: suficiente para llenar la línea sin
      // competir con el resto de la página.
      const siguiente = () => {
        if (cancelado || i >= lista.length) return;
        const n = lista[i++];
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          if (cancelado) return;
          if (!listo && img.naturalWidth) setListo(true);
          // Repinta si el que llegó está más cerca del que toca.
          pintar(actual.current < 0 ? (reducido ? RECORRIDO_FOTOGRAMAS - 1 : 0) : actual.current);
          siguiente();
        };
        img.src = rutaFotograma(n, movil);
        imagenes.current[n] = img;
      };
      for (let k = 0; k < 4; k++) siguiente();
    };
    const io = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        io.disconnect();
        arrancar();
        track('recorrido_visto');
      }
    }, { rootMargin: '150% 0px' });
    io.observe(seccion);
    return () => { cancelado = true; io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducido]);

  // Avance ligado al scroll: 0 cuando la sección toca arriba, 1 cuando su
  // final llega al borde inferior de la pantalla.
  useEffect(() => {
    if (reducido) { pintar(RECORRIDO_FOTOGRAMAS - 1); return; }
    let pedido = 0;
    const medir = () => {
      pedido = 0;
      const s = seccionRef.current;
      if (!s) return;
      const caja = s.getBoundingClientRect();
      const recorrido = caja.height - window.innerHeight;
      const p = recorrido > 0 ? Math.min(1, Math.max(0, -caja.top / recorrido)) : 0;
      const n = Math.round(p * (RECORRIDO_FOTOGRAMAS - 1));
      if (n !== actual.current) { actual.current = n; pintar(n); }
      setAvance(p);
    };
    const alMover = () => { if (!pedido) pedido = requestAnimationFrame(medir); };
    const alRedimensionar = () => { actual.current = -1; alMover(); };
    window.addEventListener('scroll', alMover, { passive: true });
    window.addEventListener('resize', alRedimensionar);
    medir();
    return () => {
      window.removeEventListener('scroll', alMover);
      window.removeEventListener('resize', alRedimensionar);
      if (pedido) cancelAnimationFrame(pedido);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducido]);

  // Cada texto entra en los primeros 0,04 de su tramo y sale en los últimos
  // 0,04, de modo que en la frontera los dos están a cero: nunca se pisan.
  // El primero ya está visible al llegar y el último no se va.
  const opacidad = (i) => {
    const [a, b] = TRAMOS[i];
    const borde = 0.04;
    if (avance < a || avance > b) return 0;
    const entrada = i === 0 ? 1 : Math.min(1, (avance - a) / borde);
    const salida = i === TRAMOS.length - 1 ? 1 : Math.min(1, (b - avance) / borde);
    return Math.max(0, Math.min(entrada, salida));
  };

  if (reducido) {
    return (
      <section id="recorrido" ref={seccionRef} className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <span className="eyebrow">{r.eyebrow}</span>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-white/10">
            <canvas ref={canvasRef} className="h-full w-full" aria-label={r.canvasAria} role="img" />
          </div>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {r.pasos.map((p, i) => (
              <li key={i}>
                <h3 className="font-display text-xl font-bold text-white">{p.titulo}</h3>
                <p className="mt-2 text-slate-400">{p.texto}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-slate-500">{r.nota}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="recorrido" ref={seccionRef} className="relative" style={{ height: '420vh' }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-ink-950">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${listo ? 'opacity-100' : 'opacity-0'}`}
          aria-label={r.canvasAria}
          role="img"
        />
        {/* Viñeta: funde los bordes del render con el fondo de la página y da
            contraste al texto sin tapar el edificio. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,10,20,0.85)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent sm:h-2/5" />
        {/* En pantallas anchas el texto va a la izquierda: se oscurece ese lado. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-ink-950/80 to-transparent lg:block" />

        <div className="absolute inset-x-0 top-0 mx-auto max-w-6xl px-5 pt-24 sm:pt-28">
          <span className="eyebrow">{r.eyebrow}</span>
        </div>

        {/* Textos: uno por tramo, superpuestos y fundidos según el avance. */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
          <div className="relative min-h-[11rem] sm:min-h-[9rem] lg:min-h-[15rem]">
            {r.pasos.map((p, i) => {
              const o = opacidad(i);
              return (
                <div
                  key={i}
                  className="absolute inset-x-0 bottom-0 max-w-2xl lg:max-w-md"
                  style={{ opacity: o, transform: `translateY(${(1 - o) * 14}px)` }}
                  aria-hidden={o < 0.5}
                >
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-300">
                    {String(i + 1).padStart(2, '0')} / {String(r.pasos.length).padStart(2, '0')}
                  </span>
                  <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[2.75rem]">
                    {p.titulo}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-slate-300 sm:text-lg">{p.texto}</p>
                  {i === r.pasos.length - 1 && (
                    <a
                      href="#trial"
                      onClick={() => track('recorrido_cta_click')}
                      className="btn-primary pointer-events-auto mt-5 inline-flex text-base"
                      tabIndex={o < 0.5 ? -1 : 0}
                    >
                      {r.cta}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra de avance por tramos */}
          <div className="mt-8 flex gap-2 lg:max-w-md" aria-hidden="true">
            {TRAMOS.map(([a, b], i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: `${Math.min(100, Math.max(0, ((avance - a) / (Math.min(b, 1) - a)) * 100))}%` }}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 lg:max-w-md">{r.nota}</p>
        </div>
      </div>
    </section>
  );
}
