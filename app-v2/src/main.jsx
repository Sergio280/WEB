import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { captureGclid } from './lib/gclid.js';

// Captura el gclid del anuncio apenas carga la app (antes de que el usuario
// navegue). Se lee al enviar el formulario de trial.
captureGclid();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
