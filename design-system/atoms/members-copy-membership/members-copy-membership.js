import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MembersCopyMembership — número de socio + botón copiar + feedback "Copiado".
 *
 * Átomo EXTRAÍDO del `statusRow` de `members-hero-header.js` (drawer Members) para
 * reusarlo en el grid de datos del hero "Mi Lifemiles" (1263924) y en el header del
 * drawer. Diseñado para fondos OSCUROS (gradient del hero / drawer): texto blanco y
 * halo `mix-blend-multiply`. Figma 518:27631 (grid) / 169:12888 (halo) / 169:13208
 * (tooltip "Copiado") / 341:13938 (focus ring).
 *
 * Agrupa `membershipNumber` + ícono copiar como UN solo target hoverable. En hover/
 * focus-visible aparece un halo (#6d6d6d 40% multiply, -inset-1 = 4px de respiro) y,
 * en focus-visible, un anillo doble azul+blanco. Tras copiar muestra un tooltip
 * `role="status" aria-live="polite"` (lectores de pantalla anuncian "Copiado").
 *
 * Si `membershipNumber` es falsy, NO renderiza nada (guard).
 *
 * ## Props
 * - `membershipNumber`: string|null — nº de socio. Falsy → no renderiza.
 * - `label`: string — label visible opcional ANTES del número (ej. el tier en el
 *   drawer). Default '' (sin label; el grid usa su propio label vía data-pair).
 * - `copyAriaLabel`: string — aria-label del botón. Default 'Copiar número de socio'.
 * - `copiedLabel`: string — texto del tooltip tras copiar. Default 'Copiado'.
 * - `onCopy`: function(membershipNumber) — callback opcional; si se pasa, reemplaza
 *   el `navigator.clipboard.writeText` por defecto (ej. para disparar un toast).
 * - `size`: 'base'|'lg' — tamaño del número. 'base' (16/21 Bold, drawer) o 'lg'
 *   (16/21 SemiBold + antialiased, grid del hero — comp 518:27631). Default 'base'.
 * - `customClassName`: string — clases extra para el root.
 */
const NUMBER_SIZE = {
  base: 'font-bold text-base leading-[21px]',
  // Grid del hero "Mi Lifemiles" (members dashboard, Figma 518:27631):
  // responsive SemiBold + `antialiased` para suavizar el trazo sobre el
  // gradient oscuro del tier.
  //  - `<640px`  → 16/21 (Figma mobile).
  //  - `≥640px`  → 18/24 (tablet, escala intermedia).
  //  - `≥1024px` → 20/26 (desktop lg, Figma 518:23344).
  // `!` en el font-size para blindar del `clamp()` global del sitio que
  // pisaría `text-[16px]` con valores fluidos.
  lg: 'font-semibold antialiased !text-[16px] !leading-[21px] min-[640px]:!text-[18px] min-[640px]:!leading-[24px] lg:!text-[20px] lg:!leading-[26px]',
};

export const MembersCopyMembership = ({
  membershipNumber = null,
  label = '',
  copyAriaLabel = 'Copiar número de socio',
  copiedLabel = 'Copiado',
  onCopy = null,
  size = 'base',
  customClassName = '',
  ...rest
}) => {
  const [copied, setCopied] = useState(false);

  if (!membershipNumber) return null;

  // Path absoluto al ícono para funcionar bajo `hlx.codeBasePath` (subpaths EDS).
  const codeBasePath = (typeof window !== 'undefined' && window.hlx?.codeBasePath) || '';
  const copyIcon = `${codeBasePath}/icons/members/copy-20.svg`;

  // Default: clipboard + flash visual de 1.5s. El consumidor puede sobrescribir
  // con `onCopy` (ej. toast del design system).
  const handleCopy = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onCopy) {
      onCopy(membershipNumber);
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(membershipNumber);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[MembersCopyMembership] copy failed:', err);
    }
  };

  return html`
    <div
      class=${`flex items-center gap-2 min-w-0 ${customClassName}`}
      data-name="members-copy-membership"
      ...${rest}
    >
      ${label && html`
        <span class="font-bold text-base text-white leading-[21px] whitespace-nowrap">
          ${label}
        </span>
        <span class="block w-px h-[14px] bg-[rgba(217,217,217,0.5)] shrink-0" aria-hidden="true"></span>
      `}
      <button
        type="button"
        onClick=${handleCopy}
        aria-label=${copyAriaLabel}
        class="group relative inline-flex items-center gap-2 p-0 bg-transparent border-0 cursor-pointer outline-none rounded-[4px]"
        data-name="members-copy"
        data-copied=${copied}
      >
        ${/* Halo HOVER (Figma 518:23701): #6d6d6d 40% con mix-blend-multiply
            oscurece sobre el card gradient. -inset-1 = 4px de respiro
            (Figma 169:12888). Solo activo en :hover, NO en :focus-visible
            (focus usa otro halo plano por especificación Figma 518:23719). */ ''}
        <span
          aria-hidden="true"
          class="absolute -inset-1 rounded-[4px] bg-[#6d6d6d] mix-blend-multiply opacity-0 motion-safe:transition-opacity motion-safe:duration-150 group-hover:opacity-40"
        ></span>
        ${/* Halo FOCUS (Figma 518:23719): rgba(109,109,109,0.4) PLANO (sin
            mix-blend). Figma diferencia explícitamente hover (multiply) y
            focus (rgba sólido). Si el usuario hace hover + tab al mismo
            tiempo (raro: focus-visible es teclado-only), los dos halos se
            superponen — efecto aceptable porque ambos son grises translúcidos. */ ''}
        <span
          aria-hidden="true"
          class="absolute -inset-1 rounded-[4px] bg-[rgba(109,109,109,0.4)] opacity-0 motion-safe:transition-opacity motion-safe:duration-150 group-focus-visible:opacity-100"
        ></span>
        ${/* Focus ring (Figma 518:23719 / 341:13938): 1.5px #28a8ff + 3px white.
            Span aparte del halo (el halo de hover usa mix-blend y no debe
            afectar el anillo; mantenerlo separado garantiza render limpio). */ ''}
        <span
          aria-hidden="true"
          class="absolute -inset-1 rounded-[4px] pointer-events-none opacity-0 group-focus-visible:opacity-100 [box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
        ></span>
        <span class=${`relative text-white whitespace-nowrap ${NUMBER_SIZE[size] || NUMBER_SIZE.base}`}>
          ${membershipNumber}
        </span>
        <span class="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
          <img src=${copyIcon} alt="" class="block w-[12.75px] h-[15px]" />
        </span>
        ${copied && html`
          <span
            role="status"
            aria-live="polite"
            class="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-brand-primary,#1b1b1b)] rounded-lg text-white text-sm font-normal leading-normal whitespace-nowrap pointer-events-none z-10"
          >
            <span>${copiedLabel}</span>
            ${/* Check icon (Figma 518:23712 / I518:13566): check blanco simple
                (sin círculo). SVG inline para no agregar otro asset al DAM/EDS.
                viewBox 11.7267×8.94 = path original Figma; wrapper 16×16 con
                inset Figma (12.5% L / 14.21% R / 20.83% T / 23.29% B) replica
                el ícono al tamaño exacto del design. */ ''}
            <span aria-hidden="true" class="relative size-4 shrink-0">
              <span class="absolute inset-[20.83%_14.21%_23.29%_12.5%]">
                <svg viewBox="0 0 11.7267 8.94" fill="none" xmlns="http://www.w3.org/2000/svg" class="block w-full h-full">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.72667 7.05333L0.946667 4.27333L0 5.21333L3.72667 8.94L11.7267 0.94L10.7867 0L3.72667 7.05333Z" fill="currentColor" />
                </svg>
              </span>
            </span>
          </span>
        `}
      </button>
    </div>
  `;
};

export default MembersCopyMembership;
