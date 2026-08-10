import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Widget de Cloudflare Turnstile para el formulario de prueba.
//
// POR QUÉ EXISTE ESTE ARCHIVO
// La función de registro (netlify/functions/create-trial-license.js) ya traía la
// verificación escrita y la anunciaba como «capa 5» de seguridad:
//
//     if (!process.env.TURNSTILE_SECRET) return true;   // no configurado → skip
//     if (!token) return false;
//
// …pero NINGUNA de las dos webs mandaba el token. Funcionaba solo porque el
// secreto estaba sin configurar. El día que alguien pusiera TURNSTILE_SECRET en
// Netlify —creyendo que encendía un antibot que parecía montado, con la CSP ya
// permitiendo challenges.cloudflare.com— se habrían caído TODAS las altas de
// prueba de golpe, sin más síntoma que un error genérico en el formulario.
//
// Con el widget puesto, activar el secreto hace lo que promete.
//
// LAS DOS VARIABLES VAN EN PAREJA
//   · VITE_TURNSTILE_SITE_KEY → clave PÚBLICA, la lee este componente en build.
//   · TURNSTILE_SECRET        → clave PRIVADA, la lee la función en el servidor.
// Sin ninguna de las dos, el registro funciona como siempre y aquí no se pinta
// nada. Con las dos, la verificación es real. Poner solo el secreto vuelve a
// bloquear los registros: es el único estado que no hay que dejar puesto.
// ─────────────────────────────────────────────────────────────────────────────

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Carga el script una sola vez aunque haya varios widgets, y resuelve cuando la
// API global está lista.
let cargando = null;
function cargarScript() {
  if (window.turnstile) return Promise.resolve();
  if (cargando) return cargando;

  cargando = new Promise((resolve, reject) => {
    const existente = document.getElementById(SCRIPT_ID);
    const el = existente || document.createElement('script');
    el.id = SCRIPT_ID;
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.addEventListener('load', () => resolve());
    el.addEventListener('error', () => reject(new Error('turnstile script')));
    if (!existente) document.head.appendChild(el);
  });
  return cargando;
}

/**
 * @param {(token: string) => void} onToken  Recibe el token, o '' si caducó o falló.
 * @param {object} innerRef  Ref opcional; se le cuelga { reset } para poder pedir
 *                           un token nuevo tras un envío fallido (son de un solo uso).
 */
export default function Turnstile({ onToken, innerRef }) {
  const cajaRef = useRef(null);
  // El callback cambia en cada render del formulario (cierra sobre su estado);
  // se guarda en un ref para no tener que volver a pintar el widget por eso.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return; // sin clave pública no hay nada que pintar

    let widgetId = null;
    let vivo = true;

    cargarScript()
      .then(() => {
        if (!vivo || !cajaRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(cajaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          action: 'trial-signup',
          callback: (token) => onTokenRef.current(token),
          // El token caduca a los ~5 min y es de un solo uso. Si el visitante
          // se entretiene rellenando el formulario, se limpia y Turnstile pide
          // otro solo: lo que no puede pasar es que se envíe uno ya gastado.
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
        });

        if (innerRef) {
          innerRef.current = {
            reset: () => {
              if (widgetId !== null && window.turnstile) {
                window.turnstile.reset(widgetId);
                onTokenRef.current('');
              }
            },
          };
        }
      })
      .catch(() => {
        // Cloudflare caído o bloqueado por una extensión: no se deja al
        // visitante encerrado. El servidor decide (rechazará si exige token).
        if (vivo) onTokenRef.current('');
      });

    return () => {
      vivo = false;
      if (widgetId !== null && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch { /* ya retirado */ }
      }
      if (innerRef) innerRef.current = null;
    };
  }, [innerRef]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={cajaRef} className="mt-1" />;
}
