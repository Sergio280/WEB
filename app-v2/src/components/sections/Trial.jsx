import { useMemo, useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Medidor de fortaleza — réplica exacta de passwordStrength() de la home.
// Devuelve score y color; la etiqueta se resuelve con el idioma activo.
function passwordStrength(pw) {
  if (!pw) return { score: 0, color: '#dc2626' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  score = Math.min(score, 4);
  const colors = ['#dc2626', '#dc2626', '#f59e0b', '#1a8a4a', '#0c5c2f'];
  return { score, color: colors[score] };
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Trial() {
  const { t } = useLang();
  const tr = t.trial;
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
      setFeedback({ type: 'err', msg: tr.errEmail });
      return;
    }
    if (password.length < 8) {
      setFeedback({ type: 'err', msg: tr.errPwLen });
      return;
    }
    if (password !== password2) {
      setFeedback({ type: 'err', msg: tr.errPwMatch });
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
        track('trial_signup', { method: 'web_form' });
        track('trial_activated', { method: 'web_form' });
        window.location.href = tr.successUrl + '?email=' + encodeURIComponent(email.trim());
      } else {
        setFeedback({ type: 'err', msg: '✗ ' + (data.error || tr.errGeneric) });
        setSubmitting(false);
      }
    } catch {
      setFeedback({ type: 'err', msg: tr.errConn });
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
          <span className="eyebrow">{tr.eyebrow}</span>
          <h2 className="section-title mt-4">{tr.title}</h2>
          <p className="mt-4 text-slate-400">{tr.desc}</p>
          <ul className="mt-6 space-y-3">
            {tr.features.map((f) => (
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
            <h3 className="font-display text-xl font-bold text-white">{tr.formTitle}</h3>
            <p className="mt-1 text-sm text-slate-400">{tr.formSub}</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">{tr.emailLabel}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr.emailPlaceholder} autoComplete="email" className={inputCls} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">{tr.nameLabel}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr.namePlaceholder} autoComplete="name" maxLength={80} className={inputCls} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">{tr.companyLabel}</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={tr.companyPlaceholder} maxLength={120} className={inputCls} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {tr.pwLabel} <span className="font-normal text-slate-500">{tr.pwHint}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw1 ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tr.pwPlaceholder}
                    autoComplete="new-password"
                    className={`${inputCls} pr-16`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw1((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-brand-300">
                    {showPw1 ? tr.hide : tr.show}
                  </button>
                </div>
                {/* Barra de fortaleza */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full transition-all" style={{ width: `${strength.score * 25}%`, background: strength.color }} />
                </div>
                {password && <p className="mt-1 text-xs font-semibold" style={{ color: strength.color }}>{tr.strength[strength.score]}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">{tr.pw2Label}</label>
                <div className="relative">
                  <input
                    type={showPw2 ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder={tr.pw2Placeholder}
                    autoComplete="new-password"
                    className={`${inputCls} pr-16`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw2((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-brand-300">
                    {showPw2 ? tr.hide : tr.show}
                  </button>
                </div>
                {match === true && <p className="mt-1 text-xs font-semibold text-accent-green">{tr.pwMatch}</p>}
                {match === false && <p className="mt-1 text-xs font-semibold text-rose-400">{tr.pwNoMatch}</p>}
              </div>

              {/* Honeypot — invisible para humanos */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
                <label htmlFor="trial-website">{tr.honeypotLabel}</label>
                <input id="trial-website" name="honeypot" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-white transition-colors hover:bg-brand-400 disabled:opacity-60">
                {submitting ? tr.submitting : tr.submit}
              </button>

              {feedback && (
                <div className={`rounded-lg px-4 py-3 text-sm ${feedback.type === 'err' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                  {feedback.msg}
                </div>
              )}

              <p className="text-xs leading-relaxed text-slate-500">
                {tr.termsPre}
                <a href={tr.termsHref} className="text-brand-300 hover:underline">{tr.termsLink}</a>{tr.termsMid}
                <a href={tr.privacyHref} className="text-brand-300 hover:underline">{tr.privacyLink}</a>{tr.termsPost}
              </p>
            </div>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}
