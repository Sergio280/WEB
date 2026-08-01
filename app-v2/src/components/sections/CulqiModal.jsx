import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CULQI_CONFIG } from '../../data/culqi.js';
import { PRECIOS_USD, equivalenteMensual, ahorroPct } from '../../data/pricing.js';
import { validarComprobante, normalizarComprobante, UMBRAL_DNI_BOLETA } from '../../lib/comprobante.js';
import { leerPromo, consultarPromo } from '../../lib/promo.js';
import { openCulqiCheckout } from '../../hooks/useCulqi.js';
import { openLsCheckout } from '../../lib/lemonsqueezy.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modal de compra: replica el flujo del modal de pago Culqi de la home.
// Los precios y URLs de checkout viven en CULQI_CONFIG; el texto, en el idioma
// activo (t.culqiModal).
export default function CulqiModal({ planKey, onClose }) {
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

  // Precios en USD: viven en data/pricing.js junto con los de soles, para que
  // no haya dos tablas de precios en el frontend.
  const [intlDuration, setIntlDuration] = useState('monthly'); // 'monthly' | 'yearly'
  const usdPrice = (PRECIOS_USD[planKey] || PRECIOS_USD.individual)[intlDuration];

  const [paymentType, setPaymentType] = useState('onetime'); // 'onetime' | 'subscription'
  const [duration, setDuration] = useState('1m');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

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
    setProcessing(true);
    track('begin_checkout', {
      plan: planKey,
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
      onProcessing: () => setProcessing(true),
      onError: (msg) => {
        setProcessing(false);
        setError(msg);
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
    setProcessing(true);
    // En modo internacional (inglés) usamos el toggle Mensual/Anual; en español
    // (botón secundario) mapeamos la selección Culqi: 12m → anual, resto → mensual.
    const lsDuration = intl ? intlDuration : isSub ? 'monthly' : duration === '12m' ? 'yearly' : 'monthly';
    track('begin_checkout', { plan: planKey, gateway: 'lemonsqueezy', duration: lsDuration, currency: 'USD' });
    try {
      openLsCheckout({ plan: planKey, duration: lsDuration, email: email.trim() });
    } catch (e) {
      setProcessing(false);
      setError(e.message || 'Error al iniciar el pago internacional.');
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
        <motion.div
          className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-glow-lg"
          style={{ maxHeight: 'calc(100dvh - 2rem)' }}
          initial={{ scale: 0.94, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 16 }}
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
                    onClick={() => setMethod('culqi')}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      !intl ? 'bg-brand-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    {c.methodCulqi}
                  </button>
                  <button
                    onClick={() => setMethod('intl')}
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
                  <span className="font-display text-4xl font-extrabold text-white">${usdPrice}</span>
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
                  {processing ? c.processing : c.intlPayBtn.replace('{price}', usdPrice)}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
