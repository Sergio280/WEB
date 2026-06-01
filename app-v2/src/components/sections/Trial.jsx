import { useMemo, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';

// Medidor de fortaleza — réplica exacta de passwordStrength() de la home.
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#dc2626' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  score = Math.min(score, 4);
  const colors = ['#dc2626', '#dc2626', '#f59e0b', '#1a8a4a', '#0c5c2f'];
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];
  return { score, label: labels[score], color: colors[score] };
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  'Todos los paneles desbloqueados (General · Estructuras · Geometría)',
  'Compatible con Revit 2024, 2025 y 2026',
  '1 equipo · Activación automática por email',
  'Si te convence, conservas tu cuenta al comprar',
];

export default function Trial() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, msg }
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const match = password2 ? password === password2 : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!emailRe.test(email.trim())) {
      setFeedback({ type: 'err', msg: '✗ Por favor ingresa un email válido.' });
      return;
    }
    if (password.length < 8) {
      setFeedback({ type: 'err', msg: '✗ La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== password2) {
      setFeedback({ type: 'err', msg: '✗ Las contraseñas no coinciden.' });
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), company: company.trim(), password, honeypot }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        if (typeof window.gtag === 'function') window.gtag('event', 'trial_signup', { method: 'web_form' });
        if (typeof window.clarity === 'function') window.clarity('event', 'trial_signup');
        window.location.href = '/trial-success.html?email=' + encodeURIComponent(email.trim());
      } else {
        setFeedback({ type: 'err', msg: '✗ ' + (data.error || 'Hubo un error. Intenta de nuevo o escríbenos a bimsaddin@gmail.com') });
        setSubmitting(false);
      }
    } catch {
      setFeedback({ type: 'err', msg: '✗ Error de conexión. Verifica tu internet e intenta de nuevo.' });
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-white/15 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

  return (
    <Section id="trial">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* Izquierda */}
        <Reveal>
          <span className="eyebrow">14 días gratis</span>
          <h2 className="section-title mt-4">Prueba BIMS gratis durante 14 días</h2>
          <p className="mt-4 text-slate-400">
            Sin tarjeta. Sin compromiso. Activa los 30+ comandos en tu proyecto real y comprueba cuánto tiempo recuperas
            antes de pagar.
          </p>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-slate-300">
                <span className="mt-0.5 text-accent-green">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Formulario */}
        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} autoComplete="on" noValidate className="rounded-2xl border border-white/10 glass p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-white">Crea tu cuenta de trial</h3>
            <p className="mt-1 text-sm text-slate-400">
              Listo en 30 segundos. Sin email de verificación — tu cuenta queda activa al instante.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Email profesional *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tunombre@empresa.com" autoComplete="email" className={inputCls} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" maxLength={80} className={inputCls} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Empresa / Estudio (opcional)</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Constructora, estudio de ingeniería, freelance…" maxLength={120} className={inputCls} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Contraseña * <span className="font-normal text-slate-500">(mínimo 8 caracteres)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw1 ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={`${inputCls} pr-16`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw1((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-brand-300">
                    {showPw1 ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                {/* Barra de fortaleza */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full transition-all" style={{ width: `${strength.score * 25}%`, background: strength.color }} />
                </div>
                {password && <p className="mt-1 text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Confirma contraseña *</label>
                <div className="relative">
                  <input
                    type={showPw2 ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    className={`${inputCls} pr-16`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw2((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-brand-300">
                    {showPw2 ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                {match === true && <p className="mt-1 text-xs font-semibold text-accent-green">✓ Las contraseñas coinciden</p>}
                {match === false && <p className="mt-1 text-xs font-semibold text-rose-400">✗ Las contraseñas no coinciden</p>}
              </div>

              {/* Honeypot — invisible para humanos */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
                <label htmlFor="trial-website">Website (déjalo vacío)</label>
                <input id="trial-website" name="honeypot" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-white transition-colors hover:bg-brand-400 disabled:opacity-60">
                {submitting ? 'Procesando…' : '🎁 Activar mi trial de 14 días'}
              </button>

              {feedback && (
                <div className={`rounded-lg px-4 py-3 text-sm ${feedback.type === 'err' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                  {feedback.msg}
                </div>
              )}

              <p className="text-xs leading-relaxed text-slate-500">
                Al continuar aceptas nuestros{' '}
                <a href="/terminos.html" className="text-brand-300 hover:underline">términos</a> y{' '}
                <a href="/privacy-policy.html" className="text-brand-300 hover:underline">política de privacidad</a>. Tu
                email se usa solo para avisos de tu licencia.
              </p>
            </div>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}
