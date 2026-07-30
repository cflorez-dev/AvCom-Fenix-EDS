import { h } from '@dropins/tools/preact.js';
import { useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Asset del cóndor del producto: el MISMO GIF que está autorado en el bloque
 * `cms-loader` de `/es`, `/es/mi-reserva` y `/es/experiencia-avianca/clases-y-tarifas`
 * (allí como `media_11c98585adf4b41ed19632e16fc75f8d110279640.gif`), copiado al repo
 * para que el fallback no se vea distinto al loader oficial.
 *
 * Se commitea la variante de 400×400 (224 KB) y no el original de 2000×2000 (2,5 MB):
 * a los 100px a los que se pinta es indistinguible del original, incluido DPR 2
 * — comparadas las tres variantes en navegador. La de 200×200 (82 KB) sí se degrada,
 * se le rompe el trazo. Ojo: los assets del repo se sirven tal cual, sin pasar por el
 * pipeline de imágenes de Helix, así que estos bytes son los que viajan.
 */
export const CONDOR_LOADER_ASSET = '/assets/loader/condor-loader.gif';

/**
 * FullPageLoader - Loader de página completa para transiciones de producto
 * (Figma Formulario UpGrade 77-9620). Overlay blanco que cubre el viewport con el
 * cóndor de marca animándose en loop y un label, hasta que el flujo lo cierre.
 *
 * Es el **fallback**: cuando la página tiene autorado el bloque `cms-loader`, el flujo
 * usa ese (`showLoader()` de `loader.service.js`) y esta molecule no se monta. El bloque
 * autorado siempre gana; esto solo cubre las páginas que no lo tienen.
 *
 * El isotipo va a 100px para igualar `.cms-loader-image-wrapper` del bloque oficial, que
 * es lo que pide la nota de Figma 77:9633 ("debe utilizarse el mismo componente de Loader
 * implementado para las demás transiciones del producto"). El gap de 32px y el label en
 * 18px / Red Hat Display Medium sobre `#1b1b1b` se mantienen del nodo `77:9621`.
 *
 * El label es opcional: con string vacío no se pinta el párrafo y queda solo el cóndor,
 * que es la forma de apagar el texto desde el diccionario (`cabinUpgradeForm.loader.label`
 * en blanco) sin tocar código ni arrastrar traducciones.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visible mientras sea true
 * @param {string} [props.label='Cargando...'] - Texto bajo el cóndor (i18n). Vacío = sin texto
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
      class="fixed inset-0 z-[1100] bg-white flex flex-col items-center justify-center gap-8"
      role="status"
      aria-live="polite"
      data-name="fullPageLoader"
    >
      <img
        src=${CONDOR_LOADER_ASSET}
        alt=""
        aria-hidden="true"
        width="400"
        height="400"
        class="w-[100px] h-auto pointer-events-none select-none"
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />
      ${label && html`
        <p class="text-text-normal-primary text-lg font-medium !m-0">${label}</p>
      `}
    </div>
  `;
};

export default FullPageLoader;
