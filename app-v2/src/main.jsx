import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageProvider.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import './index.css';
import { captureGclid } from './lib/gclid.js';

// Último recurso: si algo revienta en el render y no lo atrapa ninguna frontera
// más cercana, React vacía #root y el visitante ve una página EN BLANCO sin
// ninguna pista de qué hacer. Al menos se le dice que recargue — la mayoría de
// estos fallos (un trozo del bundle que ya no existe tras un despliegue) se
// arreglan solos al recargar. El texto va en los dos idiomas porque a estas
// alturas el proveedor de idioma puede ser justamente lo que ha fallado.
const PaginaCaida = (
  <div style={{ maxWidth: '32rem', margin: '4rem auto', padding: '0 1.25rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#cbd5e1' }}>
    <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
      No pudimos cargar la página · We couldn’t load the page
    </p>
    <p style={{ marginTop: '.75rem', fontSize: '.9rem' }}>
      Vuelve a cargarla para reintentar. Si sigue fallando, escríbenos a soporte@bimsaddin.com.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{ marginTop: '1.25rem', borderRadius: '999px', border: 0, background: '#2d7dff', color: '#fff', padding: '.7rem 1.6rem', fontWeight: 700, cursor: 'pointer' }}
    >
      Recargar · Reload
    </button>
  </div>
);

// Captura el gclid del anuncio apenas carga la app (antes de que el usuario
// navegue). Se lee al enviar el formulario de trial.
captureGclid();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary fallback={PaginaCaida}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
