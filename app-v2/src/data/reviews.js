// ─────────────────────────────────────────────────────────────────────────────
// Reseñas del Autodesk App Store.
//
// FUENTE: la ficha oficial de BIMS en el App Store. Es la ÚNICA fuente que se
// publica aquí — reseñas que cualquiera puede ir a comprobar por su cuenta, con
// el nombre de quien las escribió y su fecha. Nada de testimonios recogidos por
// privado ni reescritos: la sección entera se sostiene sobre que el visitante
// pueda verificarlas, y por eso cada tarjeta enlaza a la ficha.
//
// SE COPIAN A MANO. Autodesk no expone una API pública de reseñas, así que este
// archivo hay que actualizarlo al recibir una nueva: añadir la entrada, subir
// `RESUMEN.total` y recolocar el reparto por estrellas. Los datos estructurados
// (aggregateRating en index.html y en/index.html) llevan los MISMOS números; si
// se tocan aquí, tocarlos allí — declarar una media que no cuadra con lo que se
// enseña es justo lo que Google penaliza.
//
// ⚠️ EL TEXTO NO SE TRADUCE. Cada reseña se muestra tal como su autor la
// escribió, en los dos idiomas del sitio. Traducir el testimonio de una persona
// real es ponerle palabras en la boca; se traduce la etiqueta de alrededor, no
// lo que dijo.
// ─────────────────────────────────────────────────────────────────────────────

export const RESUMEN = {
  media: 5.0,
  total: 2,
  // Reseñas por número de estrellas, de 5 a 1.
  reparto: { 5: 2, 4: 0, 3: 0, 2: 0, 1: 0 },
};

export const REVIEWS = [
  {
    id: 'cesar-urbina',
    autor: 'Cesar Urbina',
    fecha: '2026-08-10',
    estrellas: 5,
    titulo: 'Una muy buena herramienta',
    texto: 'Un addins que me ayudo mucho en el inicio y me sigue ayudando en el desarrollo de mis proyectos.',
  },
  {
    id: 'franco-lescano',
    autor: 'Franco Lescano Campos',
    fecha: '2026-08-01',
    estrellas: 5,
    titulo: 'Excellent add-in',
    texto: 'Excellent add-in',
  },
];
