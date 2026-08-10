import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Retiene el foco del teclado dentro de un diálogo mientras está abierto.
//
// Los dos modales del sitio (el de compra y el visor de clips) cerraban con
// Escape y bloqueaban el scroll del fondo, pero el foco seguía paseando por la
// página de detrás: con Tab se salía del modal y se acababa escribiendo en
// campos invisibles. En el de compra importa el doble, porque es donde el
// visitante teclea su RUC, su correo y sus datos fiscales.
//
// Al cerrar, el foco vuelve a donde estaba — normalmente el botón que abrió el
// modal —, que es lo que espera quien navega sin ratón.
// ─────────────────────────────────────────────────────────────────────────────

const SELECTOR_ENFOCABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(ref) {
  useEffect(() => {
    const caja = ref.current;
    if (!caja) return;

    const veniaDe = document.activeElement;

    // Se recalcula en cada Tab en vez de guardarse una lista: el contenido del
    // modal cambia solo (el bloque de comprobante aparece y desaparece según el
    // método de pago, el botón se deshabilita mientras se procesa).
    //
    // getClientRects() en vez de offsetParent para saber si algo se ve: dentro
    // de un contenedor `fixed`, offsetParent miente.
    const enfocables = () =>
      Array.from(caja.querySelectorAll(SELECTOR_ENFOCABLE)).filter((el) => el.getClientRects().length > 0);

    const primeros = enfocables();
    (primeros[0] || caja).focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const lista = enfocables();
      if (lista.length === 0) {
        e.preventDefault();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    caja.addEventListener('keydown', onKeyDown);
    return () => {
      caja.removeEventListener('keydown', onKeyDown);
      if (veniaDe && typeof veniaDe.focus === 'function') veniaDe.focus();
    };
  }, [ref]);
}
