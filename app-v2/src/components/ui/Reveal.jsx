import { useEffect, useRef, useState } from 'react';

// Aparición al entrar en pantalla (fundido + desplazamiento), con retardo
// opcional para escalonar tarjetas hermanas.
//
// Lo hacía framer-motion. Es el componente más repetido de la web —está en casi
// todas las secciones—, así que era el que ataba la librería entera al bundle
// principal por un fundido de 28 píxeles. El recorrido vive ahora en CSS
// (.reveal / .is-in, en index.css) y aquí solo queda decidir CUÁNDO encenderlo.
//
// `once`: se desconecta el observador al primer cruce, igual que hacía el
// viewport={{ once: true }} anterior. Volver a subir no vuelve a animar.
export default function Reveal({ children, delay = 0, y = 28, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sin IntersectionObserver (navegadores muy viejos) se enseña sin más:
    // mejor contenido visible que contenido invisible para siempre.
    if (typeof IntersectionObserver === 'undefined') {
      setDentro(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDentro(true);
          io.disconnect();
        }
      },
      // Equivale al viewport={{ margin: '-80px' }} de antes: el elemento tiene
      // que haber entrado 80 px, no basta con asomar.
      { rootMargin: '-80px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${dentro ? 'is-in' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}s`, '--reveal-y': `${y}px` }}
    >
      {children}
    </Tag>
  );
}
