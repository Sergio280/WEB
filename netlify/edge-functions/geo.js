// ─────────────────────────────────────────────────────────────────────────────
// geo.js — Edge function de Netlify que devuelve el país del visitante.
//
// Netlify resuelve la geolocalización por IP en el edge (sin llamadas externas)
// y la expone en `context.geo`. La landing la consume en /api/geo para decidir
// el idioma inicial (español para países hispanohablantes, inglés para el resto).
// No se exponen datos sensibles: solo el código de país ISO-3166 alpha-2.
// La ruta se configura en netlify.toml ([[edge_functions]] path="/api/geo").
// ─────────────────────────────────────────────────────────────────────────────
export default async (_request, context) => {
  const country = context?.geo?.country?.code || '';
  return new Response(JSON.stringify({ country }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // No cachear: la geo depende del visitante y debe resolverse por petición.
      'cache-control': 'no-store',
    },
  });
};
