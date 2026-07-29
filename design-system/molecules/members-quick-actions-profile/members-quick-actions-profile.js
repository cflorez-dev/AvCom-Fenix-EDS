import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersQuickAction } from '../../atoms/members-quick-action/members-quick-action.js';

const html = htm.bind(h);

/**
 * MembersQuickActionsProfile — fila de quick actions del Dashboard / página de
 * perfil (`/members/profile`). Misma anatomía visual que `MembersQuickActions`
 * (átomo `MembersQuickAction`: ícono circular oscuro + label + link), pero con
 * fuente de datos propia: el CF "Quick Actions Profile" (NO `cfg.hero.quickActions`).
 * Esto permite que el equipo de Dashboard cure su propia botonera —íconos,
 * orden, copy, URLs— sin tocar el hero del drawer.
 *
 * ## Diferencias con `MembersQuickActions` (hero)
 * - `data-name="members-quick-actions-profile"` (distinto selector → telemetría,
 *   QA y estilos por superficie independientes).
 * - Consumidor esperado: `cfg.profile.quickActions` (o el campo que exponga el
 *   loader del Dashboard al normalizar el CF "Quick Actions Profile").
 * - Mismo contrato de prop `actions` y misma anatomía visual → si en el futuro
 *   se decide unificar, el cambio es trivial. Por ahora separado a pedido del
 *   equipo Dashboard (issue 1263924 / split de superficies hero vs profile).
 *
 * ## Comportamiento
 * - Filtra `visible !== false` y ordena por `sortOrder` ascendente.
 * - Recorta a `max` (default 4) — si llegan más, se loguea warn (visibilidad
 *   en dev) y se muestran las primeras `max`. No se ocultan en silencio.
 * - Si no hay acciones visibles → retorna `null` (no renderiza el contenedor).
 *
 * ## Layout
 * - ≤767 (mobile): grid de 4 columnas con `gap-x-2 gap-y-6`.
 * - ≥768 (sm+): fila a la izquierda con `gap-6` (sin distribución forzada).
 * - Pensado para fondos del dashboard (claros / neutros); el átomo trae su
 *   propio chip oscuro, así que no depende del background del contenedor.
 *
 * ## Props
 * - `actions`: Array<{key,label,icon,url,newTab,visible,sortOrder}> — del CF
 *   "Quick Actions Profile".
 * - `opensInNewWindowLabel`: string — sufijo aria para acciones `newTab`
 *   (i18n; lo provee el caller desde `cfg.labels`).
 * - `max`: number — máximo de acciones a mostrar. Default 4.
 * - `customClassName`: string — clases extra para el contenedor.
 */
export const MembersQuickActionsProfile = ({
  actions = [],
  opensInNewWindowLabel = '',
  max = 4,
  customClassName = '',
  ...rest
}) => {
  const visible = (Array.isArray(actions) ? actions : [])
    .filter((a) => a && a.visible !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (visible.length > max) {
    // eslint-disable-next-line no-console
    console.warn(`[MembersQuickActionsProfile] ${visible.length} acciones visibles; se muestran las primeras ${max}.`);
  }
  const shown = visible.slice(0, max);
  if (!shown.length) return null;

  const ariaFor = (a) => (a.newTab && opensInNewWindowLabel
    ? `${a.label}, ${opensInNewWindowLabel}`
    : a.label);

  return html`
    <div
      class=${`grid grid-cols-4 gap-x-2 gap-y-6 sm:flex sm:items-start sm:justify-start sm:gap-6 ${customClassName}`}
      data-name="members-quick-actions-profile"
      ...${rest}
    >
      ${shown.map((a) => html`
        <${MembersQuickAction}
          key=${a.key}
          icon=${a.icon}
          label=${a.label}
          url=${a.url}
          newTab=${!!a.newTab}
          ariaLabel=${ariaFor(a)}
          labelTheme="light"
        />
      `)}
    </div>
  `;
};

export default MembersQuickActionsProfile;
