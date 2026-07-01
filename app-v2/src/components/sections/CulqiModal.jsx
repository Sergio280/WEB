import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CULQI_CONFIG } from '../../data/culqi.js';
import { openCulqiCheckout } from '../../hooks/useCulqi.js';
import { openLsCheckout } from '../../lib/lemonsqueezy.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modal de compra: replica el flujo del modal de pago Culqi de la home.
// Los precios y URLs de checkout viven en CULQI_CONFIG; el texto, en el idioma
// activo (t.culqiModal).
export default function CulqiModal({ planKey, onClose }) {
  const { t, lang } = useLang();
  const c = t.culqiModal;
  const plan = CULQI_CONFIG.plans[planKey]; // precios + checkout
  const tp = c.plans[planKey]; // texto: features, periods, savings
  const badge = t.pricing.catalog[planKey].badge;

  // Ambos métodos de pago SIEMPRE disponibles (nadie queda bloqueado):
  //   - 'culqi': tarjetas peruanas en soles (solo Perú).
  //   - 'intl' : tarjetas internacionales en USD vía Lemon Squeezy.
  // El default depende del idioma (español → Culqi, inglés → internacional),
  // pero el usuario puede cambiar con el selector de arriba.
  const lsSupported = planKey === 'individual' || planKey === 'profesional';
  const [method, setMethod] = useState(lang === 'en' && lsSupported ? 'intl' : 'culqi');
  const intl = method === 'intl';

  const USD = {
    individual:  { monthly: '16.90', yearly: '159' },
    profesional: { monthly: '26.90', yearly: '269' },
  };
  const [intlDuration, setIntlDuration] = useState('monthly'); // 'monthly' | 'yearly'
  const usdPrice = (USD[planKey] || USD.individual)[intlDuration];

  const [paymentType, setPaymentType] = useState('onetime'); // 'onetime' | 'subscription'
  const [duration, setDuration] = useState('1m');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

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
  const price = isSub ? plan.subscription.price : plan[duration].price;
  const savingsNote = isSub ? '' : tp.savings[duration];

  const periodText = useMemo(
    () => (isSub ? c.subPeriod.replace('{price}', price) : tp.periods[duration]),
    [isSub, price, duration, c, tp]
  );

  function handlePay() {
    if (!emailRe.test(email.trim())) {
      setError(c.emailError);
      return;
    }
    setError('');
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
        <motion.div
          className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-glow-lg"
          initial={{ scale: 0.94, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 16 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-300">{badge}</span>
            <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-white" aria-label={c.closeAria}>
              ×
            </button>
          </div>

          <div className="px-6 py-5">
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

                {/* Precio */}
                <div className="mb-1 text-center">
                  <span className="font-display text-4xl font-extrabold text-white">S/{price}</span>
                </div>
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
