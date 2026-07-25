import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from '../../../atoms/inputs/input/input.js';
import { Button } from '../../../atoms/button/button.js';
import { ModalAviancaLayout } from '../../../molecules/modal/modal-avianca-layout.js';
import { FullPageLoader } from '../../../molecules/full-page-loader/full-page-loader.js';
import { fetchAEMData } from '../../../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';
import { validateUpgrade, getUpgradesConfig } from '../../../../scripts/services/upgrades/upgrades.service.js';
import { mapValidateResult, buildMmbRedirectUrl, UPGRADE_RESULT } from '../../../../scripts/services/upgrades/upgrades-result.js';
import { showLoader, updateLoaderText } from '../../../../scripts/services/loader/loader.service.js';

const html = htm.bind(h);

let i18Cache = null;
let i18FallbackCache = null;

export const sanitizePnr = (value) => String(value ?? '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toUpperCase()
  .slice(0, 6);

export const sanitizeLastName = (value) => String(value ?? '')
  .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');

function getI18nLabel(key, fallback = '') {
  if (i18Cache) {
    const labelData = i18Cache.find((item) => item.Key === key);
    if (labelData?.Text) return labelData.Text;
  }
  if (i18FallbackCache) {
    const labelData = i18FallbackCache.find((item) => item.Key === key);
    if (labelData?.Text) return labelData.Text;
  }
  return fallback;
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
        notFoundPnrError: getI18nLabel('cabinUpgradeForm.error.pnrNotFound', 'Revisa el código de tu reserva'),
        notFoundLastNameError: getI18nLabel('cabinUpgradeForm.error.apellidoNotFound', 'Revisa el apellido'),
        formAriaLabel: getI18nLabel('cabinUpgradeForm.aria.form', 'Formulario de upgrade de cabina'),
        submitAriaLabel: getI18nLabel('cabinUpgradeForm.aria.submitButton', 'Solicitar ascenso a Business Class'),
      });
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
    if (hasCmsLoader) {
      updateLoaderText(labels.loaderLabel || 'Cargando...');
    }
    setUseFallbackLoader(!hasCmsLoader);
    try {
      const response = await validateUpgrade({ pnr: pnrCode });
      const result = mapValidateResult({ ...response, lastName });

      if (result === UPGRADE_RESULT.ELIGIBLE) {
        const { mmbUrl } = await getUpgradesConfig();
        const url = buildMmbRedirectUrl({
          baseUrl: mmbUrl,
          lang: getStoredLanguage() || 'es',
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
  const modalIcon = modalImageData?.src || 'modals/upgrade-not-available';

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
      icon=${modalIcon}
      imageAlt=${modalImageAlt}
      primaryButtonLabel=${labels.highDemandButton}
      onPrimaryClick=${handleHighDemandClose}
    />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.NOT_FOUND}
      onClose=${handleNotFoundClose}
      title=${labels.notFoundTitle}
      description=${labels.notFoundDescription}
      icon=${modalIcon}
      primaryButtonLabel=${labels.notFoundButton}
      onPrimaryClick=${handleNotFoundClose}
    />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.ERROR}
      onClose=${closeModal}
      title=${labels.errorTitle}
      description=${labels.errorDescription}
      icon=${modalIcon}
      primaryButtonLabel=${labels.errorButton}
      onPrimaryClick=${closeModal}
    />
  `;
};

export default CabinUpgradeForm;
