import { Component } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Frontera de error.
//
// Sin una de estas, CUALQUIER excepción durante el render desmonta el árbol
// entero: React vacía #root y el visitante se queda con una página EN BLANCO,
// sin portada, sin precios y sin formulario de prueba. No es hipotético — la
// sección de métricas carga sus gráficas con `import()` diferido y ese import
// falla de verdad en dos situaciones corrientes:
//
//   · Despliegue mientras alguien tiene la web abierta: el HTML viejo pide
//     /assets/MetricsCharts-<hash>.js, que ya no existe → 404 →
//     "Failed to fetch dynamically imported module".
//   · Red móvil que corta la petición del trozo a mitad.
//
// Con esta frontera el fallo queda ACOTADO a la sección que lo provocó; el
// resto de la landing (y el checkout) siguen funcionando.
// ─────────────────────────────────────────────────────────────────────────────
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    // Se manda a la analítica para poder ver cuántas visitas lo sufren: en
    // consola no lo ve nadie. Nunca se deja que un fallo de analítica agrave
    // un fallo de render.
    try {
      if (typeof window.clarity === 'function') {
        window.clarity('event', 'render_error');
        window.clarity('set', 'render_error_msg', String(error && error.message).slice(0, 120));
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'render_error', { descripcion: String(error && error.message).slice(0, 120) });
      }
    } catch {
      /* sin analítica se sigue igual */
    }
  }

  render() {
    if (this.state.fallo) return this.props.fallback ?? null;
    return this.props.children;
  }
}
