// Contenedor de sección con ancho máximo y padding consistente.
export default function Section({ id, className = '', children, container = true }) {
  return (
    <section id={id} className={`relative py-16 sm:py-24 ${className}`}>
      {container ? <div className="mx-auto w-full max-w-6xl px-5">{children}</div> : children}
    </section>
  );
}
