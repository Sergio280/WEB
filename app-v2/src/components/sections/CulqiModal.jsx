import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CULQI_CONFIG } from '../../data/culqi.js';
import { openCulqiCheckout } from '../../hooks/useCulqi.js';
import { track } from '../../lib/track.js';

const DURATIONS = [
  { key: '1m', label: '1 mes' },
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: '12m', label: '1 año' },
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modal de compra: replica el flujo del modal MercadoPago/Culqi de la home.
export default function CulqiModal({ planKey, onClose }) {
  const plan = CULQI_CONFIG.plans[planKey];
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
  const item = isSub ? plan.subscription : plan[duration];

  const periodText = useMemo(
    () => (isSub ? '1er mes gratis · luego S/' + item.price + '/mes' : item.period),
    [isSub, item]
  );

  function handlePay() {
    if (!emailRe.test(email.trim())) {
      setError('Ingresa un email válido.');
      return;
    }
    setError('');
    setProcessing(true);
    track('begin_checkout', {
      plan: planKey,
      payment_type: isSub ? 'subscription' : 'onetime',
      duration: isSub ? 'sub' : duration,
      value: item.price,
      currency: 'PEN',
    });
    openCulqiCheckout({
      planKey,
      duration,
      isSub,
      email: email.trim(),
      onProcessing: () => setProcessing(true),
      onError: (msg) => {
        setProcessing(false);
        setError(msg);
      },
    });
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
            <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-300">{plan.badge}</span>
            <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-white" aria-label="Cerrar">
              ×
            </button>
          </div>

          <div className="px-6 py-5">
            {/* Tipo de pago */}
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-ink-900 p-1">
              <button
                onClick={() => setPaymentType('onetime')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  !isSub ? 'bg-brand-500 text-white' : 'text-slate-400'
                }`}
              >
                Pago único
              </button>
              <button
                onClick={() => setPaymentType('subscription')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isSub ? 'bg-brand-500 text-white' : 'text-slate-400'
                }`}
              >
                Suscripción mensual
              </button>
            </div>

            {/* Duración (solo pago único) */}
            {!isSub && (
              <div className="mb-5 grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
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
              <span className="font-display text-4xl font-extrabold text-white">S/{item.price}</span>
            </div>
            <p className="mb-2 text-center text-sm text-slate-400">{periodText}</p>
            {item.savingsNote && (
              <p className="mb-4 text-center text-xs font-semibold text-accent-green">{item.savingsNote}</p>
            )}

            {/* Features */}
            <ul className="mb-5 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-accent-green">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Email */}
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email para recibir tu clave</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tunombre@empresa.com"
              className="w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {error && <p className="mt-2 text-sm text-rose-400">✗ {error}</p>}

            <button
              onClick={handlePay}
              disabled={processing}
              className="mt-4 w-full rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-white transition-colors hover:bg-brand-400 disabled:opacity-60"
            >
              {processing ? 'Procesando…' : isSub ? `Suscribirme — S/${item.price}/mes` : `Pagar S/${item.price} con tarjeta`}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">Pago seguro con Culqi · Recibes tu clave por email</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
