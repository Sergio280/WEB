import { useState } from 'react';
import { useLang } from '../../i18n/LanguageProvider.jsx';
import { track } from '../../lib/track.js';

// ─────────────────────────────────────────────────────────────────────────────
// Aviso de idioma: «esta página también está en inglés».
//
// Sustituye al cambio automático que hacía antes la geolocalización. Aquel
// cambiaba los textos SIN cambiar la URL, así que "/" — que se anuncia como la
// versión en español con su canonical y su hreflang — servía inglés a buena
// parte del mundo, incluido el rastreador de Google, que se conecta sobre todo
// desde Estados Unidos. Para un buscador eran dos URLs con el mismo contenido.
//
// Redirigir tampoco valía: "/" es la página del mercado principal, y mandarla a
// /en/ desde una IP estadounidense es justo lo que haría que Google tomase la
// versión española por una simple redirección.
//
// Así que se ofrece, no se impone. El visitante decide, la URL y el idioma
// nunca se contradicen, y quien ya eligió no vuelve a ver esto (la elección
// queda guardada por `setLang`).
// ─────────────────────────────────────────────────────────────────────────────

const CLAVE_DESCARTADO = 'bims_lang_banner_off';

function yaDescartado() {
  try {
    return sessionStorage.getItem(CLAVE_DESCARTADO) === '1';
  } catch {
    return false;
  }
}

export default function LangBanner() {
  const { t, idiomaSugerido, setLang } = useLang();
  const [oculto, setOculto] = useState(yaDescartado);

  if (!idiomaSugerido || oculto) return null;

  // El aviso se escribe en el idioma que se OFRECE, no en el de la página: a
  // quien lee la web en español porque llegó a "/" desde Estados Unidos hay que
  // hablarle en inglés para que lo entienda.
  const texto = t.langBanner[idiomaSugerido];

  function descartar() {
    setOculto(true);
    try {
      sessionStorage.setItem(CLAVE_DESCARTADO, '1');
    } catch {
      /* sin almacenamiento el aviso reaparece en la siguiente página; aceptable */
    }
  }

  return (
    <div className="border-b border-brand-500/20 bg-brand-500/[0.08] px-5 py-2.5 text-center text-sm text-slate-200">
      <span>{texto.msg} </span>
      <button
        type="button"
        onClick={() => {
          track('lang_banner_switch', { to: idiomaSugerido });
          setLang(idiomaSugerido);
        }}
        className="font-bold text-brand-200 underline underline-offset-2 hover:text-white"
      >
        {texto.cta}
      </button>
      <button
        type="button"
        onClick={descartar}
        aria-label={texto.dismiss}
        className="ml-3 text-slate-400 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
