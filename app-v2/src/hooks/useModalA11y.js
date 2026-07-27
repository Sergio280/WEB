import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useModalA11y — comportamiento de diálogo modal accesible, compartido por el
// modal de compra y el lightbox de clips.
//
// Cubre lo que faltaba en ambos:
//   · Escape cierra.
//   · Bloqueo del scroll del fondo SIN el salto de layout que provoca ocultar
//     la barra de scroll (se compensa con padding-right).
//   · Foco inicial dentro del diálogo y RESTAURACIÓN al elemento que lo abrió
//     al cerrar (sin esto, el foco vuelve al principio del documento y quien
//     navega por teclado pierde el sitio).
//   · Focus trap: Tab y Shift+Tab circulan dentro del diálogo. Antes se podía
//     tabular al contenido de detrás mientras el modal estaba abierto.
//
// Devuelve la ref que hay que poner en el contenedor del diálogo.
// ─────────────────────────────────────────────────────────────────────────────

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useModalA11y(onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    const previouslyFocused = document.activeElement;

    function onKey(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;

      const items = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKey);

    // Bloqueo de scroll compensando el ancho de la barra, para que el fondo no
    // dé un salto horizontal al abrir el modal.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    // Foco inicial: el primer elemento enfocable del diálogo.
    const firstFocusable = dialog && dialog.querySelector(FOCUSABLE);
    if (firstFocusable) firstFocusable.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  return ref;
}
