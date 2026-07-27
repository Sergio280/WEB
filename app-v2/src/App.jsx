import { lazy, Suspense } from 'react';
import { useCulqi } from './hooks/useCulqi.js';
import AnnounceBar from './components/sections/AnnounceBar.jsx';
import Navbar from './components/sections/Navbar.jsx';
import Hero from './components/sections/Hero.jsx';
import MarqueeStrip from './components/sections/MarqueeStrip.jsx';
import VideoDemo from './components/sections/VideoDemo.jsx';
import Clips from './components/sections/Clips.jsx';
import Bento from './components/sections/Bento.jsx';
import UseCases from './components/sections/UseCases.jsx';
import MidCta from './components/sections/MidCta.jsx';
import RoiCalculator from './components/sections/RoiCalculator.jsx';
import Pricing from './components/sections/Pricing.jsx';
import Trial from './components/sections/Trial.jsx';
import Testimonials from './components/sections/Testimonials.jsx';
import Faq from './components/sections/Faq.jsx';
import Download from './components/sections/Download.jsx';
import Footer from './components/sections/Footer.jsx';
import BackToTop from './components/ui/BackToTop.jsx';

// Metrics arrastra Chart.js + react-chartjs-2 (~200 KB sin comprimir), que era
// casi el 35 % del bundle inicial — para tres gráficos que están a ~60 % del
// scroll. Cargándolo aparte, la primera pintura no lo espera y en la práctica
// llega mucho antes de que nadie baje hasta ahí.
const Metrics = lazy(() => import('./components/sections/Metrics.jsx'));

// Reserva de altura mientras carga el chunk, para que el contenido de debajo no
// dé un salto cuando la sección aparece (CLS).
//
// Las alturas son las MEDIDAS de la sección ya renderizada en cada breakpoint
// (los gráficos se apilan en móvil, por eso crece al estrecharse):
//   ≥1024px 1256px · 768px 1642px · 640px 1674px · 390px 1890px
// Una reserva a ojo de 40rem desplazaba 616px todo lo que hay debajo —
// precios, prueba y pie— justo el salto que este hueco debe evitar.
//
// Lleva el id="efectividad" porque el enlace del navbar apunta ahí: sin él,
// pulsarlo antes de que cargue el chunk no llevaría a ninguna parte.
function MetricsFallback() {
  return (
    <div
      id="efectividad"
      aria-hidden="true"
      className="min-h-[118rem] sm:min-h-[105rem] md:min-h-[103rem] lg:min-h-[79rem]"
    />
  );
}

export default function App() {
  // Registra el callback global window.culqi para el checkout de pagos.
  useCulqi();

  return (
    <>
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
        <Suspense fallback={<MetricsFallback />}>
          <Metrics />
        </Suspense>
        <RoiCalculator />
        <Trial />
        <Pricing />
        <Testimonials />
        <Faq />
        <Download />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
