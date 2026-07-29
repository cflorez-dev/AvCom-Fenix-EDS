import { h } from '@dropins/tools/preact.js';
import { useEffect, useRef, useState } from '@dropins/tools/preact-hooks.js';
import { createPortal, Fragment } from '@dropins/tools/preact-compat.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

// Duración de la animación apertura/cierre (Figma: 300ms ease-out / ease-in).
const TRANSITION_MS = 300;

/**
 * SidemenuItem - Fila clickeable interna del Sidemenu (Members profileMenu).
 *
 * Layout según Figma 169:13757..13764: min-h-12, px-4, py-6 (~72px filas tipo
 * Members), divider inferior y soporte de iconBefore / iconAfter.
 *
 * Pensado como helper privado del `Sidemenu` mientras `list-item` no exponga la
 * variante `size="sidemenu"` (esa va por otra rama). Cuando esa rama mergee,
 * este componente se puede reemplazar por `<ListItem size="sidemenu" ... />`.
 *
 * ## Props
 * - `label`: string - texto principal
 * - `iconBefore`: string|null - nombre de icono (ej. 'action/exit-to-app')
 * - `iconAfter`: string|null - nombre de icono (ej. 'navigation/chevron-right')
 * - `onClick`: function - handler de click
 * - `href`: string|null - si se pasa, renderiza `<a>` en lugar de `<div>`
 * - `external`: boolean - si href apunta a recurso externo (target="_blank")
 * - `showDivider`: boolean (default true) - línea inferior gris
 * - `disabled`: boolean
 * - `customClassName`: string
 */
export const SidemenuItem = ({
  label,
  iconBefore = null,
  iconAfter = null,
  onClick = null,
  href = null,
  external = false,
  showDivider = true,
  disabled = false,
  customClassName = '',
  ...rest
}) => {
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const handleKeyDown = (e) => {
    if (disabled || href) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick(e);
    }
  };

  const baseClasses = 'group w-full min-h-12 px-4 py-6 relative inline-flex '
    + 'items-center gap-4 no-underline '
    + 'bg-white text-[var(--color-text-normal-primary)] '
    + 'transition-[background-color] duration-150';

  const interactiveClasses = disabled
    ? 'opacity-60 cursor-not-allowed'
    : 'cursor-pointer hover:bg-[var(--color-neutral-100)] '
      + 'active:bg-[var(--color-neutral-200)] '
      + 'focus:outline-none focus-visible:[box-shadow:inset_0_0_0_2px_var(--color-border-stroke-focus)]';

  const iconWrapperClasses = 'shrink-0 w-6 h-6 relative flex items-center '
    + 'justify-center [&_svg_path]:fill-[currentColor]';

  const target = external ? '_blank' : undefined;
  const rel = external ? 'noopener noreferrer' : undefined;

  if (href) {
    return html`
      <a
        class=${`${baseClasses} ${interactiveClasses} ${customClassName}`}
        data-name="sidemenu-item"
        data-disabled=${disabled}
        href=${href}
        target=${target}
        rel=${rel}
        onClick=${handleClick}
        aria-label=${label}
        aria-disabled=${disabled}
        ...${rest}
      >
        ${iconBefore && html`
          <div class=${iconWrapperClasses}>
            <${Icon} icon=${iconBefore} size="xl" color="currentColor" />
          </div>
        `}
        <span class="flex-1 text-base font-normal leading-normal">${label}</span>
        ${iconAfter && html`
          <div class=${iconWrapperClasses}>
            <${Icon} icon=${iconAfter} size="xl" color="currentColor" />
          </div>
        `}
        ${showDivider && html`
          <div
            class="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-border-stroke-default)]"
          ></div>
        `}
      </a>
    `;
  }

  return html`
    <div
      class=${`${baseClasses} ${interactiveClasses} ${customClassName}`}
      data-name="sidemenu-item"
      data-disabled=${disabled}
      onClick=${handleClick}
      onKeyDown=${handleKeyDown}
      tabindex=${disabled ? -1 : 0}
      role="button"
      aria-label=${label}
      aria-disabled=${disabled}
      ...${rest}
    >
      ${iconBefore && html`
        <div class=${iconWrapperClasses}>
          <${Icon} icon=${iconBefore} size="xl" color="currentColor" />
        </div>
      `}
      <span class="flex-1 text-base font-normal leading-normal">${label}</span>
      ${iconAfter && html`
        <div class=${iconWrapperClasses}>
          <${Icon} icon=${iconAfter} size="xl" color="currentColor" />
        </div>
      `}
      ${showDivider && html`
        <div
          class="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-border-stroke-default)]"
        ></div>
      `}
    </div>
  `;
};

/**
 * Sidemenu - Drawer lateral derecho con overlay (Members profileMenu).
 *
 * Figma:
 *  - Desktop ≥768px: drawer lateral, ancho 500px (max 580px). Node 104:12970.
 *  - Mobile <768px: full screen. Nodo 47:13091.
 *  - Mobile pequeño <320px: full screen + layouts internos verticales. Nodo 47:10604.
 *  - Frame completo: 80:11506.
 *
 * Overlay:
 *  - Color #1B1B1B 70%.
 *  - Backdrop-blur 4px (se desactiva si `prefers-reduced-motion: reduce`).
 *  - Click sobre overlay → onClose.
 *  - Se portala a `document.body` con `z-[9998]` para cubrir TODO el viewport:
 *    dimea header sticky (`.header-wrapper` z-100), marquesina darksite
 *    (`.darksite-header-alert` z-2000) y el resto del contenido de la página.
 *    Patrón modal estándar — el chrome del site queda visible detrás del 70%
 *    oscuro, no oculto. El panel del drawer se pinta una capa por encima
 *    (`z-[9999]`).
 *
 * Animación:
 *  - Apertura: slide-in desde derecha + fade-in overlay (300ms ease-out).
 *  - Cierre: slide-out hacia derecha + fade-out overlay (300ms ease-in).
 *  - Si `prefers-reduced-motion: reduce` → sin transición y sin blur.
 *
 * Accesibilidad:
 *  - role="dialog" / aria-modal="true" / aria-label.
 *  - ESC cierra.
 *  - Bloquea scroll del body mientras está abierto.
 *  - Botón de cierre visible (X superior derecho).
 *
 * Estructura:
 *  - `header`: contenido fijo arriba (gradient magenta del HeroHeader Members).
 *  - `children`: contenido principal (lista de SidemenuItem, etc).
 *  - `footer`: contenido al pie (típicamente "Cerrar sesión").
 *
 * El close-button por defecto se dibuja en blanco/oscuro encima del panel.
 * Si el `header` ya incluye su propio X, usá `showCloseButton={false}`.
 *
 * ## Props
 * - `isOpen`: boolean - controlled
 * - `onClose`: function - callback de cierre
 * - `header`: VNode|null - contenido del header
 * - `children`: VNode|null - cuerpo principal
 * - `footer`: VNode|null - pie (logout, etc)
 * - `showCloseButton`: boolean (default true)
 * - `closeButtonColor`: 'dark'|'light' (default 'dark') - color del icono X
 * - `ariaLabel`: string (default 'Menu')
 * - `customClassName`: string - clases extra para el overlay
 * - `panelClassName`: string - clases extra para el panel
 */
export const Sidemenu = ({
  isOpen,
  onClose,
  header = null,
  footer = null,
  children = null,
  showCloseButton = true,
  closeButtonColor = 'dark',
  ariaLabel = 'Menu',
  customClassName = '',
  panelClassName = '',
  ...rest
}) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const transitionEndHandlerRef = useRef(null);
  const isClosingRef = useRef(false);
  // Focus management refs
  const prevActiveElementRef = useRef(null);
  const focusablesRef = useRef([]);
  const focusTrapHandlerRef = useRef(null);

  const [shouldRender, setShouldRender] = useState(!!isOpen);
  const [entered, setEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    const cleanup = () => {
      if (panelRef.current && transitionEndHandlerRef.current) {
        panelRef.current.removeEventListener('transitionend', transitionEndHandlerRef.current);
        transitionEndHandlerRef.current = null;
      }
    };

    if (isOpen) {
      cleanup();
      setShouldRender(true);
      setIsClosing(false);
      setEntered(false);
      // Doble rAF: garantiza mount antes de que aplique el estado "entered".
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return cleanup;
    }

    if (shouldRender) {
      setIsClosing(true);
      setEntered(false);
      let fallbackTimeout = null;
      requestAnimationFrame(() => {
        if (panelRef.current) {
          cleanup();
          const finishClose = () => {
            cleanup();
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
            setShouldRender(false);
            setIsClosing(false);
          };
          transitionEndHandlerRef.current = (e) => {
            if (
              e.target === panelRef.current
              && isClosingRef.current
              && (e.propertyName === 'transform' || e.propertyName === 'opacity')
            ) {
              finishClose();
            }
          };
          panelRef.current.addEventListener('transitionend', transitionEndHandlerRef.current);
          // Fallback: si transitionend no se dispara (reduced motion, cierre rápido).
          fallbackTimeout = setTimeout(finishClose, TRANSITION_MS + 80);
        }
      });
      return () => {
        cleanup();
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
      };
    }
    return cleanup;
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender || isClosing) return undefined;
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onEsc);

    // Focus trap: move focus into the panel and trap Tab inside it
    const panel = panelRef.current;
    const getFocusableElements = (root) => {
      if (!root) return [];
      const selector = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const nodes = Array.from(root.querySelectorAll(selector)).filter((el) => {
        // filter out invisible elements
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getAttribute('data-force-focus') === 'true';
      });
      return nodes;
    };

    prevActiveElementRef.current = document.activeElement;

    // focus the preferred element: membership copy button, otherwise first focusable.
    // `preventScroll: true` es CRÍTICO: sin él el navegador puede scrollear la
    // página al enfocar el elemento (aunque esté dentro de un panel position:fixed),
    // rompiendo la promesa de "conservar el scrollY del usuario al abrir el drawer".
    const focusables = getFocusableElements(panel);
    focusablesRef.current = focusables;
    const preferred = panel?.querySelector('[data-name="members-copy"]') || focusables[0] || panel;
    try {
      if (preferred && typeof preferred.focus === 'function') preferred.focus({ preventScroll: true });
    } catch (err) { /* ignore */ }

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const f = focusablesRef.current.length ? focusablesRef.current : getFocusableElements(panel);
      if (!f.length) {
        e.preventDefault();
        if (panel && typeof panel.focus === 'function') panel.focus({ preventScroll: true });
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      // `preventScroll:true` en el ciclo Tab del trap: si el user rota hasta un
      // elemento que quedó fuera del área visible del panel, el foco lo trae al
      // primero/último sin arrastrar el scroll de la página detrás del drawer.
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    // delegate keydown on the panel so key events from children bubble here
    panel?.addEventListener('keydown', onKeyDown);
    focusTrapHandlerRef.current = onKeyDown;

    return () => {
      document.removeEventListener('keydown', onEsc);
      panel?.removeEventListener('keydown', onKeyDown);
      // restore focus to the element that opened the dialog.
      // `preventScroll: true` evita que el navegador scrollee la página para
      // hacer "visible" el trigger (ej. si el header no está sticky o si por
      // sub-pixel piensa que necesita ajuste). Sin esto, al cerrar el drawer el
      // viewport saltaba a la parte superior de la página (ticket QA).
      try {
        const prev = prevActiveElementRef.current;
        if (prev && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
      } catch (err) { /* ignore */ }
    };
  }, [shouldRender, isClosing, onClose]);

  // Body scroll-lock: bloquea scroll de la página mientras el drawer está abierto
  // y GARANTIZA que al cerrar el viewport vuelva al mismo scrollY que tenía cuando
  // se abrió (spec QA: "preservar la continuidad de la navegación").
  //
  // Estrategia:
  //  1. Al abrir: guardamos `window.scrollY` y aplicamos `overflow-hidden` al
  //     `<html>` (documentElement), NO al `<body>`.
  //  2. Al cerrar: quitamos la clase y, si por cualquier motivo el navegador
  //     movió el scroll (focus restore residual, Safari iOS, gestos, extensiones,
  //     etc.), restauramos con `scrollTo(0, savedY)` de forma síncrona (`instant`).
  //
  // IMPORTANTE — POR QUÉ `<html>` Y NO `<body>`:
  //   `body { overflow: hidden }` convierte al body en su propio scroll container.
  //   Cuando eso pasa, TODOS los elementos `position:sticky` descendientes del
  //   body dejan de tener el viewport como contenedor de scroll — recalculan
  //   contra el body que ya no scrollea. Como resultado, el header sticky
  //   (`.header-wrapper` z:1000), la marquesina (`.sticky top-0 z-[1000]`) y la
  //   darksite alert (`.darksite-header-alert` z:2000) PIERDEN el sticky-clamp
  //   y se van a su posición de flow natural (top ≈ -scrollY), quedando fuera
  //   del viewport. Aplicando la regla al `<html>` en cambio, la propiedad
  //   afecta al ICB (initial containing block) sin cambiar el scroll container
  //   de los descendientes → los sticky del site siguen funcionando y el
  //   scroll queda igualmente bloqueado.
  //
  //   Comprobado con Chrome DevTools MCP el 2026-07-28:
  //     - `body.overflow-hidden` + scrollY=474 → alert top:-474, marquesina
  //       top:-430, header top:-390 (todos fuera del viewport).
  //     - `html.overflow-hidden` + scrollY=474 → alert/marquesina/header top:0
  //       (sticky funciona correctamente).
  //
  // Nota: NO usamos el patrón `position:fixed + top:-scrollY` porque introduce
  // un salto perceptible en la propia apertura y también rompe sticky en el
  // trayecto. `html.overflow-hidden` + restore explícito es suficiente cuando
  // eliminamos también los focus-induced scrolls (ver `preventScroll:true`
  // arriba).
  useEffect(() => {
    if (!shouldRender) return undefined;
    const savedY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
      // Restaurar sólo si el scroll efectivamente cambió (evita micro-jitter).
      const currentY = window.scrollY || window.pageYOffset || 0;
      if (currentY !== savedY) {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
      }
    };
  }, [shouldRender]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !isClosing) onClose?.();
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isClosing) onClose?.();
  };

  if (!shouldRender) return null;

  // Overlay: #1B1B1B 70% + blur 4px (sin blur si reduced-motion). Se portala a
  // <body> con z-[9998] para cubrir TODO el viewport — header sticky
  // (`.header-wrapper` z-100), booking-box sticky, marquesina darksite
  // (`.darksite-header-alert` z-2000), etc. Patrón modal estándar: el overlay
  // dimea (no oculta) el chrome del site atrás del 70% oscuro; el panel
  // (z-9999) queda una capa por encima.
  //
  // NOTA: antes vivía adentro de `.header-user-actions` con z-[9999], pero
  // quedaba atrapado en el stacking context del `.header-wrapper` (sticky
  // z-100) → NO podía subir sobre hermanos externos como el darksite alert.
  // El portal a <body> desacopla overlay y panel del contexto del header.
  const overlayBase = 'fixed inset-0 z-[9998] '
    + 'bg-[rgba(27,27,27,0.7)] motion-safe:backdrop-blur-[4px] '
    + 'transition-opacity duration-300 motion-reduce:transition-none';
  const overlayState = entered ? 'opacity-100 ease-out' : 'opacity-0 ease-in';
  const overlayClasses = `${overlayBase} ${overlayState} ${customClassName}`;

  // Panel: full screen <768px, drawer ≥768px. z-[9999] (una capa por encima
  // del overlay z-9998). El contenedor `fixed inset-0 flex justify-end` se
  // mantiene `pointer-events-none` para que los clicks en la zona libre
  // (fuera del panel) atraviesen al overlay debajo — el overlay resuelve el
  // cierre por click.
  // IMPORTANTE: el panel NO scrollea — `overflow-hidden`. El header queda
  // sticky/shrink-0 al tope y un wrapper interno (`scroll-area`) absorbe el
  // scroll cuando el body excede el viewport. Esto cumple con el spec del
  // drawer Members (Figma 115:8485 / 115:8907): el HeroHeader gradient debe
  // permanecer visible mientras el listado de items scrollea.
  const panelWrapperBase = 'fixed inset-0 z-[9999] flex justify-end pointer-events-none';
  const panelBase = 'relative flex flex-col h-full w-full '
    + 'md:w-[500px] md:max-w-[580px] '
    + 'bg-white overflow-hidden '
    + 'shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] '
    + 'transform-gpu will-change-transform '
    + 'transition-transform duration-300 motion-reduce:transition-none '
    + 'pointer-events-auto';
  const panelState = entered ? 'translate-x-0 ease-out' : 'translate-x-full ease-in';
  const panelInteractive = isClosing ? 'pointer-events-none' : 'pointer-events-auto';
  const panelClasses = `${panelBase} ${panelState} ${panelInteractive} ${panelClassName}`;

  const closeIconColorClass = closeButtonColor === 'light'
    ? 'text-white'
    : 'text-[var(--color-text-normal-primary)]';

  // Portal a <body> para escapar el stacking context de `.header-wrapper`
  // (sticky z-100). Sin esto, ni el backdrop puede quedar por debajo del
  // header ni el panel puede subir sobre la marquesina darksite (z-2000).
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    html`
      <${Fragment}>
        <div
          ref=${overlayRef}
          class=${overlayClasses}
          data-name="sidemenu-overlay"
          onClick=${handleOverlayClick}
          role="presentation"
        ></div>
        <div
          class=${panelWrapperBase}
          data-name="sidemenu-panel-wrapper"
        >
          <div
            ref=${panelRef}
            class=${panelClasses}
            role="dialog"
            aria-modal="true"
            aria-label=${ariaLabel}
            onClick=${(e) => e.stopPropagation()}
            ...${rest}
          >
            ${/* Header: shrink-0 + relative para anclar el close button. NUNCA
                scrollea junto al body — patrón sticky por flex (Figma 115:8907). */ ''}
            ${header && html`
              <div class="shrink-0 relative">
                ${header}
                ${showCloseButton && html`
                  <div class=${`absolute top-[50px] right-4 z-10 ${closeIconColorClass}`}>
                    <${Button}
                      variant="transparent"
                      size="xxs"
                      iconOnly=${true}
                      onClick=${handleCloseClick}
                      aria-label="Cerrar menú"
                    >
                      <${Icon} icon="navigation/close-24" size="xl" color="currentColor" />
                    </${Button}>
                  </div>
                `}
              </div>
            `}
            ${/* Si NO hay header, el close-button vive flotante sobre el panel
                (caso legacy: header pasado vía children). */ ''}
            ${!header && showCloseButton && html`
              <div class=${`absolute top-[50px] right-4 z-10 ${closeIconColorClass}`}>
                <${Button}
                  variant="transparent"
                  size="xxs"
                  iconOnly=${true}
                  onClick=${handleCloseClick}
                  aria-label="Cerrar menú"
                >
                  <${Icon} icon="navigation/close-24" size="xl" color="currentColor" />
                </${Button}>
              </div>
            `}
            ${/* Scroll area: flex-1 + overflow-y-auto. Children + footer viven
                adentro. Si el contenido cabe en el viewport, el footer queda al
                fondo gracias a `mt-auto` dentro del flex column.

                Reserva derecha = 16px constantes (Figma 115:8903 spec) compuesta por:
                  - 12px del scrollbar custom global (`custom-scrollbar.css`):
                    container 12px = thumb 4px gris #d9d9d9 con border 4px transparente
                    a cada lado y bg-clip:padding-box, rounded como pill (visualmente
                    idéntico al rounded-4px que pide Figma sobre un thumb de 4px).
                  - 4px de gap entre el contenido y el scrollbar (`pr-1`).
                `[scrollbar-gutter:stable]` reserva esos 12px del scrollbar también
                cuando NO hay overflow, así el contenido nunca salta horizontalmente
                al aparecer/ocultarse el scroll. */ ''}
            ${(children || footer) && html`
              <div
                class="sidemenu-scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col pr-1 [scrollbar-gutter:stable]"
                data-name="sidemenu-scroll-area"
              >
                ${children && html`
                  <div class="flex flex-col items-start w-full flex-1 min-h-0">${children}</div>
                `}
                ${footer && html`
                  <div class="flex flex-col items-start w-full mt-auto">${footer}</div>
                `}
              </div>
            `}
          </div>
        </div>
      </${Fragment}>
    `,
    portalTarget,
  );
};

export default Sidemenu;
