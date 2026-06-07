import { useEffect, useState } from 'react';
import { useLang } from '../../i18n/LanguageProvider.jsx';

export default function BackToTop() {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title={t.backToTop}
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-glow transition-transform hover:-translate-y-1"
    >
      ↑
    </button>
  );
}
