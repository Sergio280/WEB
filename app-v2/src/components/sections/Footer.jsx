import { EMAIL, WHATSAPP_URL } from '../../data/nav.js';

export default function Footer() {
  return (
    <footer id="contacto" className="border-t border-white/10 bg-ink-900/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="flex items-center gap-2.5 font-display text-lg font-extrabold text-white">
            <img src="/icono/favicon-32.png" alt="BIMS" className="h-6 w-6 rounded" />
            BIMS
          </div>
          <p className="mt-3 text-sm text-slate-400">Plugin profesional para Autodesk Revit</p>
          <p className="mt-1 text-sm text-slate-500">Versión 1.1.2</p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">Producto</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#features" className="text-slate-400 hover:text-white">Capacidades</a></li>
            <li><a href="#casos" className="text-slate-400 hover:text-white">Casos de uso</a></li>
            <li><a href="#efectividad" className="text-slate-400 hover:text-white">Resultados</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">Precios</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#precios" className="text-slate-400 hover:text-white">Desde S/60/mes</a></li>
            <li><a href="#precios" className="text-slate-400 hover:text-white">Plan Profesional</a></li>
            <li><a href={`mailto:${EMAIL}?subject=BIMS%20Licencia%20Empresa`} className="text-slate-400 hover:text-white">Empresa — Consultar</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="/privacy-policy.html" className="text-slate-400 hover:text-white">Política de Privacidad</a></li>
            <li><a href="/terminos.html" className="text-slate-400 hover:text-white">Términos y Condiciones</a></li>
            <li><a href="/libro-reclamaciones.html" className="text-slate-400 hover:text-white">Libro de Reclamaciones</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">Contacto</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="text-slate-400">📧 {EMAIL}</li>
            <li>
              📱{' '}
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-slate-400 underline hover:text-white">
                +51 989 455 558
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        <p>© 2026 BIMS. Todos los derechos reservados.</p>
        <p className="mt-1">Autodesk y Revit son marcas registradas de Autodesk, Inc.</p>
      </div>
    </footer>
  );
}
