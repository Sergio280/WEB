import { useEffect, useMemo, useRef, useState } from 'react';
import { CULQI_CONFIG } from '../../data/culqi.js';
import {
  PRECIOS_USD, equivalenteMensual, ahorroPct, formatoUsd,
  precioListaPen, precioListaUsd,
} from '../../data/pricing.js';
import { validarComprobante, normalizarComprobante, UMBRAL_DNI_BOLETA } from '../../lib/comprobante.js';
import { leerPromo, consultarPromo } from '../../lib/promo.js';
import { openCulqiCheckout } from '../../hooks/useCulqi.js';
import { openLsCheckout } from '../../lib/lemonsqueezy.js';
import { track, trackYNavegar } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modal de compra: replica el flujo del modal de pago Culqi de la home.
// Los precios y URLs de checkout viven en CULQI_CONFIG; el texto, en el idioma
// activo (t.culqiModal).
export default function CulqiModal({ planKey, onClose, errorInicial = '', onErrorTrasCierre }) {
  const { t, region } = useLang();
  const c = t.culqiModal;
  const plan = CULQI_CONFIG.plans[planKey]; // precios + checkout
  const tp = c.plans[planKey]; // texto: features, periods, savings
  const badge = t.pricing.catalog[planKey].badge;

  // Ambos métodos de pago SIEMPRE disponibles (nadie queda bloqueado):
  //   - 'culqi': tarjetas peruanas en soles (solo Perú).
  //   - 'intl' : tarjetas internacionales en USD vía Lemon Squeezy.
  // El default depende de la REGIÓN de pago (no del idioma): Perú → Culqi;
  // cualquier otro país → internacional, porque un usuario fuera de Perú no
  // puede pagar con Culqi. El selector de arriba permite cambiar igual.
  const lsSupported = planKey === 'individual' || planKey === 'profesional';
  const [method, setMethod] = useState(region === 'INTL' && lsSupported ? 'intl' : 'culqi');
  const intl = method === 'intl';

  // El método arrancaba fijado al montar el modal, y la región tarda en
  // saberse: sale de /api/geo, que es una petición de red. Hasta que responde
  // se asume Perú, así que quien abría el modal en los primeros instantes veía
  // precios en soles y el checkout de Culqi — con el que no puede pagar si está
  // fuera de Perú. Ahora, mientras el usuario no haya tocado el selector, la
  // elección se recoloca sola en cuanto se conoce el país.
  // Se da por elegido en cuanto el usuario toca el selector O pulsa «Pagar»:
  // a partir de ahí la geo no puede cambiarle el método por debajo.
  const metodoElegido = useRef(false);
  useEffect(() => {
    if (metodoElegido.current) return;
    setMethod(region === 'INTL' && lsSupported ? 'intl' : 'culqi');
  }, [region, lsSupported]);

  // Un pago puede fallar cuando este modal YA NO EXISTE: el formulario de
  // tarjeta de Culqi se dibuja encima y sigue vivo aunque se cierre el modal de
  // debajo. El mensaje llegaba a un componente desmontado y se perdía en
  // silencio — el cobro no se hacía y el comprador no se enteraba de nada.
  // Se avisa a Pricing, que sí sobrevive, para que lo vuelva a abrir con el
  // motivo a la vista.
  // Se marca en el cuerpo del efecto, no solo en la limpieza: en desarrollo
  // StrictMode monta, desmonta y vuelve a montar, y el ref sobrevive a ese
  // ciclo — sin esto se quedaría en `false` para siempre.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  // El foco se queda dentro del diálogo mientras está abierto y vuelve al botón
  // que lo abrió al cerrarlo. Aquí es donde se teclean RUC, correo y datos
  // fiscales: salirse con Tab significaba escribirlos en campos invisibles.
  const cajaRef = useRef(null);
  useFocusTrap(cajaRef);

  // Precios en USD: viven en data/pricing.js junto con los de soles, para que
  // no haya dos tablas de precios en el frontend.
  const [intlDuration, setIntlDuration] = useState('monthly'); // 'monthly' | 'yearly'
  // Número para cualquier cuenta; `usdTexto` es lo único que se pinta.
  const usdPrice = (PRECIOS_USD[planKey] || PRECIOS_USD.individual)[intlDuration];
  const usdTexto = formatoUsd(usdPrice);

  const [paymentType, setPaymentType] = useState('onetime'); // 'onetime' | 'subscription'
  const [duration, setDuration] = useState('1m');
  const [email, setEmail] = useState('');
  // `errorInicial` trae el motivo de un pago que falló con el modal cerrado.
  const [error, setError] = useState(errorInicial);
  const [processing, setProcessing] = useState(false);
  // `processing` cubre dos etapas muy distintas y solo UNA se puede rearmar:
  //   · checkout abierto / redirigiendo → el usuario puede echarse atrás, y
  //     entonces hay que devolverle el botón (ver efecto de rearme abajo).
  //   · confirmando contra nuestro servidor (ya hay token de tarjeta y la
  //     petición está en vuelo) → NO se toca: rearmar aquí enseñaría un botón
  //     «Pagar» activo mientras el cobro se está resolviendo.
  const confirmando = useRef(false);

  // Datos para el comprobante electrónico (solo aplica al pago en Perú: fuera
  // de Perú cobra Lemon Squeezy como Merchant of Record y emite él su recibo).
  // Por defecto BOLETA, que es el caso mayoritario y no exige escribir nada en
  // compras pequeñas; quien necesita factura la elige explícitamente.
  const [cpTipo, setCpTipo] = useState('boleta'); // 'boleta' | 'factura'
  const [cpDoc, setCpDoc] = useState('');
  const [cpRazon, setCpRazon] = useState('');
  const [cpCampoError, setCpCampoError] = useState(null); // 'doc' | 'razonSocial' | null

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // ── Rearme del botón de pago ────────────────────────────────────────────
  // El pago continúa FUERA de esta página (el iframe de Culqi o el checkout de
  // Lemon Squeezy) y ninguno de los dos avisa de forma fiable cuando el usuario
  // se echa atrás:
  //   · Culqi: si cierra su ventana con la X, no siempre llama a window.culqi.
  //   · Lemon Squeezy: es una navegación completa a otro dominio. Al volver con
  //     «atrás», el navegador restaura la página TAL CUAL desde bfcache — con
  //     el modal abierto y processing = true.
  // En ambos casos el botón se quedaba deshabilitado («Procesando…») para
  // siempre: el usuario vuelve, pulsa y no pasa NADA. Medido en Clarity como
  // clic sin respuesta, con el usuario cerrando y reabriendo el modal para
  // poder reintentar.
  useEffect(() => {
    if (!processing) return;

    const rearmar = () => {
      if (!confirmando.current) setProcessing(false);
    };

    // 1) Vuelta atrás desde el checkout externo (bfcache).
    const onPageShow = (e) => { if (e.persisted) rearmar(); };
    window.addEventListener('pageshow', onPageShow);

    // 2) Cierre del widget de Culqi: inserta #culqi_checkout_frame al abrir y
    //    lo quita al cerrar. Se vigila el DOM en vez de sondear por reloj.
    let vistoFrame = false;
    const obs = new MutationObserver(() => {
      if (document.getElementById('culqi_checkout_frame')) vistoFrame = true;
      else if (vistoFrame) rearmar();
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // 3) Red de seguridad: si el checkout nunca llegó a abrirse ni la
    //    navegación ocurrió, el botón se rearma solo en vez de quedar muerto.
    const t = setTimeout(rearmar, 20000);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      obs.disconnect();
      clearTimeout(t);
    };
  }, [processing]);

  const isSub = paymentType === 'subscription';
  const precioLista = isSub ? plan.subscription.price : plan[duration].price;

  // Promoción por enlace (?promo=CODIGO). Solo aplica a PAGO ÚNICO: en Culqi el
  // importe de una suscripción lo fija el plan registrado en su panel, así que
  // un descuento ahí exigiría crear otro plan. Ver _lib/descuentos.js.
  const codigoPromo = useMemo(() => leerPromo(), []);
  const [promo, setPromo] = useState(null); // { total, totalOriginal, ahorro }

  useEffect(() => {
    if (!codigoPromo || isSub || intl) { setPromo(null); return; }
    let vigente = true;

    // Se espera un poco antes de preguntar: el correo cambia en cada tecla y no
    // tiene sentido consultar mientras se está escribiendo. Solo se manda si ya
    // parece un correo completo; si no, se consulta sin él y el servidor
    // concede el beneficio de la duda.
    const correo = emailRe.test(email.trim()) ? email.trim() : '';
    const t = setTimeout(() => {
      consultarPromo({ codigo: codigoPromo, plan: planKey, duration, email: correo }).then((p) => {
        if (vigente) setPromo(p);
      });
    }, 400);

    // Se reconsulta al cambiar de duración (un código puede valer solo para una)
    // y al cambiar el correo (puede estar reservado a una persona concreta).
    return () => { vigente = false; clearTimeout(t); };
  }, [codigoPromo, planKey, duration, isSub, intl, email]);

  // Precio que se muestra y que se le pasa al widget de Culqi. El importe que
  // realmente se cobra lo recalcula el servidor; esto es solo la vitrina.
  const price = promo ? promo.total : precioLista;

  // Precio de LISTA tachado (S/120 al mes de base; ver data/pricing.js). Solo
  // se enseña si NO hay promoción: con promo ya se tacha el precio normal, y
  // dos tachados seguidos no se leen como una oferta, se leen como un error.
  const listaTachada = promo ? null : precioListaPen(planKey, isSub ? 'sub' : duration);
  const listaUsdTachada = precioListaUsd(planKey, intlDuration);

  // El texto de ahorro se compone aquí: la traducción aporta el formato
  // (c.savingsTpl) y pricing.js los números. Antes había seis frases escritas a
  // mano (dos planes × tres duraciones × dos idiomas) que quedaban mintiendo en
  // cuanto se movía un precio.
  const savingsNote = useMemo(() => {
    if (isSub) return '';
    const pct = ahorroPct(planKey, duration);
    if (pct <= 0) return '';
    return c.savingsTpl
      .replace('{mensual}', equivalenteMensual(planKey, duration))
      .replace('{pct}', pct);
  }, [isSub, planKey, duration, c]);

  const periodText = useMemo(
    () => (isSub ? c.subPeriod.replace('{price}', price) : tp.periods[duration]),
    [isSub, price, duration, c, tp]
  );

  function handlePay() {
    if (!emailRe.test(email.trim())) {
      setError(c.emailError);
      setCpCampoError(null);
      return;
    }

    // Datos fiscales. El backend los revalida, pero se comprueban aquí para
    // avisar ANTES de abrir el checkout de Culqi: si el RUC estuviera mal, el
    // usuario ya habría metido su tarjeta cuando el servidor lo rechazara.
    const datosCp = { tipo: cpTipo, doc: cpDoc, razonSocial: cpRazon };
    const v = validarComprobante(datosCp, price);
    if (!v.ok) {
      const msg = { rucInvalido: c.cpErrRuc, razonRequerida: c.cpErrRazon, dniInvalido: c.cpErrDni };
      setError(msg[v.motivo] || c.cpErrRuc);
      setCpCampoError(v.campo);
      return;
    }

    setError('');
    setCpCampoError(null);
    confirmando.current = false;
    metodoElegido.current = true;
    setProcessing(true);
    track('begin_checkout', {
      plan: planKey,
      // Sin esto, el `begin_checkout` de Culqi era el único evento de pago sin
      // `gateway`, y en GA4 había que leerlo como "pasarela vacía = Culqi".
      // La dimensión personalizada se rompía en cuanto entrara una tercera.
      gateway: 'culqi',
      payment_type: isSub ? 'subscription' : 'onetime',
      duration: isSub ? 'sub' : duration,
      value: price,
      currency: 'PEN',
    });
    openCulqiCheckout({
      planKey,
      duration,
      isSub,
      email: email.trim(),
      comprobante: normalizarComprobante(datosCp),
      // El servidor revalida el código y recalcula el importe: aquí solo se
      // transporta. Si el código ya no aplicara, cobraría precio de lista.
      codigo: promo ? codigoPromo : null,
      precio: price, // para que el widget de Culqi muestre el importe con promoción
      // Textos y destino localizados para el checkout y la redirección final.
      title: `BIMS — ${badge}`,
      description: isSub ? c.subscription : periodText,
      successUrl: c.successUrl,
      errLoad: c.errLoad,
      errRejected: c.errRejected,
      errPay: c.errPay,
      // A partir de aquí ya hay token y la petición al servidor está en vuelo:
      // el botón deja de ser rearmable hasta que responda.
      onProcessing: () => {
        confirmando.current = true;
        setProcessing(true);
      },
      onError: (msg) => {
        confirmando.current = false;
        // El embudo medía dónde EMPIEZA el pago y nunca dónde se cae, así que
        // los fallos solo se veían mirando grabaciones de sesión una por una.
        // El motivo va recortado: es texto de la pasarela y GA4 no admite
        // valores largos.
        track('payment_error', {
          plan: planKey,
          gateway: 'culqi',
          payment_type: isSub ? 'subscription' : 'onetime',
          motivo: String(msg).slice(0, 100),
        });
        if (montado.current) {
          setProcessing(false);
          setError(msg);
        } else if (onErrorTrasCierre) {
          // El modal ya no está: que lo reabra quien sí sigue en pie.
          onErrorTrasCierre(msg);
        }
      },
      // El usuario cerró el formulario de tarjeta sin pagar: se le devuelve el
      // botón, sin mensaje de error (no ha fallado nada, se lo pensó mejor).
      // Se registra igual: abandonar el formulario de tarjeta es la señal más
      // valiosa del embudo y era invisible.
      onCancel: () => {
        confirmando.current = false;
        setProcessing(false);
        track('payment_cancelled', {
          plan: planKey,
          gateway: 'culqi',
          payment_type: isSub ? 'subscription' : 'onetime',
        });
      },
    });
  }

  // Pago internacional (Lemon Squeezy). LS solo tiene mensual/anual.
  function handlePayIntl() {
    if (!emailRe.test(email.trim())) {
      setError(c.emailError);
      return;
    }
    setError('');
    // La navegación a Lemon Squeezy sale de esta página: si el usuario vuelve
    // con «atrás», el efecto de rearme le devuelve el botón (bfcache).
    confirmando.current = false;
    metodoElegido.current = true;
    setProcessing(true);
    // En modo internacional (inglés) usamos el toggle Mensual/Anual; en español
    // (botón secundario) mapeamos la selección Culqi: 12m → anual, resto → mensual.
    const lsDuration = intl ? intlDuration : isSub ? 'monthly' : duration === '12m' ? 'yearly' : 'monthly';
    // Lemon Squeezy es una navegación a otro dominio: se espera a que el
    // evento salga antes de abandonar la página.
    try {
      trackYNavegar(
        'begin_checkout',
        { plan: planKey, gateway: 'lemonsqueezy', duration: lsDuration, currency: 'USD' },
        () => openLsCheckout({ plan: planKey, duration: lsDuration, email: email.trim() })
      );
    } catch (e) {
      setProcessing(false);
      const msg = e.message || 'Error al iniciar el pago internacional.';
      setError(msg);
      track('payment_error', { plan: planKey, gateway: 'lemonsqueezy', motivo: String(msg).slice(0, 100) });
    }
  }

  return (
    <div
      className="anim-fade fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
        {/* El alto se limita al de la ventana y el cuerpo scrollea por dentro.
            Sin esto, en pantallas de portátil (y con el bloque de comprobante
            añadido) el modal crecía más que la pantalla y quedaba CORTADO: el
            `overflow-hidden` recortaba el contenido y el botón de pagar podía
            quedar fuera, sin forma de llegar a él.
            El `max-h` en línea usa dvh (alto real de la ventana, descontando
            las barras del navegador móvil); la clase Tailwind con vh queda de
            respaldo para navegadores que no entiendan dvh. */}
      <div
          ref={cajaRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${c.title || 'BIMS'} — ${badge}`}
          tabIndex={-1}
          className="anim-modal flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-glow-lg focus:outline-none"
          style={{ maxHeight: 'calc(100dvh - 2rem)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* La cabecera no se encoge ni se va con el scroll: el aspa de cerrar
              tiene que estar siempre a la vista. */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
            <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-300">{badge}</span>
            <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-white" aria-label={c.closeAria}>
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {/* Selector de método de pago — SIEMPRE visible (nadie queda fuera) */}
            {lsSupported && (
              <>
                <div className="mb-1 grid grid-cols-2 gap-2 rounded-xl bg-ink-900 p-1">
                  <button
                    onClick={() => { metodoElegido.current = true; setMethod('culqi'); }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      !intl ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.methodCulqi}
                  </button>
                  <button
                    onClick={() => { metodoElegido.current = true; setMethod('intl'); }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      intl ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.methodIntl}
                  </button>
                </div>
                <p className="mb-5 text-center text-[11px] text-slate-500">
                  {intl ? c.methodIntlHint : c.methodCulqiHint}
                </p>
              </>
            )}

            {intl ? (
              /* ── Método internacional: Lemon Squeezy, USD ── */
              <>
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-ink-900 p-1">
                  <button
                    onClick={() => setIntlDuration('monthly')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      intlDuration === 'monthly' ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.intlMonthly}
                  </button>
                  <button
                    onClick={() => setIntlDuration('yearly')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      intlDuration === 'yearly' ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.intlYearly}
                  </button>
                </div>
                <div className="mb-1 text-center">
                  {listaUsdTachada != null && (
                    <span className="mr-2 align-middle text-lg font-semibold text-slate-500 line-through">
                      ${formatoUsd(listaUsdTachada)}
                    </span>
                  )}
                  <span className="font-display text-4xl font-extrabold text-white">${usdTexto}</span>
                  <span className="text-sm font-semibold text-slate-500">
                    {intlDuration === 'yearly' ? c.intlPerYear : c.intlPerMonth}
                  </span>
                </div>
                {intlDuration === 'yearly' && (
                  <p className="mb-4 text-center text-xs font-semibold text-accent-green">{c.intlYearNote}</p>
                )}
              </>
            ) : (
              /* ── Modo Perú (español): Culqi, PEN ── */
              <>
                {/* Tipo de pago */}
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-ink-900 p-1">
                  <button
                    onClick={() => setPaymentType('onetime')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      !isSub ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.onetime}
                  </button>
                  <button
                    onClick={() => setPaymentType('subscription')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isSub ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.subscription}
                  </button>
                </div>

                {/* Duración (solo pago único) */}
                {!isSub && (
                  <div className="mb-5 grid grid-cols-4 gap-2">
                    {c.durations.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDuration(d.key)}
                        className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                          duration === d.key
                            ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                            : 'border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Precio. El monto YA incluye IGV (se absorbe, no se suma al
                    precio de lista), así que se avisa junto al número para que
                    nadie espere un recargo en el checkout. */}
                <div className="mb-1 text-center">
                  {/* Con promoción se tacha el precio de lista al lado, para que
                      se vea el ahorro y no parezca que el precio bajó sin más. */}
                  {promo && (
                    <span className="mr-2 align-middle text-lg font-semibold text-slate-500 line-through">
                      S/{promo.totalOriginal}
                    </span>
                  )}
                  {listaTachada != null && (
                    <span className="mr-2 align-middle text-lg font-semibold text-slate-500 line-through">
                      S/{listaTachada}
                    </span>
                  )}
                  <span className="font-display text-4xl font-extrabold text-white">S/{price}</span>
                  <span className="ml-2 align-middle text-xs font-semibold text-slate-500">{c.igvNote}</span>
                </div>
                {promo && (
                  <p className="mb-1 text-center text-xs font-bold text-accent-green">
                    {c.promoApplied.replace('{ahorro}', promo.ahorro)}
                  </p>
                )}
                <p className="mb-2 text-center text-sm text-slate-400">{periodText}</p>
                {savingsNote && (
                  <p className="mb-4 text-center text-xs font-semibold text-accent-green">{savingsNote}</p>
                )}
              </>
            )}

            {/* Features */}
            <ul className="mb-5 space-y-1.5">
              {tp.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-accent-green">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Comprobante electrónico — solo en el pago por Perú (Culqi).
                En el pago internacional cobra Lemon Squeezy como Merchant of
                Record: vende a su nombre y emite su propio recibo, así que
                pedir RUC ahí solo confundiría. */}
            {!intl && (
              <div className="mb-5 rounded-xl border border-white/10 bg-ink-900/60 p-4">
                <p className="mb-2.5 text-sm font-semibold text-slate-300">{c.cpTitle}</p>

                <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-ink-900 p-1">
                  {[
                    { key: 'boleta', label: c.cpBoleta },
                    { key: 'factura', label: c.cpFactura },
                  ].map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        setCpTipo(o.key);
                        // Al cambiar de tipo el documento anterior deja de ser
                        // válido (un RUC no es un DNI), así que se limpia para
                        // que nadie envíe el número equivocado sin darse cuenta.
                        setCpDoc('');
                        setCpRazon('');
                        setCpCampoError(null);
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        cpTipo === o.key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {cpTipo === 'factura' ? (
                  <>
                    <label className="mb-1 block text-xs font-medium text-slate-400">{c.cpRucLabel}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={cpDoc}
                      onChange={(e) => setCpDoc(e.target.value.replace(/\D/g, ''))}
                      placeholder={c.cpRucPlaceholder}
                      className={`mb-2.5 w-full rounded-lg border bg-ink-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                        cpCampoError === 'doc' ? 'border-rose-500/60' : 'border-white/15 focus:border-brand-500'
                      }`}
                    />
                    <label className="mb-1 block text-xs font-medium text-slate-400">{c.cpRazonLabel}</label>
                    <input
                      type="text"
                      value={cpRazon}
                      onChange={(e) => setCpRazon(e.target.value)}
                      placeholder={c.cpRazonPlaceholder}
                      className={`w-full rounded-lg border bg-ink-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                        cpCampoError === 'razonSocial' ? 'border-rose-500/60' : 'border-white/15 focus:border-brand-500'
                      }`}
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{c.cpHintFactura}</p>
                  </>
                ) : (
                  <>
                    <label className="mb-1 block text-xs font-medium text-slate-400">
                      {/* Por debajo del umbral el DNI es opcional; a partir de
                          S/700 SUNAT exige identificar al comprador. */}
                      {price >= UMBRAL_DNI_BOLETA ? c.cpDniRequiredLabel : c.cpDniLabel}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={cpDoc}
                      onChange={(e) => setCpDoc(e.target.value.replace(/\D/g, ''))}
                      placeholder={c.cpDniPlaceholder}
                      className={`w-full rounded-lg border bg-ink-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                        cpCampoError === 'doc' ? 'border-rose-500/60' : 'border-white/15 focus:border-brand-500'
                      }`}
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                      {price >= UMBRAL_DNI_BOLETA ? c.cpHintBoletaReq : c.cpHintBoleta}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Email */}
            <label className="mb-1.5 block text-sm font-medium text-slate-300">{c.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.emailPlaceholder}
              className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {error && <p className="mt-2 text-sm text-rose-400">✗ {error}</p>}

            {intl ? (
              /* Internacional: Lemon Squeezy como botón principal */
              <>
                <button
                  onClick={handlePayIntl}
                  disabled={processing}
                  className="mt-4 w-full rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-white transition-colors hover:bg-brand-400 disabled:opacity-60"
                >
                  {processing ? c.processing : c.intlPayBtn.replace('{price}', usdTexto)}
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">{c.intlSecure}</p>
              </>
            ) : (
              /* Método Perú: Culqi (el selector de arriba permite cambiar a internacional) */
              <>
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="mt-4 w-full rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-white transition-colors hover:bg-brand-400 disabled:opacity-60"
                >
                  {processing
                    ? c.processing
                    : isSub
                      ? c.subscribeBtn.replace('{price}', price)
                      : c.payBtn.replace('{price}', price)}
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">{c.secureNote}</p>
              </>
            )}
          </div>
      </div>
    </div>
  );
}
