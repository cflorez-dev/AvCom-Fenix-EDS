import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersProgressBar } from '../../atoms/members-progress-bar/members-progress-bar.js';
import { Tooltip } from '../../atoms/tooltip/tooltip.js';
import { Icon } from '../../atoms/icon/icon.js';
import { eliteVariant } from '../../helpers/members-hero-logic.js';

const html = htm.bind(h);

/**
 * MembersEliteProgress — tira de progreso elite del hero (1263924). Verificada
 * contra el comp 518:27631 (nodo I518:27634;898:25484): BARRA BLANCA full-width,
 * `rounded-2xl p-6`, layout HORIZONTAL en desktop — título a la izquierda + las
 * 1-2 barras lado a lado (cada una flex-1). En mobile apila (column).
 * REUSABLE (el Dashboard hermano 1263921 usa la misma tira).
 *
 * Lógica de front:
 *  - Nº de condiciones = `elite.conditions.length`. Diamond/diamond-cenit/Magno
 *    → 1 sola (nota 518:26721, Figma 518:26794/27096). Gold → 2.
 *  - Variante de color por condición (`eliteVariant`): avianca → magenta; resto → navy.
 *  - El tooltip de info va sobre la etiqueta de la 1ª condición (comp), no en el título.
 *  - Title default "Tu progreso elite {tier} para {year}" (comp). El switch a
 *    `titleEnjoy` ("Disfruta…") es diferente según el flujo:
 *      · Multi-condition (Gold, 2 barras): NO se infiere de `allComplete`. El
 *        estado "Tier completed pending update" (Figma 518:26433/26648) muestra
 *        ambas barras verdes pero el título sigue siendo el de progreso — el
 *        backend aún no actualizó el tier. El switch se activa cuando el
 *        organism pasa explícitamente `tierAchieved=true`.
 *      · Single-condition (Diamond/Magno, 1 barra, Figma 518:26936/27134): el
 *        switch es automático al completarse la única condition — no hay tier
 *        superior, "tier completed" = "tier achieved" inmediato.
 *  - Sin CTA por default (el comp del hero no lo muestra); si se pasa `ctaUrl`,
 *    se renderiza (reuso fuera del hero).
 *
 * Si `elite` es null/sin condiciones → no renderiza (el organism muestra el empty).
 *
 * ## Props
 * - `elite`: {year:number, tierTarget:string, conditions:[{key,value,goal}]}|null.
 * - `tierLabel`: string — label del tier objetivo para el título.
 * - `titleMaintain`: string — template del título (con `{tier}` y `{year}`).
 * - `titleEnjoy`: string — template alternativo cuando el sistema ya marcó al
 *   usuario en el tier (gate por `tierAchieved`). NO se activa por progreso al
 *   100% de las barras (ver doc de la Lógica de front).
 * - `tierAchieved`: boolean — SOLO aplica al flujo multi-condition (Gold). Cuando
 *   el backend confirma que el usuario YA está en el `tierTarget`, dispara el
 *   switch a `titleEnjoy`. Default `false` (entrega actual: el front no infiere
 *   el cambio de tier). En el flujo single-condition (Diamond/Magno) el switch
 *   es automático al completarse la única condition — esta prop se ignora.
 * - `conditionLabels`: Object<string,string> — label por `condition.key`.
 * - `conditionLabelsCompleted`: Object<string,string> — label alternativo por
 *   `condition.key` cuando la condición está completada (Figma 518:26305 /
 *   518:26523 "Millas calificables completadas"). Opcional; si falta, se usa
 *   `conditionLabels`.
 * - `tooltipContent`: string — contenido del tooltip (sobre la etiqueta cond. 1).
 * - `tooltipAriaLabel`: string — aria-label del trigger. Default 'Más información'.
 * - `ctaLabel`: string — texto del CTA. Default 'Ver progreso'.
 * - `ctaUrl`: string|null — URL del CTA. null → no se muestra (default en el hero).
 * - `formatValue`: (n:number)=>string — formateo por locale.
 * - `barFillStyle`: string CSS — valor de `background` para el fill de la barra
 *   `avianca-miles` ("Millas requeridas con avianca", barra 2), que toma el
 *   gradient del tier. La barra `qualifying-miles` ("Millas totales calificables",
 *   barra 1) NO usa este token: se mantiene en `--logo-lifemiles-primary`
 *   (`#2B3C46`) en todos los tiers (Figma final 518:24090 et al.).
 * - `completedAriaLabel`: string — SR del check. Default 'Completado'.
 * - `customClassName`: string.
 */
export const MembersEliteProgress = ({
  elite = null,
  tierLabel = '',
  titleMaintain = 'Tu progreso elite {tier} para {year}',
  titleEnjoy = '',
  tierAchieved = false,
  conditionLabels = {},
  conditionLabelsCompleted = null,
  tooltipContent = '',
  tooltipAriaLabel = 'Más información',
  ctaLabel = 'Ver progreso',
  ctaUrl = null,
  formatValue = (n) => String(n),
  barFillStyle = '',
  completedAriaLabel = 'Completado',
  customClassName = '',
  ...rest
}) => {
  const conditions = Array.isArray(elite?.conditions) ? elite.conditions : [];
  if (!conditions.length) return null;

  // El switch "Mantener/Disfruta" depende del flujo:
  //  - Multi-condition (Gold, 2 barras): completar ambas NO implica upgrade;
  //    "Tier completed pending update" (Figma 518:26433 / 26648) muestra ambas
  //    verdes pero el título sigue siendo el de progreso hasta que el backend
  //    confirme el cambio (señal explícita `tierAchieved`).
  //  - Single-condition (Diamond/Magno, 1 barra, Figma 518:26936 / 27134):
  //    no hay tier superior, completar la única condition = tier achieved
  //    automático → switch inmediato a `titleEnjoy`.
  const allComplete = conditions.every((c) => Number(c.value) >= Number(c.goal));
  const achieved = tierAchieved || (conditions.length === 1 && allComplete);
  const year = elite?.year || '';
  const titleTpl = (achieved && titleEnjoy) ? titleEnjoy : titleMaintain;
  const title = titleTpl.replace('{tier}', tierLabel).replace('{year}', String(year));

  // Tooltip de info: va sobre la etiqueta de la 1ª condición (comp). Trigger
  // focusable (botón) para que el tooltip aparezca también por teclado.
  // Tamaño responsive: 12px hasta 1023px (Figma 518:26233 mobile/tablet) /
  // 16px en desktop ≥1024 (Figma 518:26160). Se usa `size="sm"` (w-3 h-3) +
  // `customClassName` con `lg:w-4 lg:h-4` para sobrescribir el ancho/alto
  // en el breakpoint `lg`. Nota: `md:` (768) NO aplica porque el switch
  // completo del componente vive en `lg` (1024) — ver AVAEMF2P20-200.
  const infoTooltip = tooltipContent ? html`
    <${Tooltip}
      variant="hint"
      position="top"
      content=${tooltipContent}
      tooltipClassName="!whitespace-normal w-[240px] max-w-[80vw] text-center leading-snug"
    >
      <button
        type="button"
        aria-label=${tooltipAriaLabel}
        class="inline-flex items-center justify-center w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-transparent border-0 p-0 cursor-pointer outline-none focus-visible:[box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
      >
        <${Icon}
          icon="alert/info"
          size="sm"
          customClassName="lg:w-4 lg:h-4"
          ariaLabel=${tooltipAriaLabel}
        />
      </button>
    </${Tooltip}>
  ` : null;

  const showCta = ctaUrl !== null && ctaUrl !== false && ctaUrl !== '';

  // CTA "Ver progreso" reutilizable: aparece DOS veces en el DOM \u2014 inline con
  // el title en mobile (Figma 518:26071), a la derecha de las barras en desktop
  // (Figma 518:25999). Misma `<a>` con mismos atributos; CSS oculta la que no
  // aplica al breakpoint. El chevron usa `aria-hidden` (el texto del link ya
  // describe la acci\u00f3n).
  //
  // Tokens directos del Figma (518:25972 / 26214 / 26219 / 26360 / 26509 /
  // 26432 / 26579 / etc.):
  //  - color `#1b1b1b` (text/normal/lighter), font-weight 400, line-height
  //    normal, sin subrayado.
  //  - font-size 14px mobile / 16px desktop (typography/font-size/h6).
  //  - icon `navigation/arrow-right` (canvas 24×24px, path interno 16×16).
  //  - gap 4px entre texto e icono.
  // Se usa un `<a>` plano (no `LinkButton`) porque el atom no expone el color
  // `#1b1b1b` ("informative" es azul) y aplica padding interno que el Figma
  // no muestra. Mantengo focus-visible accesible con el mismo halo split
  // (#28a8ff + #ffffff) que el resto de Members.
  const ctaEl = showCta ? html`
    <a
      href=${ctaUrl}
      class="group relative inline-flex items-center gap-[4px] text-[#1b1b1b] font-normal text-[14px] leading-[19px] lg:text-[16px] lg:leading-[21px] no-underline whitespace-nowrap shrink-0 rounded-[4px] outline-none"
      data-name="members-elite-cta"
    >
      ${/* Focus ring (Figma 518:22271): `-inset-1` = 4px de respiro entre texto e
           icono y el ring azul+blanco. Mismo patrón que `members-hero-toggle` y
           `MembersCopyMembership` — un span aparte para que el box-shadow no quede
           pegado al bounding box. */ ''}
      <span
        aria-hidden="true"
        class="absolute -inset-1 rounded-[4px] pointer-events-none opacity-0 group-focus-visible:opacity-100 [box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
      ></span>
      ${/* hover = underline; active/pressed = SemiBold (Figma 518:22253 / 518:22262).
           Grid-stack: el cambio 400→600 en pressed ensancha el texto y empujaría
           la flecha; un sibling invisible con `font-semibold` reserva el ancho
           bold para que el visible pueda cambiar weight sin correr el layout. */ ''}
      <span class="relative inline-grid">
        <span aria-hidden="true" class="col-start-1 row-start-1 invisible font-semibold pointer-events-none select-none">${ctaLabel}</span>
        <span class="col-start-1 row-start-1 group-hover:underline group-hover:decoration-solid group-active:no-underline group-active:font-semibold">${ctaLabel}</span>
      </span>
      <span class="relative inline-flex"><${Icon} icon="navigation/arrow-right" customSize=${24} ariaLabel="" /></span>
    </a>
  ` : null;

  return html`
    <div
      class=${`bg-white rounded-2xl p-4 pb-6 lg:p-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8 ${customClassName}`}
      data-name="members-elite-progress"
      data-conditions=${conditions.length}
      ...${rest}
    >
      ${/* Header: hasta 1023 title + CTA inline (justify-between, Figma
          617:44593 mantiene el layout mobile hasta tablet); desde 1024 solo
          title con ancho fijo Figma 134px (la w del nodo 518:26000) y los
          hijos se reorganizan a row v\u00eda lg:block + el CTA mobile se oculta.
          El switch al layout horizontal ocurre en `lg` (1024), no en `md`
          (768): el spec 617:44593 confirma que el estado tablet reusa el
          layout mobile stacked (AVAEMF2P20-200). */ ''}
      <div class="flex items-center justify-between gap-4 lg:block lg:w-[134px] lg:shrink-0">
        <h3
          class="!m-0 max-w-[152px] min-[640px]:max-w-full text-sm! font-bold! leading-[19px]! text-[#1b1b1b]!"
          data-name="members-elite-title"
        >${title}</h3>
        ${ctaEl && html`<div class="lg:hidden shrink-0">${ctaEl}</div>`}
      </div>

      <div class="flex-1 w-full flex flex-col gap-6 lg:flex-row lg:gap-6 min-w-0">
        ${conditions.map((c, i) => html`
          <${MembersProgressBar}
            key=${c.key}
            surface="light"
            customClassName="flex-1 min-w-0"
            label=${conditionLabels[c.key] || c.key}
            labelCompleted=${conditionLabelsCompleted?.[c.key] || ''}
            labelAccessory=${(c.key === 'qualifying-miles' || (i === 0 && conditions.length === 1)) ? infoTooltip : null}
            value=${Number(c.value) || 0}
            goal=${Number(c.goal) || 0}
            variant=${eliteVariant(c.key)}
            fillStyle=${c.key === 'avianca-miles' ? barFillStyle : ''}
            formatValue=${formatValue}
            completedAriaLabel=${completedAriaLabel}
          />
        `)}
      </div>

      ${ctaEl && html`<div class="hidden lg:flex shrink-0">${ctaEl}</div>`}
    </div>
  `;
};

export default MembersEliteProgress;
