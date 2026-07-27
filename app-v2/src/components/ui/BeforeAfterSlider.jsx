import { useRef, useState, useCallback, useEffect } from 'react';

// Slider arrastrable antes/después. `before` y `after` son nodos React.
//
// Usa Pointer Events (no mouse+touch por separado) con captura de puntero: el
// arrastre sigue funcionando aunque el dedo/cursor salga del elemento, y
// `touch-action: none` impide que la página haga scroll mientras se arrastra en
// móvil — antes el mismo gesto movía el slider Y desplazaba la página.
//
// Accesible: el manejador es un role="slider" enfocable y operable con flechas,
// Inicio y Fin, no sólo con el ratón.
export default function BeforeAfterSlider({ before, after, labelBefore, labelAfter }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = useCallback((clientX) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    update(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    update(e.clientX);
  };

  const endDrag = (e) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Teclado: flechas mueven 2 %, con Shift 10 %; Inicio/Fin van a los extremos.
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2;
    let next = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = pos - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = pos + step;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 100;
    if (next === null) return;
    e.preventDefault();
    setPos(Math.max(0, Math.min(100, next)));
  };

  // Si el componente se desmonta a mitad de arrastre, no dejar la bandera puesta.
  useEffect(() => () => { dragging.current = false; }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl border border-white/10"
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
        aria-label={labelBefore && labelAfter ? `${labelBefore} / ${labelAfter}` : 'Comparar antes y después'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}%`}
        className="absolute inset-y-0 z-20 flex w-0.5 cursor-ew-resize items-center justify-center bg-white outline-none"
        style={{ left: `${pos}%`, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-white text-xs font-bold text-brand-700 shadow-lg transition-shadow [div:focus-visible>&]:ring-4 [div:focus-visible>&]:ring-brand-500/50">
          ⇄
        </span>
      </div>
    </div>
  );
}
