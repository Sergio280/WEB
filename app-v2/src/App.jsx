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
        <Metrics />
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
