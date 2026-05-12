import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from '../../../atoms/inputs/input/input.js';
import { Button } from '../../../atoms/button/button.js';
import { ModalAviancaLayout } from '../../../molecules/modal/modal-avianca-layout.js';
import { fetchAEMData } from '../../../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

let i18Cache = null;
let i18FallbackCache = null;
const DEFAULT_CONFIG = {
  apiUrl: '',
  apiKey: '',
};
let environmentConfig = null;

/**
 * Gets cabin upgrade configuration from AEM environment file
 * @returns {Promise<Object>} Configuration object with apiUrl and apiKey
 */
async function getEnvironmentConfig() {
  if (environmentConfig) return environmentConfig;

  const config = await fetchAEMData('environment');
  environmentConfig = {
    apiUrl: config.data.find((item) => item.Key === 'AV_CABIN_UPGRADE_API_URL')?.Text ?? DEFAULT_CONFIG.apiUrl,
    apiKey: config.data.find((item) => item.Key === 'AV_CABIN_UPGRADE_API_KEY')?.Text ?? DEFAULT_CONFIG.apiKey,
  };
  return environmentConfig;
}

/**
 * Gets i18n label from cache, falling back to Spanish if not found
 * @param {string} key - i18n key
 * @param {string} fallback - Fallback text if key not found
 * @returns {string} Translated text or fallback
 */
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
 * CabinUpgradeForm - Formulario de upgrade de cabina para Avianca
 *
 * @param {Object} props - Component properties
 * @param {Function} [props.onSubmit] - Callback cuando se envía el formulario exitosamente
 * @param {Function} [props.onError] - Callback cuando hay un error (opcional)
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {Object} [props.rest] - Additional properties
 * @returns {import('preact').VNode} CabinUpgradeForm component
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [labels, setLabels] = useState({
    buttonText: '',
    pnrLabel: '',
    lastNameLabel: '',
    pnrError: '',
    lastNameError: '',
    modalErrorTitle: '',
    modalErrorDescription: '',
    modalErrorButtonText: '',
    formAriaLabel: '',
    submitAriaLabel: '',
  });

  // Load i18n labels
  useEffect(() => {
    const loadLabels = async () => {
      if (!i18Cache) {
        const cookieLanguage = getStoredLanguage() || 'es';
        const i18Data = await fetchAEMData(`${cookieLanguage}`);
        i18Cache = i18Data?.data || [];

        // Load Spanish as fallback for missing translations
        if (cookieLanguage !== 'es' && !i18FallbackCache) {
          const esFallback = await fetchAEMData('es');
          i18FallbackCache = esFallback?.data || [];
        }
      }

      setLabels({
        buttonText: getI18nLabel('cabinUpgradeForm.buttonText'),
        pnrLabel: getI18nLabel('cabinUpgradeForm.labels.pnr'),
        lastNameLabel: getI18nLabel('cabinUpgradeForm.labels.apellido'),
        pnrError: getI18nLabel('cabinUpgradeForm.error.pnr'),
        lastNameError: getI18nLabel('cabinUpgradeForm.error.apellido'),
        modalErrorTitle: getI18nLabel('cabinUpgradeForm.modalError.title'),
        modalErrorDescription: getI18nLabel('cabinUpgradeForm.modalError.description'),
        modalErrorButtonText: getI18nLabel('cabinUpgradeForm.modalError.buttonText'),
        formAriaLabel: getI18nLabel('cabinUpgradeForm.aria.form'),
        submitAriaLabel: getI18nLabel('cabinUpgradeForm.aria.submitButton'),
      });
    };

    loadLabels();
  }, []);

  const handlePnrKeyPress = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePnrChange = (value) => {
    const alphanumericOnly = value.replace(/[^a-zA-Z0-9]/g, '');
    setPnrCode(alphanumericOnly);
    if (errors.pnrCode && alphanumericOnly.length > 0) {
      setErrors((prev) => ({ ...prev, pnrCode: '' }));
    }
  };

  const handleLastNameKeyPress = (e) => {
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleLastNameChange = (value) => {
    const lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    setLastName(lettersOnly);
    if (errors.lastName && lettersOnly.length > 0) {
      setErrors((prev) => ({ ...prev, lastName: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { pnrCode: '', lastName: '' };
    if (!pnrCode.trim()) {
      newErrors.pnrCode = labels.pnrError;
    }
    if (!lastName.trim()) {
      newErrors.lastName = labels.lastNameError;
    }
    if (newErrors.pnrCode || newErrors.lastName) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const envConfig = await getEnvironmentConfig();

      const requestBody = {
        action: 'checkUpgradeEligibility',
        pnr: pnrCode,
        lastName,
        apiKey: envConfig.apiKey,
        language: getStoredLanguage() || 'es',
      };

      const response = await fetch(envConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.eligible === false) {
        setShowErrorModal(true);
        onError(result);
      } else if (result.offerUrl) {
        window.open(result.offerUrl, '_blank', 'noopener,noreferrer');
        await onSubmit({ pnrCode, lastName, result });
      } else {
        await onSubmit({ pnrCode, lastName, result });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting form:', error);
      setShowErrorModal(true);
      onError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerClasses = `cabin-upgrade-form w-full ${customClassName}`.trim();

  const modalIcon = modalImageData?.src || 'modals/upgrade-not-available';
  const modalDescriptionText = modalDescription || labels.modalErrorDescription;

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
              helperText=${errors.lastName}
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
            loading=${isSubmitting}
            customClassName="w-full lg:w-auto whitespace-nowrap"
            aria-label=${labels.submitAriaLabel || 'Buscar upgrade de cabina'}
          >
            ${labels.buttonText}
          </${Button}>
        </div>
      </div>
    </form>

    <${ModalAviancaLayout}
      isOpen=${showErrorModal}
      onClose=${() => setShowErrorModal(false)}
      title=${labels.modalErrorTitle}
      description=${modalDescriptionText}
      icon="${modalIcon}"
      primaryButtonLabel=${labels.modalErrorButtonText}
      onPrimaryClick=${() => setShowErrorModal(false)}
    />
  `;
};

export default CabinUpgradeForm;
