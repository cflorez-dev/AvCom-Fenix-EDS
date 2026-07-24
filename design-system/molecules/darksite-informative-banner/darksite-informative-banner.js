import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * DarksiteInformativeBanner — Tarjeta oscura informativa que reemplaza al
 * banner promocional del home (o se ancla al `booking-box` como fallback)
 * cuando el modo darksite está activo y el usuario ya pulsó "Continuar en
 * avianca.com" (bypass). Match Figma nodo 9611:7981 ("Landing photography
 * card").
 *
 * ## Layout (spec Figma → tokens del DS)
 * - Contenedor: `flex flex-col`, padding `--spacing-x-large` (24px), radio
 *   `--border-radius-large` (16px), fondo `--color-alert-darksite-bg`
 *   (#1B1B1B — mismo negro que la header alert de la marquesina de
 *   contingencia, para consistencia visual del chrome de bypass).
 * - Bloque interno: `flex flex-col gap-12` con `max-w-[330px]` (fijo en el
 *   spec Figma — el ancho total del card lo da el section del home, pero el
 *   contenido queda anclado a la izquierda dentro de ese máximo).
 * - Textos: `flex flex-col gap-8`, color blanco heredado del wrapper.
 * - CTA: `Button` variant secondary con overrides de pill (radio 32,
 *   h-52, border-2, font 20/bold — spec del banner, distinto al Button
 *   estándar del DS).
 *
 * ## Data
 * Toda la copia y URLs vienen del CF `getDarksiteBanner` (idioma-por-idioma)
 * y son inyectadas como props por `darksite-gate.js` (`swapHomeBanner`). El
 * molecule es puro: no fetchea, no observa estado global.
 *
 * ## Props
 * - `title`: `string` — Titular H2 (ruta afectada). Ej: `"Ruta Bogotá-Miami"`.
 * - `description`: `string` — Subtítulo (vuelo + operador). Ej:
 *   `"AV120 operado por avianca"`.
 * - `ctaLabel`: `string` — Texto del CTA. Ej: `"Información del vuelo"`.
 * - `ctaUrl`: `string` — URL destino del CTA. Ej: `"/darksite/es/detalle"`.
 * - `ctaAlt`: `string` — Etiqueta accesible del CTA (`aria-label`). Ej:
 *   `"Ver información del vuelo AV120"`. Se agrega también como `title` del
 *   `<a>` para tooltip nativo.
 * - `customClassName`: `string` — Clases extra sobre el wrapper.
 * - `...rest`: Props extra al wrapper (ej. `data-*`).
 */
export const DarksiteInformativeBanner = ({
  title = '',
  description = '',
  ctaLabel = '',
  ctaUrl = '',
  ctaAlt = '',
  customClassName = '',
  ...rest
}) => {
  // Wrapper: card oscura, tope de ancho 1248px (misma columna de contenido
  // que header/cintilla/marquesina/`cms-secondary-banner`), centrado con
  // `mx-auto`. Fluida por debajo de ese ancho. `flex flex-col` en todos los
  // breakpoints (Figma no propone layout horizontal — el contenido queda
  // alineado a la izquierda dentro del card, no side-by-side).
  //
  // Ancho: `max-w-[calc(var(--container-xl)-48px)]` = 1248 − 48 = 1200 de
  // contenido. AEM EDS aplica `main > .section > div { box-sizing:
  // content-box }` al hijo directo de section (ver styles/styles.css), y en
  // ese modelo `max-width` cuenta SOLO el contenido; el padding suma por
  // encima. Restar 2 × 24px (nuestro `--spacing-x-large` a cada lado) hace
  // que el border-box total termine en exactamente 1248px, alineado con la
  // columna de contenido del resto del sitio. `--container-xl` es el token
  // canónico que usa `main > .section` para su max-width interna, así que
  // reusarlo mantiene un único source of truth (fallback 1248px por si el
  // token no se hubiera resuelto).
  //
  // Fondo: `--color-alert-darksite-bg` (#1B1B1B) — mismo token que la header
  // alert de la marquesina. Consistencia visual del chrome de bypass:
  // si algún día se ajusta el negro, ambos se mueven juntos. Fallback
  // `#1B1B1B` hardcodeado por si la var no está registrada aún.
  // Wrapper: card oscura, tope de ancho 1248px (misma columna de contenido
  // que header/cintilla/marquesina/`cms-secondary-banner`), centrado con
  // `mx-auto`. Fluida por debajo de ese ancho. `flex flex-col` en todos los
  // breakpoints (Figma no propone layout horizontal — el contenido queda
  // alineado a la izquierda dentro del card, no side-by-side).
  //
  // Ancho: `max-w-[calc(var(--container-xl)-48px)]` = 1248 − 48 = 1200 de
  // contenido. AEM EDS aplica `main > .section > div { box-sizing:
  // content-box }` al hijo directo de section (ver styles/styles.css), y en
  // ese modelo `max-width` cuenta SOLO el contenido; el padding suma por
  // encima. Restar 2 × 24px (nuestro `--spacing-x-large` a cada lado) hace
  // que el border-box total termine en exactamente 1248px, alineado con la
  // columna de contenido del resto del sitio. `--container-xl` es el token
  // canónico que usa `main > .section` para su max-width interna, así que
  // reusarlo mantiene un único source of truth (fallback 1248px por si el
  // token no se hubiera resuelto).
  //
  // Alto: `min-h-[160px]` = 160px de CONTENIDO (Figma nodo 9611:7981). Bajo
  // el mismo `content-box` que aplica AEM, la altura total border-box queda
  // en 160 + 2 × 24 (padding) = 208px — exactamente el frame del Figma. Es
  // `min-h` (no `h`) para que la card crezca si un texto largo lo requiere,
  // preservando el mínimo visual sin recortar contenido.
  //
  // Fondo: `--color-alert-darksite-bg` (#1B1B1B) — mismo token que la header
  // alert de la marquesina. Consistencia visual del chrome de bypass:
  // si algún día se ajusta el negro, ambos se mueven juntos. Fallback
  // `#1B1B1B` hardcodeado por si la var no está registrada aún.
  const wrapperClasses = [
    'w-full max-w-[calc(var(--container-xl,1248px)-48px)] mx-auto',
    'min-h-[160px]',
    'flex flex-col items-start',
    'p-[var(--spacing-x-large)]',
    'rounded-[var(--border-radius-large)]',
    customClassName,
  ].filter(Boolean).join(' ');

  const wrapperStyle = {
    backgroundColor: 'var(--color-alert-darksite-bg, #1B1B1B)',
    color: 'var(--color-alert-darksite-text, #FFFFFF)',
  };

  // Bloque interno (texto + CTA): flex-col con gap 12px, ancho máximo 330px
  // (Figma). `flex-1` = `flex: 1 1 0%` — crece verticalmente para llenar el
  // wrapper (que tiene min-h 160). Match Figma nodo 9611:7982
  // (`flex-[1_0_0]`). En viewports estrechos ocupa 100% para no cortar la
  // copia.
  const contentBlockClasses = 'flex flex-col items-start gap-[var(--spacing-small)] w-full max-w-[330px] flex-1';

  // Bloque de textos: título + descripción con gap 8px. `flex-1` = crece
  // dentro del content-block, empujando el botón hacia el fondo del card
  // (Figma nodo 9611:7983, `flex-[1_0_0]`). Color heredado del wrapper
  // (`--color-alert-darksite-text` = #FFFFFF).
  const textBlockClasses = 'flex flex-col gap-[var(--spacing-x-small)] w-full flex-1';

  // Título (Figma: Red Hat Display Bold, 700 / line-height 42px). Font-size:
  // sigue el token `--heading-h600-size` (clamp 24 → 32px al pasar a
  // desktop) — misma política fluida que el resto del DS. Line-height 42px
  // fijo (spec del banner, sin clamp). Semantic tag: `<h2>` (el banner es
  // un módulo secundario del home; el `<h1>` corresponde al hero principal).
  // `!m-0` cancela el margin default del user-agent para `<h2>`.
  //
  // Color: hay una regla global `h2 { color: var(--text-color-secondary) }`
  // en styles/styles.css que, por especificidad de tag, pisa la herencia del
  // `color` inline del wrapper. Aplicamos color explícito con el MISMO token
  // que usa el wrapper (`--color-alert-darksite-text`, fallback #FFFFFF)
  // para restablecer el #FFFFFF del Figma y mantener un único source of
  // truth: si el token cambia, wrapper + título se mueven juntos.
  const titleClasses = '!m-0 font-[family-name:var(--font-family-primary)] font-bold text-[var(--heading-h600-size)] leading-[42px] tracking-[var(--letter-spacing-normal)] !text-[color:var(--color-alert-darksite-text,#FFFFFF)] break-words w-full';

  // Descripción (Figma: Red Hat Display Regular 400 / 24px / line-height
  // 32px). Valores fijos por spec del banner (sin clamp) — el pill visual
  // del card no admite variación tipográfica por breakpoint. Color #FFFFFF
  // heredado del wrapper (`--color-alert-darksite-text`). Semantic tag:
  // `<p>` (subtítulo del banner, no un heading independiente).
  const descriptionClasses = '!m-0 font-[family-name:var(--font-family-primary)] font-normal !text-[24px] leading-[32px] tracking-[var(--letter-spacing-normal)] break-words w-full';

  // Overrides sobre `Button secondary` para matchear el pill del spec Figma:
  //   - Radio 32px (pill) vs. default del Button.
  //   - Altura 52px fija.
  //   - Padding 2px vertical / 24px horizontal.
  //   - Font 20px bold Red Hat Display (fixed — spec Figma, sin clamp).
  //   - Border 2px (Figma dice stroke 2, el default del Button es 1).
  //   - Gap 8px entre contenidos internos (por si algún día se agrega icono).
  // Se usan `!` (important) porque el Button trae utilities que hay que
  // vencer. `min-w-[100px]` matchea el minWidth del spec.
  const ctaOverrideClasses = [
    '!h-[52px]',
    '!min-w-[100px]',
    '!rounded-[32px]',
    '!px-[var(--spacing-x-large)]',
    '!py-[2px]',
    '!gap-[var(--spacing-x-small)]',
    '!border-2',
    '!text-[20px]',
    '!font-bold',
    '!leading-[var(--line-height-100)]',
    'font-[family-name:var(--font-family-primary)]',
    'no-underline',
    'whitespace-nowrap',
  ].join(' ');

  return html`
    <div
      class=${wrapperClasses}
      style=${wrapperStyle}
      data-name="darksiteInformativeBanner"
      ...${rest}
    >
      <div class=${contentBlockClasses}>
        <div class=${textBlockClasses}>
          ${title && html`<h2 class=${titleClasses}>${title}</h2>`}
          ${description && html`<p class=${descriptionClasses}>${description}</p>`}
        </div>
        ${ctaLabel && ctaUrl && html`
          <${Button}
            variant="secondary"
            size="md"
            href=${ctaUrl}
            aria-label=${ctaAlt || ctaLabel}
            title=${ctaAlt || ctaLabel}
            customClassName=${ctaOverrideClasses}
          >
            ${ctaLabel}
          </${Button}>
        `}
      </div>
    </div>
  `;
};

export default DarksiteInformativeBanner;
