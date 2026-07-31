import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from '../../../atoms/inputs/input/input.js';
import { Button } from '../../../atoms/button/button.js';
import { ModalAviancaLayout, isImageSource } from '../../../molecules/modal/modal-avianca-layout.js';
import { preloadIcons } from '../../../atoms/icon/icon.js';
import { FullPageLoader, CONDOR_LOADER_ASSET } from '../../../molecules/full-page-loader/full-page-loader.js';
import { fetchAEMData } from '../../../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';
import { validateUpgrade, getUpgradesConfig } from '../../../../scripts/services/upgrades/upgrades.service.js';
import { mapValidateResult, buildMmbRedirectUrl, UPGRADE_RESULT } from '../../../../scripts/services/upgrades/upgrades-result.js';
import { showLoader, updateLoaderText } from '../../../../scripts/services/loader/loader.service.js';

const html = htm.bind(h);

let i18Cache = null;
let i18FallbackCache = null;

// Los catálogos se cachean a nivel de módulo (se piden una vez por sesión). Los
// tests necesitan variar el diccionario entre casos sin recargar el módulo, porque
// resetear módulos desempareja la instancia de Preact de la de sus hooks.
// Mismo patrón que resetUpgradesConfigCacheForTests en upgrades.service.js.
export const resetI18nCachesForTests = () => {
  i18Cache = null;
  i18FallbackCache = null;
};

export const sanitizePnr = (value) => String(value ?? '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toUpperCase()
  .slice(0, 6);

export const sanitizeLastName = (value) => String(value ?? '')
  .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');

// Ilustración por escenario (Figma 77-6794 "Modales - Error"): cada modal tiene
// la suya, no comparten una sola. Se resuelven como sprite vía el atom Icon
// (`/icons/<name>.svg`), a 80×80 dentro de ModalAviancaLayout.
export const MODAL_ICONS = {
  [UPGRADE_RESULT.NO_AVAILABILITY]: 'modals/upgrade-no-availability',
  [UPGRADE_RESULT.NOT_FOUND]: 'modals/upgrade-not-found',
  [UPGRADE_RESULT.ERROR]: 'modals/upgrade-error',
};

// Icono heredado, previo a tener las ilustraciones definitivas de Figma. Solo se
// usa si llega un resultado desconocido.
export const MODAL_ICON_FALLBACK = 'modals/upgrade-not-available';

// Keys del diccionario con que el autor puede cambiar la imagen y su alt sin
// deploy, igual que los textos. El valor de `.image` puede ser una ruta del sitio
// (`/media_xxx.svg`), una URL absoluta o un nombre de sprite de `/icons/`.
export const MODAL_IMAGE_KEYS = {
  [UPGRADE_RESULT.NO_AVAILABILITY]: 'cabinUpgradeForm.modalHighDemand.image',
  [UPGRADE_RESULT.NOT_FOUND]: 'cabinUpgradeForm.modalNotFound.image',
  [UPGRADE_RESULT.ERROR]: 'cabinUpgradeForm.modalError.image',
};

/**
 * Resuelve la ilustración de un modal. Precedencia: diccionario > override del
 * bloque > ilustración de Figma embebida en el repo.
 *
 * El override del bloque (`modalImage` de form-header-banner) va segundo porque
 * aplica a los tres modales por igual y está documentado como "no usar"; se
 * conserva solo por compatibilidad.
 *
 * @param {string} result - Valor de UPGRADE_RESULT del modal que se está pintando
 * @param {string} [cmsValue] - Valor de la key `*.image` del diccionario
 * @param {string} [overrideSrc] - Override de autor del bloque form-header-banner
 * @returns {string} Nombre de sprite, ruta del sitio o URL absoluta
 */
export const resolveModalIcon = (result, cmsValue, overrideSrc) => {
  const authored = typeof cmsValue === 'string' ? cmsValue.trim() : '';
  return authored
    || overrideSrc
    || MODAL_ICONS[result]
    || MODAL_ICON_FALLBACK;
};

/**
 * Reúne las ilustraciones de los 3 modales, separadas por cómo se cargan: los
 * nombres de sprite los trae el atom Icon con fetch a `/icons/<name>.svg`, y las
 * rutas/URLs las pinta el navegador como `<img>`.
 *
 * @param {Object} [labels] - Labels ya resueltos del diccionario
 * @param {string} [overrideSrc] - Override de autor del bloque form-header-banner
 * @returns {{ sprites: string[], images: string[] }} Sin duplicados
 */
export const collectModalIllustrations = (labels, overrideSrc) => {
  const l = labels || {};
  const resueltas = [
    resolveModalIcon(UPGRADE_RESULT.NO_AVAILABILITY, l.highDemandImage, overrideSrc),
    resolveModalIcon(UPGRADE_RESULT.NOT_FOUND, l.notFoundImage, overrideSrc),
    resolveModalIcon(UPGRADE_RESULT.ERROR, l.errorImage, overrideSrc),
  ].filter((v) => typeof v === 'string' && v.trim());
  const unicas = [...new Set(resueltas)];
  return {
    sprites: unicas.filter((v) => !isImageSource(v)),
    images: unicas.filter((v) => isImageSource(v)),
  };
};

/**
 * Calienta esas ilustraciones. Sin esto, cada una se descarga en el instante en
 * que su modal se abre — y para el modal de error técnico ese instante es
 * precisamente cuando la red puede estar caída. Peor aún: si el fetch de un
 * sprite falla, el atom Icon lo anota en su cache de fallos y NO lo reintenta en
 * el resto de la sesión, así que el modal queda sin ilustración incluso después
 * de que la red vuelva (comprobado en avqa: el asset respondía 200 y el icono
 * seguía vacío, sin un solo reintento).
 *
 * Precargar al montar el formulario mueve esas descargas al momento en que la
 * página acaba de cargar, con la red presumiblemente sana. Es best-effort: si
 * falla, el comportamiento es el de antes, no peor.
 *
 * @param {{ sprites: string[], images: string[] }} ilustraciones
 */
const warmModalIllustrations = ({ sprites, images }) => {
  if (typeof window === 'undefined') return;
  preloadIcons(sprites);
  images.forEach((src) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  });
};

/**
 * Calienta el GIF del cóndor del loader de fallback, por la misma razón que las
 * ilustraciones de los modales: el `<img>` del FullPageLoader no existe hasta que
 * el loader se abre, o sea hasta que se envía el formulario, que es justo cuando
 * la red puede estar degradada.
 *
 * Solo aplica cuando la página **no** tiene el bloque `cms-loader` autorado, que
 * es el único caso en que se usa el fallback. El camino del bloque no lo necesita:
 * su `<img>` vive en el HTML de la página con `loading="eager"` y el navegador ya
 * lo trae en la carga, aunque la sección esté en `display:none` (verificado en
 * `/es` de avqa: `complete: true`, `naturalWidth: 2000`).
 *
 * Se usa `rel="prefetch"` y no `preload` a propósito: son 224 KB que solo se
 * necesitan al enviar, así que se piden con prioridad baja y en tiempo libre, sin
 * competir con los recursos de la página.
 */
const prefetchFallbackLoaderAsset = () => {
  if (typeof document === 'undefined') return;
  // Mismos selectores que getLoaderSection() en loader.service.js.
  const tieneBloque = !!document.querySelector('.section.cms-loader-container')
    || !!document.querySelector('.cms-loader.block');
  if (tieneBloque) return;
  const yaDeclarado = document.head
    .querySelector(`link[rel="prefetch"][href="${CONDOR_LOADER_ASSET}"]`);
  if (yaDeclarado) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = CONDOR_LOADER_ASSET;
  document.head.appendChild(link);
};

/**
 * Resuelve un texto del diccionario recorriendo los catálogos en orden (idioma
 * activo, luego el de respaldo en es).
 *
 * Una llave **autorada en blanco** se respeta como tal: es la forma que tiene el
 * autor de apagar un texto opcional (p. ej. el helper del apellido) sin deploy.
 * Antes se trataba como ausente — `if (labelData?.Text)` con `''` es falsy — y
 * caía al fallback hardcodeado, así que vaciar la llave no surtía efecto.
 * Solo se usa el fallback cuando la llave no existe en ningún catálogo.
 *
 * @param {Array<Array<{Key: string, Text: string}>>} catalogs - Catálogos por prioridad
 * @param {string} key - Llave del diccionario
 * @param {string} [fallback] - Texto a usar si la llave no está autorada en ningún catálogo
 * @returns {string}
 */
export const pickI18nText = (catalogs, key, fallback = '') => {
  const found = (catalogs || [])
    .filter(Array.isArray)
    .map((catalog) => catalog.find((item) => item?.Key === key))
    .find((entry) => typeof entry?.Text === 'string');
  return found ? found.Text : fallback;
};

function getI18nLabel(key, fallback = '') {
  return pickI18nText([i18Cache, i18FallbackCache], key, fallback);
}

/**
 * CabinUpgradeForm - Formulario de acceso a Upgrades (AVAEMF2P20-270).
 * Valida PNR + apellido contra /v1/upgrades/validate (Ventana Comercial) y
 * redirige a Upgrades MMB cuando hay al menos un segmento elegible. Sin
 * selección de flujo ni SSCI.
 *
 * @param {Object} props
 * @param {Function} [props.onSubmit] - Callback tras resultado exitoso (antes de redirigir)
 * @param {Function} [props.onError] - Callback en resultados de error
 * @param {string} [props.modalDescription] - Override CMS de la descripción
 * del modal sin disponibilidad
 * @param {Object} [props.modalImageData] - Override CMS del icono del modal
 * @param {string} [props.modalImageAlt] - Alt del icono del modal
 * @param {string} [props.customClassName=''] - Clases adicionales
 * @returns {import('preact').VNode}
 */
export const CabinUpgradeForm = ({
  onSubmit = () => {},
  onError = () => {},
  modalDescription,
  modalImageData,
  modalImageAlt,
  customClassName = '',
  ...rest
}) => {
  const [pnrCode, setPnrCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ pnrCode: '', lastName: '' });
  const [activeModal, setActiveModal] = useState(null); // null | UPGRADE_RESULT.*
  // true cuando la página no tiene autorado el bloque cms-loader (el loader
  // oficial de transiciones del producto) y toca usar la molecule de fallback.
  const [useFallbackLoader, setUseFallbackLoader] = useState(false);
  const [labels, setLabels] = useState({});

  useEffect(() => {
    // Los sprites del repo son el fallback garantizado de los 3 modales: se
    // calientan ya, sin esperar el diccionario.
    warmModalIllustrations(collectModalIllustrations());
    prefetchFallbackLoaderAsset();
    const loadLabels = async () => {
      if (!i18Cache) {
        const cookieLanguage = getStoredLanguage() || 'es';
        const i18Data = await fetchAEMData(`${cookieLanguage}`);
        i18Cache = i18Data?.data || [];
        if (cookieLanguage !== 'es' && !i18FallbackCache) {
          const esFallback = await fetchAEMData('es');
          i18FallbackCache = esFallback?.data || [];
        }
      }
      setLabels({
        buttonText: getI18nLabel('cabinUpgradeForm.buttonText', 'Solicitar ascenso'),
        pnrLabel: getI18nLabel('cabinUpgradeForm.labels.pnr', 'Código de reserva'),
        lastNameLabel: getI18nLabel('cabinUpgradeForm.labels.apellido', 'Apellido'),
        lastNameHelper: getI18nLabel('cabinUpgradeForm.helper.apellido', 'Tal y como aparece(n) en la reserva'),
        pnrError: getI18nLabel('cabinUpgradeForm.error.pnr', 'El código de reserva es obligatorio'),
        lastNameError: getI18nLabel('cabinUpgradeForm.error.apellido', 'El apellido es obligatorio'),
        loaderLabel: getI18nLabel('cabinUpgradeForm.loader.label', 'Cargando...'),
        errorTitle: getI18nLabel('cabinUpgradeForm.modalError.title', '¡Ups! Algo salió mal'),
        errorDescription: getI18nLabel('cabinUpgradeForm.modalError.description', 'Por favor, intenta de nuevo.'),
        errorButton: getI18nLabel('cabinUpgradeForm.modalError.buttonText', 'Reintentar'),
        highDemandTitle: getI18nLabel('cabinUpgradeForm.modalHighDemand.title', 'Servicio con alta demanda'),
        highDemandDescription: getI18nLabel('cabinUpgradeForm.modalHighDemand.description', 'El ascenso de cabina no está disponible para este vuelo.'),
        highDemandButton: getI18nLabel('cabinUpgradeForm.modalHighDemand.buttonText', 'Consultar otra reserva'),
        notFoundTitle: getI18nLabel('cabinUpgradeForm.modalNotFound.title', 'Reserva no encontrada'),
        notFoundDescription: getI18nLabel('cabinUpgradeForm.modalNotFound.description', 'Revisa el código de tu reserva y apellido'),
        notFoundButton: getI18nLabel('cabinUpgradeForm.modalNotFound.buttonText', 'Reintentar'),
        // Imágenes de los modales: vacío = ilustración de Figma que vive en el repo.
        highDemandImage: getI18nLabel(MODAL_IMAGE_KEYS[UPGRADE_RESULT.NO_AVAILABILITY], ''),
        notFoundImage: getI18nLabel(MODAL_IMAGE_KEYS[UPGRADE_RESULT.NOT_FOUND], ''),
        errorImage: getI18nLabel(MODAL_IMAGE_KEYS[UPGRADE_RESULT.ERROR], ''),
        highDemandImageAlt: getI18nLabel('cabinUpgradeForm.modalHighDemand.imageAlt', ''),
        notFoundImageAlt: getI18nLabel('cabinUpgradeForm.modalNotFound.imageAlt', ''),
        errorImageAlt: getI18nLabel('cabinUpgradeForm.modalError.imageAlt', ''),
        notFoundPnrError: getI18nLabel('cabinUpgradeForm.error.pnrNotFound', 'Revisa el código de tu reserva'),
        notFoundLastNameError: getI18nLabel('cabinUpgradeForm.error.apellidoNotFound', 'Revisa el apellido'),
        formAriaLabel: getI18nLabel('cabinUpgradeForm.aria.form', 'Formulario de upgrade de cabina'),
        submitAriaLabel: getI18nLabel('cabinUpgradeForm.aria.submitButton', 'Solicitar ascenso a Business Class'),
      });
      // Y ahora las que decidió el autor, que pueden ser otro sprite o una URL
      // del DAM. Se leen del diccionario ya cargado, no del estado (que aún no
      // se ha aplicado en este tick).
      warmModalIllustrations(collectModalIllustrations({
        highDemandImage: getI18nLabel(MODAL_IMAGE_KEYS[UPGRADE_RESULT.NO_AVAILABILITY], ''),
        notFoundImage: getI18nLabel(MODAL_IMAGE_KEYS[UPGRADE_RESULT.NOT_FOUND], ''),
        errorImage: getI18nLabel(MODAL_IMAGE_KEYS[UPGRADE_RESULT.ERROR], ''),
      }, modalImageData?.src));
    };
    loadLabels();
  }, []);

  const handlePnrKeyPress = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key)) e.preventDefault();
  };

  const handlePnrChange = (value) => {
    const sanitized = sanitizePnr(value);
    setPnrCode(sanitized);
    if (errors.pnrCode && sanitized.length > 0) {
      setErrors((prev) => ({ ...prev, pnrCode: '' }));
    }
  };

  const handleLastNameKeyPress = (e) => {
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(e.key)) e.preventDefault();
  };

  const handleLastNameChange = (value) => {
    const sanitized = sanitizeLastName(value);
    setLastName(sanitized);
    if (errors.lastName && sanitized.length > 0) {
      setErrors((prev) => ({ ...prev, lastName: '' }));
    }
  };

  const closeModal = () => setActiveModal(null);

  const handleHighDemandClose = () => {
    setActiveModal(null);
    setPnrCode('');
    setLastName('');
  };

  const handleNotFoundClose = () => {
    setActiveModal(null);
    document.getElementById('pnr-code')?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { pnrCode: '', lastName: '' };
    if (!pnrCode.trim()) newErrors.pnrCode = labels.pnrError;
    if (!lastName.trim()) newErrors.lastName = labels.lastNameError;
    if (newErrors.pnrCode || newErrors.lastName) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    // Figma 77-9620: usar el MISMO loader de las demás transiciones del
    // producto (bloque cms-loader autorado en la página, GIF del cóndor).
    // Si la página no lo tiene, cae a la molecule full-page-loader.
    const hasCmsLoader = showLoader(true);
    // Se pasa el valor autorado tal cual, incluido el vacío: vaciar
    // `cabinUpgradeForm.loader.label` apaga el texto y deja solo el cóndor. Si los
    // labels aún no cargaron (`undefined`) no se toca el texto autorado del bloque.
    if (hasCmsLoader && typeof labels.loaderLabel === 'string') {
      updateLoaderText(labels.loaderLabel);
    }
    setUseFallbackLoader(!hasCmsLoader);
    try {
      const response = await validateUpgrade({ pnr: pnrCode });
      const result = mapValidateResult({ ...response, lastName });

      if (result === UPGRADE_RESULT.ELIGIBLE) {
        const { mmbUrl, langMap, urlByLang } = await getUpgradesConfig();
        const url = buildMmbRedirectUrl({
          baseUrl: mmbUrl,
          lang: getStoredLanguage() || 'es',
          // El sitio de MMB no está publicado en todos los idiomas del producto:
          // langMap manda el francés a /en/ (VSTS 1301186). Los textos de ESTA
          // página siguen en francés; solo cambia el idioma del destino.
          langMap,
          // Y si algún idioma tiene un destino que no se arma desde la URL
          // compartida (otro host u otra ruta), su URL propia gana.
          urlByLang,
          pnr: sanitizePnr(pnrCode),
          lastName: lastName.trim(),
        });
        await onSubmit({ pnrCode, lastName, result: response.body });
        // Redirección misma pestaña; el loader queda visible hasta navegar.
        window.location.assign(url);
        return;
      }

      if (result === UPGRADE_RESULT.NOT_FOUND) {
        // CA-04: reserva no encontrada o apellido sin coincidencia también
        // marca ambos campos en estado error, además del modal.
        setErrors({ pnrCode: labels.notFoundPnrError, lastName: labels.notFoundLastNameError });
      }
      showLoader(false);
      setActiveModal(result);
      onError({ result, response });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[cabin-upgrade-form] validate failed:', error);
      showLoader(false);
      setActiveModal(UPGRADE_RESULT.ERROR);
      onError({ result: UPGRADE_RESULT.ERROR, error });
    }
    setIsSubmitting(false);
  };

  const containerClasses = `cabin-upgrade-form w-full ${customClassName}`.trim();
  const modalIconOverride = modalImageData?.src;

  return html`
    <form
      class=${containerClasses}
      onSubmit=${handleSubmit}
      data-name="cabinUpgradeForm"
      aria-label=${labels.formAriaLabel || 'Formulario de upgrade de cabina'}
      novalidate
      ...${rest}
    >
      <div class="flex gap-4 lg:flex-row flex-col w-full lg:min-h-[64px]">
        <div class="flex gap-4 lg:flex-row flex-col w-full">
          <div class="w-full">
            <${Input}
              id="pnr-code"
              name="pnrCode"
              label=${labels.pnrLabel}
              type="text"
              value=${pnrCode}
              onChange=${handlePnrChange}
              onKeyPress=${handlePnrKeyPress}
              required=${false}
              maxLength="6"
              state=${errors.pnrCode ? 'error' : 'normal'}
              helperText=${errors.pnrCode}
              prefixIconName="services/airplane-ticket"
              aria-required="true"
              aria-invalid=${errors.pnrCode ? 'true' : 'false'}
              aria-describedby=${errors.pnrCode ? 'pnr-error' : undefined}
              customClassName=${`[&>div]:!outline-[var(${errors.pnrCode ? '' : '--color-border-default'})]${errors.pnrCode ? ' [&>div]:!outline-[#FF1C46]' : ''} ${errors.pnrCode ? '[&_label]:!text-[var(--color-alert-error-icon-bg)]' : '[&_label]:!text-[var(--color-text-normal-primary)]'}`}
            />
          </div>

          <div class="w-full">
            <${Input}
              id="last-name"
              name="lastName"
              label=${labels.lastNameLabel}
              type="text"
              value=${lastName}
              onChange=${handleLastNameChange}
              onKeyPress=${handleLastNameKeyPress}
              required=${false}
              state=${errors.lastName ? 'error' : 'normal'}
              helperText=${errors.lastName || labels.lastNameHelper}
              prefixIconName="person-icon"
              aria-required="true"
              aria-invalid=${errors.lastName ? 'true' : 'false'}
              aria-describedby=${errors.lastName ? 'lastname-error' : undefined}
              customClassName=${`[&>div]:!outline-[var(${errors.lastName ? '' : '--color-border-default'})]${errors.lastName ? ' [&>div]:!outline-[#FF1C46]' : ''} ${errors.lastName ? '[&_label]:!text-[var(--color-alert-error-icon-bg)]' : '[&_label]:!text-[var(--color-text-normal-primary)]'}`}
            />
          </div>
        </div>

        <div class="flex items-center max-h-[4rem] w-full lg:w-auto">
          <${Button}
            type="submit"
            variant="primary"
            size="md"
            disabled=${isSubmitting}
            customClassName="w-full lg:w-auto whitespace-nowrap"
            aria-label=${labels.submitAriaLabel || 'Solicitar ascenso a Business Class'}
          >
            ${labels.buttonText}
          </${Button}>
        </div>
      </div>
    </form>

    <${FullPageLoader} isOpen=${isSubmitting && useFallbackLoader} label=${labels.loaderLabel} />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.NO_AVAILABILITY}
      onClose=${handleHighDemandClose}
      title=${labels.highDemandTitle}
      description=${modalDescription || labels.highDemandDescription}
      icon=${resolveModalIcon(UPGRADE_RESULT.NO_AVAILABILITY, labels.highDemandImage, modalIconOverride)}
      imageAlt=${labels.highDemandImageAlt || modalImageAlt}
      primaryButtonLabel=${labels.highDemandButton}
      onPrimaryClick=${handleHighDemandClose}
    />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.NOT_FOUND}
      onClose=${handleNotFoundClose}
      title=${labels.notFoundTitle}
      description=${labels.notFoundDescription}
      icon=${resolveModalIcon(UPGRADE_RESULT.NOT_FOUND, labels.notFoundImage, modalIconOverride)}
      imageAlt=${labels.notFoundImageAlt || modalImageAlt}
      primaryButtonLabel=${labels.notFoundButton}
      onPrimaryClick=${handleNotFoundClose}
    />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.ERROR}
      onClose=${closeModal}
      title=${labels.errorTitle}
      description=${labels.errorDescription}
      icon=${resolveModalIcon(UPGRADE_RESULT.ERROR, labels.errorImage, modalIconOverride)}
      imageAlt=${labels.errorImageAlt || modalImageAlt}
      primaryButtonLabel=${labels.errorButton}
      onPrimaryClick=${closeModal}
    />
  `;
};

export default CabinUpgradeForm;
