import { h } from '@dropins/tools/preact.js';
import { useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * FullPageLoader - Loader de página completa para transiciones de producto
 * (Figma Formulario UpGrade 77-9620). Overlay blanco que cubre el viewport
 * con el cóndor de marca y un label, hasta que el flujo lo cierre.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visible mientras sea true
 * @param {string} [props.label='Cargando...'] - Texto bajo el cóndor (i18n)
 * @returns {import('preact').VNode|null}
 */
export const FullPageLoader = ({ isOpen, label = 'Cargando...' }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const condorSrc = `${window.hlx?.codeBasePath || ''}/assets/logos/members/decorative-vector.svg`;

  return html`
    <div
      class="fixed inset-0 z-[1100] bg-white flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      data-name="fullPageLoader"
    >
      <img
        src=${condorSrc}
        alt=""
        aria-hidden="true"
        class="w-[72px] h-auto pointer-events-none select-none animate-pulse"
      />
      <p class="text-text-normal-secondary text-sm !m-0">${label}</p>
    </div>
  `;
};

export default FullPageLoader;
