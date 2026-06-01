import { useRef, useState, useCallback } from 'react';

// Slider arrastrable antes/después. `before` y `after` son nodos React.
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

  const onDown = (e) => {
    dragging.current = true;
    update(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    update(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onUp = () => (dragging.current = false);

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
        className="absolute inset-y-0 z-20 flex w-0.5 cursor-ew-resize items-center justify-center bg-white"
        style={{ left: `${pos}%` }}
        onMouseDown={onDown}
        onTouchStart={onDown}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-white text-xs font-bold text-brand-700 shadow-lg">
          ⇄
        </span>
      </div>
    </div>
  );
}
