import { APPSTORE_URL } from '../../data/nav.js';
import { RESUMEN } from '../../data/reviews.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Sello del Autodesk App Store, ahora con la VALORACIÓN dentro.
//
// Este componente sale en la portada y en el pie, así que es la vía más corta
// para que la prueba social llegue a la primera pantalla sin inventarse una
// sección nueva: quien no baja hasta las reseñas ve igualmente que existen.
//
// EL NÚMERO DE RESEÑAS VA SIEMPRE PEGADO A LA MEDIA. Un «5,0» suelto sugiere un
// respaldo que dos reseñas todavía no dan; con «5,0 · 2 reseñas» la afirmación
// está completa y, además, se lee más creíble. Cuando lleguen más, el número
// sube solo desde data/reviews.js.
//
// Solo TEXTO + estrellas: no se usa el logo de Autodesk para no incurrir en un
// problema de marca (misma razón por la que se quitó el logo de Revit del
// plugin). Si más adelante se consigue el badge oficial de publisher, se
// sustituye aquí.
export default function AppStoreBadge({ className = '' }) {
  const { lang, t } = useLang();
  const url = APPSTORE_URL[lang] || APPSTORE_URL.es;
  const media = RESUMEN.media.toFixed(1);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('appstore_badge_click', { lang })}
      // `max-w-full` + `whitespace-nowrap`: sin lo primero el sello se salía del
      // ancho de la pantalla en móvil; sin lo segundo, partía «5.0 · 2 reseñas»
      // en dos líneas dentro de la píldora.
      className={`inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-amber-400/25 bg-amber-500/[0.08] px-3.5 py-2 text-sm text-slate-200 transition-colors hover:border-amber-400/50 hover:bg-amber-500/[0.14] hover:text-white sm:gap-2.5 sm:px-4 ${className}`}
    >
      <span className="text-accent-amber" aria-hidden="true">★★★★★</span>
      <span className="truncate">
        <strong className="font-bold text-white">{media}</strong>
        <span className="text-slate-400"> · {t.appStore.ratingCount.replace('{n}', RESUMEN.total)}</span>
        {/* La fuente solo cuando hay sitio: en móvil el sello se salía del ancho. */}
        <span className="hidden text-slate-400 sm:inline"> {t.appStore.ratingSource}</span>
      </span>
      <span aria-hidden="true" className="text-slate-500">→</span>
    </a>
  );
}
