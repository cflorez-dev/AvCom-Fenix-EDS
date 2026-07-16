import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';

const html = htm.bind(h);

/**
 * GoalCard — banner de "meta a cumplir" del panel de progreso elite (1271699,
 * AC bloque 4; GoalHeader en los exhibits §B).
 *
 * Ícono bandera COLOREADO con el color del TIER META (token GoalHeader por
 * tier: Red Plus `#7D0106` · Silver `#393838` · Gold `#A55B1F` · Diamond
 * `#0F0F0F` · Magno `#1B0900` — resueltos vía `getEliteTierTokens().overlay`,
 * CF-overrideable) + título + body con los NÚMEROS EN BOLD.
 *
 * El body llega como TEMPLATE i18n con `{total}`/`{avianca}` + params ya
 * formateados: la interpolación envuelve cada número en `<strong>` SIN pasar
 * HTML crudo del CMS (el template se trata como texto plano — XSS-safe).
 *
 * Reglas de visibilidad (las decide `goal-progress.logic.js`, acá solo se
 * respeta `visible`): desaparece para Magno* y para Diamond que ya logró la
 * meta Magno.
 *
 * ## Props
 * - `visible`: boolean — false → no renderiza nada.
 * - `tier`: string — key del tier META (ej. 'diamond') para el color del ícono
 *   y del nombre del tier en el título.
 * - `title`: string — TEMPLATE del título con `{tier}` ("Meta para llegar a
 *   estatus {tier}"): el nombre del tier se pinta COLOREADO con el token del
 *   tier meta (mock 765-50716).
 * - `titleParams`: {tier: string} — nombre display del tier meta.
 * - `body`: string — template con `{total}`/`{avianca}`.
 * - `bodyParams`: {total: string|null, avianca: string|null} — números YA
 *   formateados. Placeholder con param null → se omite el fragmento `{...}`.
 * - `cfTiers`: dict de tiers del CF (cfg.tiers) para override de tokens.
 * - `flagColor`: string CSS — override directo del color del ícono/tier.
 * - `customClassName`: string.
 */
const FlagIcon = () => html`
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-8 h-8">
    <path
      d="M5 3.5a1 1 0 0 1 2 0V4h11.1a.9.9 0 0 1 .77 1.37l-2.2 3.63 2.2 3.63a.9.9 0 0 1-.77 1.37H7v6.5a1 1 0 1 1-2 0v-17Z"
      fill="currentColor"
    />
  </svg>
`;

/** Interpola `{placeholders}` envolviendo los valores en <strong> (números en
 * negrita, AC bloque 4). Texto plano — nunca innerHTML. */
const renderBody = (template, params = {}) => String(template || '')
  .split(/(\{\w+\})/)
  .map((part) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (!m) return part;
    const val = params[m[1]];
    if (val === null || val === undefined) return '';
    return html`<strong class="font-bold">${val}</strong>`;
  });

export const GoalCard = ({
  visible = true,
  tier = '',
  title = '',
  titleParams = {},
  body = '',
  bodyParams = {},
  cfTiers = {},
  flagColor = '',
  customClassName = '',
  ...rest
}) => {
  if (!visible) return null;
  const color = flagColor || getEliteTierTokens(tier, cfTiers).overlay;

  // Título: el `{tier}` interpolado toma el color del tier meta.
  const titleParts = String(title || '').split(/(\{\w+\})/).map((part) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (!m) return part;
    const val = titleParams[m[1]];
    if (val === null || val === undefined) return '';
    return html`<span style=${{ color }}>${val}</span>`;
  });

  return html`
    <div
      class=${`flex items-start gap-3 ${customClassName}`}
      data-name="goal-card"
      data-tier=${tier}
      ...${rest}
    >
      <span class="shrink-0 mt-0.5" style=${{ color }} data-name="goal-card-flag">
        <${FlagIcon} />
      </span>
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-2xl font-semibold leading-normal text-[var(--text-normal-primary)]">${titleParts}</span>
        ${body && html`
          <span class="text-base font-normal leading-normal text-[var(--text-normal-primary)]">
            ${renderBody(body, bodyParams)}
          </span>
        `}
      </div>
    </div>
  `;
};

export default GoalCard;
