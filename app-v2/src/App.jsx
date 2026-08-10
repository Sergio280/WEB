import { useEffect } from 'react';
import { useCulqi } from './hooks/useCulqi.js';
import { useLang } from './i18n/LanguageProvider.jsx';
import LangBanner from './components/sections/LangBanner.jsx';
import AnnounceBar from './components/sections/AnnounceBar.jsx';
import Navbar from './components/sections/Navbar.jsx';
import Hero from './components/sections/Hero.jsx';
import MarqueeStrip from './components/sections/MarqueeStrip.jsx';
import VideoDemo from './components/sections/VideoDemo.jsx';
import Clips from './components/sections/Clips.jsx';
import Bento from './components/sections/Bento.jsx';
import UseCases from './components/sections/UseCases.jsx';
import MidCta from './components/sections/MidCta.jsx';
import Metrics from './components/sections/Metrics.jsx';
import RoiCalculator from './components/sections/RoiCalculator.jsx';
import Pricing from './components/sections/Pricing.jsx';
import Trial from './components/sections/Trial.jsx';
import Testimonials from './components/sections/Testimonials.jsx';
import Faq from './components/sections/Faq.jsx';
import Download from './components/sections/Download.jsx';
import Footer from './components/sections/Footer.jsx';
import BackToTop from './components/ui/BackToTop.jsx';

export default function App() {
  const { t } = useLang();

  // Registra el callback global window.culqi para el checkout de pagos.
  useCulqi();

  // Lleva al ancla cuando se llega desde fuera con una URL tipo
  // bimsaddin.com/#precios.
  //
  // El navegador lo intenta al cargar el documento, pero en ese momento #root
  // está vacío: React aún no ha pintado las secciones, así que no existe ningún
  // elemento con ese id y la página se queda arriba. Afecta a CUALQUIER enlace
  // con ancla que venga de fuera (un correo, la ficha del App Store, un
  // anuncio), no solo a los de promoción.
  //
  // No basta con hacer scroll una vez en cuanto aparece la sección: las de
  // arriba se montan y crecen después (imágenes, iframes, gráficas diferidas) y
  // empujan el destino hacia abajo, dejándote a mitad de camino. Medido: con un
  // solo intento la página paraba en 996 px cuando la sección acababa en 8738.
  //
  // Por eso se reposiciona de forma continuada hasta que la posición del
  // objetivo deja de moverse, con un tope de tiempo por si nunca se estabiliza.
  useEffect(() => {
    const id = decodeURIComponent((window.location.hash || '').slice(1));
    if (!id) return;

    // Se reacciona a que el documento CAMBIE DE TAMAÑO en vez de sondear por
    // reloj: así da igual cuánto tarden las imágenes o las gráficas: cada vez
    // que algo crece se recoloca. Un temporizador fijo siempre se queda corto o
    // largo según la conexión.
    let cancelado = false;
    let ro = null;

    const recolocar = () => {
      if (cancelado) return;
      const el = document.getElementById(id);
      if (!el) return;
      window.scrollTo({ top: Math.round(el.getBoundingClientRect().top + window.scrollY), behavior: 'auto' });
    };

    // Si el visitante hace scroll por su cuenta, se le deja en paz: seguir
    // moviéndole la página sería exasperante.
    const abortar = () => {
      cancelado = true;
      if (ro) ro.disconnect();
    };
    window.addEventListener('wheel', abortar, { passive: true, once: true });
    window.addEventListener('touchstart', abortar, { passive: true, once: true });
    window.addEventListener('keydown', abortar, { once: true });

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recolocar);
      ro.observe(document.documentElement);
    }

    // Sondeo de apoyo para el arranque, mientras la sección todavía no existe
    // (el observador no dispara si el tamaño no cambia) y para navegadores sin
    // ResizeObserver.
    let intentos = 0;
    const t = setInterval(() => {
      if (cancelado || ++intentos > 30) { clearInterval(t); return; }
      recolocar();
    }, 100);

    // Se deja de perseguir el ancla a los 6 s: a partir de ahí, cualquier
    // cambio de alto es cosa del usuario navegando, no de la carga.
    const fin = setTimeout(abortar, 6000);

    return () => {
      cancelado = true;
      clearInterval(t);
      clearTimeout(fin);
      if (ro) ro.disconnect();
      window.removeEventListener('wheel', abortar);
      window.removeEventListener('touchstart', abortar);
      window.removeEventListener('keydown', abortar);
    };
  }, []);

  return (
    <>
      {/* Primer elemento enfocable de la página: solo aparece al llegar con
          Tab, y salta la barra de navegación entera. Con quince secciones y
          una barra fija, sin esto hay que recorrer todos los enlaces del menú
          antes de alcanzar el contenido. */}
      <a
        href="#inicio"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2.5 focus:font-bold focus:text-white"
      >
        {t.saltarAlContenido}
      </a>

      {/* Ofrece el otro idioma a quien llega desde un país donde no se habla
          el de esta página. Va lo primero de todo: si no se ve, no sirve. */}
      <LangBanner />
      <AnnounceBar />
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <VideoDemo />
        <Clips />
        <Bento />
        <UseCases />
        <MidCta />
        <Metrics />
        <RoiCalculator />
        <Trial />
        {/* Las reseñas van ANTES de los precios, no después: la prueba social
            hace su trabajo justo antes de pedir la decisión. Detrás de Precios
            solo la leía quien ya se había decidido. */}
        <Testimonials />
        <Pricing />
        <Faq />
        <Download />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
