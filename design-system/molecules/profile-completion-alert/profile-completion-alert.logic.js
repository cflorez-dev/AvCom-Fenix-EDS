/**
 * Lógica PURA del donut de completitud (1279361, D35). Sin DOM → testeable.
 *
 * Torta 3 colores (D35, umbrales configurables por CF):
 *  - rojo   `percent < warning`               → var(--alert-error-icon-bg)
 *  - naranja `warning <= percent < positive`  → var(--text-accent-warning)
 *  - verde  `percent >= positive`             → var(--icon-accent-positive)
 *
 * ⚠️ PENDIENTE-DISEÑO (D35): el Figma NO trae la variante roja; se DERIVA del
 * layout naranja con el token de error. Pedir la variante oficial a diseño.
 */

export const DEFAULT_WARNING = 50;
export const DEFAULT_POSITIVE = 80;

/**
 * Banda de color del donut según el porcentaje y los umbrales.
 * @param {number} percent 0–100
 * @param {number} [warning]
 * @param {number} [positive]
 * @returns {('error'|'warning'|'positive')}
 */
export const donutBand = (percent, warning = DEFAULT_WARNING, positive = DEFAULT_POSITIVE) => {
  const p = Number(percent) || 0;
  if (p < warning) return 'error';
  if (p < positive) return 'warning';
  return 'positive';
};

/** Token de color por banda. */
export const donutColor = (band) => {
  switch (band) {
    case 'positive': return 'var(--icon-accent-positive)';
    case 'warning': return 'var(--text-accent-warning)';
    case 'error':
    default: return 'var(--alert-error-icon-bg)';
  }
};

/**
 * `stroke-dasharray`/`stroke-dashoffset` del arco del donut para un radio dado.
 * @param {number} percent 0–100
 * @param {number} radius
 * @returns {{ circumference:number, dashOffset:number }}
 */
export const donutArc = (percent, radius) => {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  return { circumference, dashOffset: circumference * (1 - clamped / 100) };
};
