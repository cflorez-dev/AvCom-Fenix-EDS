import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersQuickAction } from '../../atoms/members-quick-action/members-quick-action.js';
import { getQuickActionTokens } from '../../helpers/members-tier-theme.js';

const html = htm.bind(h);

/**
 * MembersQuickActions — fila de hasta 4 quick actions del hero expandido (1263924).
 * Figma 518:27631 (desktop) / 518:27647 (mobile). Las acciones vienen de la config
 * (`cfg.hero.quickActions`): orden (`sortOrder`), activación (`visible`), ícono,
 * texto, url y `newTab` — todo CF-override (P7). Si se desactiva una, las visibles
 * se redistribuyen manteniendo el grid balanceado.
 *
 * Layout: <640 → grid 4-col repartido (justify-between implícito); ≥640 → fila
 * flex a la izquierda. column-gap = 8px (gap-x-2 mobile / min-[640px]:gap-2
 * desktop) en TODOS los breakpoints por spec; row-gap solo aplica en mobile
 * (gap-y-6 = 24px del grid 4-col). Se usa `min-[640px]:` explícito (NO `sm:`)
 * porque este repo redefine `sm=480px` en `styles/variables/tailwind.css` y el
 * parent `members-data-grid` ya usa `min-[640px]:` como breakpoint del hero.
 * Tope de 4 (Figma); si llegan más, se loguea y se recortan (no se ocultan
 * en silencio).
 *
 * ## Props
 * - `actions`: Array<{key,label,icon,url,newTab,visible,sortOrder}> — de la config.
 * - `opensInNewWindowLabel`: string — sufijo aria para acciones `newTab` (i18n).
 * - `max`: number — máximo de acciones a mostrar. Default 4.
 * - `tier`: string — tier crudo del VM ("LifeMiles"/"Gold"/...). Se propaga al átomo
 *   para tintar el chip circular con la paleta del tier (Figma 518:23646). Si no viene
 *   o el tier no tiene spec confirmado, el chip mantiene su look oscuro genérico.
 * - `tierThemes`: object — map indexado del CF (`cfg.tierThemes`) para overrides
 *   de tokens del tier autoreados en Adobe (mismo patrón que `MembersHeroExpanded`).
 * - `customClassName`: string.
 */
export const MembersQuickActions = ({
  actions = [],
  opensInNewWindowLabel = '',
  max = 4,
  tier = '',
  tierThemes = null,
  customClassName = '',
  ...rest
}) => {
  const visible = (Array.isArray(actions) ? actions : [])
    .filter((a) => a && a.visible !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (visible.length > max) {
    // eslint-disable-next-line no-console
    console.warn(`[MembersQuickActions] ${visible.length} acciones visibles; se muestran las primeras ${max}.`);
  }
  const shown = visible.slice(0, max);
  if (!shown.length) return null;

  const ariaFor = (a) => (a.newTab && opensInNewWindowLabel
    ? `${a.label}, ${opensInNewWindowLabel}`
    : a.label);

  // Tokens del chip por tier (Figma 518:23646). Se resuelven UNA vez a nivel de
  // la fila y se pasan al átomo — evita N lookups al helper si hay muchas acciones.
  // `null` (tier vacío o sin spec) ⇒ el átomo cae al chip oscuro genérico.
  const chipTokens = tier ? getQuickActionTokens(tier, tierThemes || {}) : null;

  return html`
    <div
      class=${`grid grid-cols-4 gap-x-2 gap-y-6 min-[640px]:flex min-[640px]:items-start min-[640px]:justify-start min-[640px]:gap-2 ${customClassName}`}
      data-name="members-quick-actions"
      ...${rest}
    >
      ${shown.map((a) => html`
        <${MembersQuickAction}
          key=${a.key}
          icon=${a.icon}
          iconAlt=${a.iconAlt}
          label=${a.label}
          url=${a.url}
          newTab=${!!a.newTab}
          ariaLabel=${ariaFor(a)}
          chipTokens=${chipTokens}
        />
      `)}
    </div>
  `;
};

export default MembersQuickActions;
