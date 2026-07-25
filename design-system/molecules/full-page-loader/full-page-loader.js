import { h } from '@dropins/tools/preact.js';
import { useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

// Trazos del isotipo (cóndor) de marca — misma silueta que
// assets/logos/members/decorative-vector.svg, pero SVG inline con trazo
// oscuro visible sobre fondo blanco (el asset de members es blanco con
// opacidad 0.4, pensado como watermark sobre fondos oscuros) y con
// pathLength=1 para poder animar el dibujo del trazo en loop.
const CONDOR_PATHS = [
  'M83.3035 103.302C88.3137 103.302 90.5348 103.717 91.9326 104.348C89.7881 97.6967 83.0291 92.5118 59.2098 90.7324C63.0137 95.1329 67.0092 99.3484 71.2216 103.302H83.3035Z',
  'M59.2099 90.7388C36.0927 63.8959 20.5196 29.5531 14.2776 0.937283C14.2776 0.937283 1.5702 12.1362 0.561776 35.6883C-0.55515 61.4279 13.2628 87.3779 58.7695 90.6878C58.9163 90.7133 59.0695 90.7133 59.2099 90.7325V90.7388Z',
  'M71.2209 103.302C53.2799 103.302 22.306 103.302 22.306 103.302C22.957 104.82 25.1972 105.885 30.2968 106.185C60.8303 107.996 65.1513 131.937 108.852 131.937C112.688 131.937 115.081 131.708 117.5 131.255C100.229 125.949 84.7198 115.974 71.2209 103.296V103.302Z',
];

/**
 * FullPageLoader - Loader de página completa para transiciones de producto
 * (Figma Formulario UpGrade 77-9620). Overlay blanco que cubre el viewport
 * con el cóndor de marca dibujándose en loop continuo y un label, hasta que
 * el flujo lo cierre.
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

  return html`
    <div
      class="fixed inset-0 z-[1100] bg-white flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      data-name="fullPageLoader"
    >
      <style>
        @keyframes fplCondorDraw {
          0% { stroke-dashoffset: 1; opacity: 1; }
          65% { stroke-dashoffset: 0; opacity: 1; }
          85% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        [data-name='fullPageLoader'] svg path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: fplCondorDraw 2.4s ease-in-out infinite;
        }
      </style>
      <svg
        viewBox="0 0 118 132.937"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-[110px] h-auto pointer-events-none select-none"
        aria-hidden="true"
      >
        ${CONDOR_PATHS.map((d) => html`
          <path d=${d} pathLength="1" stroke="#1B1B1B" stroke-width="1" fill="none" />
        `)}
      </svg>
      <p class="text-text-normal-primary text-base !m-0">${label}</p>
    </div>
  `;
};

export default FullPageLoader;
