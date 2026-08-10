import { useRef, useState, useCallback } from 'react';

// Slider arrastrable antes/después. `before` y `after` son nodos React.
//
// DOS COSAS QUE NO ERAN OBVIAS
//
// 1. En móvil no se podía arrastrar. La manija escuchaba onTouchStart y
//    onTouchMove, pero sin `touch-action: none` el navegador se queda el gesto
//    para hacer scroll vertical: intentar mover el comparador movía la página.
//    Y no vale con preventDefault, porque React registra los listeners táctiles
//    como pasivos — tiene que ser CSS. Este componente es el visual del caso
//    «Importa DWG», así que era una de las cosas con las que la gente intentaba
//    jugar y no respondía.
//
// 2. Con teclado no existía. La manija era un <div> sin rol, sin foco y sin
//    flechas. Ahora es un slider de verdad: role="slider", tabIndex, flechas
//    (±5 %), Inicio/Fin, y aria-valuenow para que se anuncie la posición.
export default function BeforeAfterSlider({ before, after, labelBefore, labelAfter }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = useCallback((clientX) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  const mover = useCallback((delta) => {
    setPos((p) => Math.max(0, Math.min(100, p + delta)));
  }, []);

  const onDown = (e) => {
    dragging.current = true;
    update(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    update(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onUp = () => (dragging.current = false);

  const onKeyDown = (e) => {
    const paso = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5 }[e.key];
    if (paso !== undefined) {
      e.preventDefault();
      mover(paso);
      return;
    }
    if (e.key === 'Home') { e.preventDefault(); setPos(0); }
    if (e.key === 'End')  { e.preventDefault(); setPos(100); }
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl border border-white/10"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchMove={onMove}
      onTouchEnd={onUp}
    >
      {/* Capa after (fondo completo) */}
      <div className="absolute inset-0">{after}</div>
      {labelAfter && (
        <span className="absolute right-3 top-3 z-10 rounded-md bg-emerald-500/90 px-2.5 py-1 text-xs font-bold text-white">
          {labelAfter}
        </span>
      )}

      {/* Capa before (recortada) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        {before}
        {labelBefore && (
          <span className="absolute left-3 top-3 z-10 whitespace-nowrap rounded-md bg-rose-500/90 px-2.5 py-1 text-xs font-bold text-white">
            {labelBefore}
          </span>
        )}
      </div>

      {/* Manija */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={labelBefore && labelAfter ? `${labelBefore} / ${labelAfter}` : 'Comparador'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        // touch-action:none es lo que impide que el navegador convierta el
        // arrastre en scroll. Sin esto el componente no funciona en móvil.
        style={{ left: `${pos}%`, touchAction: 'none' }}
        className="absolute inset-y-0 z-20 flex w-0.5 cursor-ew-resize items-center justify-center bg-white focus:outline-none"
        onMouseDown={onDown}
        onTouchStart={onDown}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-white text-xs font-bold text-brand-700 shadow-lg ring-brand-400/60 ring-offset-2 ring-offset-ink-900 peer-focus:ring-2 group-focus:ring-2 [div:focus-visible>&]:ring-2">
          ⇄
        </span>
      </div>
    </div>
  );
}
