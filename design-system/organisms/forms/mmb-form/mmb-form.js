import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from '../../../atoms/inputs/input/input.js';
import { Button } from '../../../atoms/button/button.js';
import { fetchAEMData } from '../../../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';
import { sanitizeSpreadProps } from '../../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

let i18Cache = null;
let i18FallbackCache = null;
let environmentConfig = null;

// Test-only: clears module-level caches so tests can re-exercise the
// i18n/environment loading flow with different mocks.
// Do not invoke from production code.
// eslint-disable-next-line no-underscore-dangle
export const __resetCachesForTests = () => {
  i18Cache = null;
  i18FallbackCache = null;
  environmentConfig = null;
};

const DEFAULT_URLS = {
  dev: 'https://managemybookingqa.avtest.ink',
  prd: 'https://gestiona.avianca.com',
};

function isProduction() {
  const host = window.location.hostname;
  return host === 'avianca.com' || host === 'www.avianca.com';
}

async function getMmbBaseUrl() {
  if (environmentConfig) return environmentConfig;
  const config = await fetchAEMData('environment');
  // Defensive .trim() on Key and Text — AEM spreadsheets sometimes contain
  // invisible whitespace that breaks exact matching.
  const findKey = (k) => config?.data?.find((item) => item.Key?.trim() === k)?.Text?.trim();
  const devUrl = findKey('AV_MMB_URL_DEV') ?? DEFAULT_URLS.dev;
  const prdUrl = findKey('AV_MMB_URL_PRD') ?? DEFAULT_URLS.prd;
  environmentConfig = isProduction() ? prdUrl : devUrl;
  return environmentConfig;
}

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
 * MMBForm — Access form for Avianca's Manage My Booking (MMB).
 *
 * Unlike cabin-upgrade-form, this form does NOT consume an API:
 * it validates on the frontend and redirects via deeplink with query params.
 * PNR existence validation is handled by the MMB system itself.
 *
 * Iconography (PBI 1222453, CU-202 CA3/CA4 — "configurable iconography"):
 * PNR and lastname icons are read from the i18n keys `mmbForm.icon.pnr`
 * and `mmbForm.icon.lastname`. If the key is missing, falls back to defaults
 * (`services/airplane-ticket` and `social/person`). Authors can change them
 * from the language spreadsheets without touching code.
 *
 * Helper text (PBI 1222453):
 * helper text visibility per context is controlled via i18n:
 *   - `mmbForm.showHelperText.headerBanner` (default true)
 *   - `mmbForm.showHelperText.heroBanner` (default true)
 *   - `mmbForm.showHelperText.megamenu` (default false per Figma)
 * The container block declares its context via the `context` prop. The
 * `showHelperText` prop remains as an optional override for special cases
 * (tests, sample viewer, backwards-compat).
 *
 * @param {Object} props
 * @param {boolean} [props.openInNewTab] - DEPRECATED. The organism reads the flag from the
 *   i18n key `mmbForm.openInNewTab` (default `true` if missing). The prop is kept in the
 *   signature only for backwards-compat with tests/sample viewer; it is ignored at runtime.
 * @param {boolean} [props.simplified=false] - Compact mode (megamenu): no title or description
 * @param {boolean} [props.stackedLayout=false] - Stacked vertical layout: inputs and button
 *   always in a column (narrow spaces)
 * @param {boolean} [props.buttonBelow=false] - Force the button full-width below (not inline at lg+).
 *   Use it in narrow containers like the hero banner card
 * @param {'headerBanner'|'heroBanner'|'megamenu'} [props.context='headerBanner'] - Container
 *   context. Determines which i18n key is read for showHelperText.
 * @param {boolean} [props.showHelperText] - Optional override. If passed, takes precedence
 *   over i18n. If NOT passed (undefined), the organism derives the flag from i18n + context.
 * @param {Function} [props.onSubmit] - Optional callback (analytics)
 * @param {string} [props.customClassName='']
 * @returns {import('preact').VNode}
 */
export const MMBForm = ({
  openInNewTab,
  simplified = false,
  stackedLayout = false,
  buttonBelow = false,
  context = 'headerBanner',
  showHelperText,
  onSubmit = () => {},
  customClassName = '',
  ...rest
}) => {
  const [pnrCode, setPnrCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState({ pnrCode: '', lastName: '' });
  const [labels, setLabels] = useState({
    title: '',
    description: '',
    pnrLabel: '',
    lastnameLabel: '',
    pnrPlaceholder: '',
    lastnamePlaceholder: '',
    pnrHelper: '',
    lastnameHelper: '',
    pnrError: '',
    lastnameError: '',
    buttonText: '',
    pnrIcon: 'services/airplane-ticket',
    lastnameIcon: 'social/person',
    megamenuLabel: '',
    showHelperTextI18n: context !== 'megamenu',
    openInNewTabI18n: true,
  });

  useEffect(() => {
    const loadLabels = async () => {
      if (!i18Cache) {
        const cookieLanguage = getStoredLanguage() || 'es';
        const i18Data = await fetchAEMData(cookieLanguage);
        i18Cache = i18Data?.data || [];

        if (cookieLanguage !== 'es' && !i18FallbackCache) {
          const esFallback = await fetchAEMData('es');
          i18FallbackCache = esFallback?.data || [];
        }
      }

      const showHelperKeyMap = {
        headerBanner: 'mmbForm.showHelperText.headerBanner',
        heroBanner: 'mmbForm.showHelperText.heroBanner',
        megamenu: 'mmbForm.showHelperText.megamenu',
      };
      const showHelperKey = showHelperKeyMap[context] || showHelperKeyMap.headerBanner;
      const defaultShowHelper = context !== 'megamenu' ? 'true' : 'false';
      const showHelperFromI18n = getI18nLabel(showHelperKey, defaultShowHelper)
        .trim()
        .toLowerCase() === 'true';
      const openInNewTabFromI18n = getI18nLabel('mmbForm.openInNewTab', 'true')
        .trim()
        .toLowerCase() === 'true';

      setLabels({
        title: getI18nLabel('mmbForm.title'),
        description: getI18nLabel('mmbForm.description'),
        pnrLabel: getI18nLabel('mmbForm.labels.pnr'),
        lastnameLabel: getI18nLabel('mmbForm.labels.lastname'),
        pnrPlaceholder: getI18nLabel('mmbForm.placeholders.pnr'),
        lastnamePlaceholder: getI18nLabel('mmbForm.placeholders.lastname'),
        pnrHelper: getI18nLabel('mmbForm.helperText.pnr'),
        lastnameHelper: getI18nLabel('mmbForm.helperText.lastname'),
        pnrError: getI18nLabel('mmbForm.error.pnr'),
        lastnameError: getI18nLabel('mmbForm.error.lastname'),
        buttonText: getI18nLabel('mmbForm.cta.buttonText'),
        pnrIcon: getI18nLabel('mmbForm.icon.pnr', 'services/airplane-ticket'),
        lastnameIcon: getI18nLabel('mmbForm.icon.lastname', 'social/person'),
        megamenuLabel: getI18nLabel('mmbForm.megamenuLabel'),
        showHelperTextI18n: showHelperFromI18n,
        openInNewTabI18n: openInNewTabFromI18n,
      });
    };

    loadLabels();
  }, [context]);

  const helperVisible = showHelperText ?? labels.showHelperTextI18n;
  // i18n is the only source of truth for openInNewTab. The `openInNewTab` prop is
  // intentionally ignored — the block models are generic shells that may host other
  // forms (e.g. cabin-upgrade) which manage their own redirect behavior.
  const newTabResolved = labels.openInNewTabI18n;

  const handlePnrKeyPress = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePnrChange = (value) => {
    const alphanumericOnly = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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
    if (!pnrCode.trim()) newErrors.pnrCode = labels.pnrError;
    if (!lastName.trim()) newErrors.lastName = labels.lastnameError;

    if (newErrors.pnrCode || newErrors.lastName) {
      setErrors(newErrors);
      return;
    }

    const baseUrl = await getMmbBaseUrl();
    const lang = getStoredLanguage() || 'es';
    const url = `${baseUrl}/${lang}?pnr=${encodeURIComponent(pnrCode)}&lastname=${encodeURIComponent(lastName)}`;

    window.open(url, newTabResolved ? '_blank' : '_self', 'noopener,noreferrer');
    onSubmit({ pnrCode, lastName, url });
  };

  const containerClasses = `mmb-form w-full ${customClassName}`.trim();

  return html`
    <form
      class=${containerClasses}
      onSubmit=${handleSubmit}
      data-name="mmbForm"
      aria-label=${labels.title || 'MMB form'}
      novalidate
      ...${sanitizeSpreadProps(rest)}
    >
      ${context === 'megamenu' && labels.megamenuLabel && html`
        <p class="font-bold leading-[100%] tracking-normal text-[#2B3C46] !mt-0 !mb-6">
          ${labels.megamenuLabel}
        </p>
      `}

      ${!simplified && (labels.title || labels.description) && html`
        <div class="flex flex-col gap-1 mb-6">
          ${labels.title && html`
            <h2 class="!m-0 text-text-normal-primary !font-bold">${labels.title}</h2>
          `}
          ${labels.description && html`
            <p class="!m-0 text-text-normal-primary !font-normal leading-6">${labels.description}</p>
          `}
        </div>
      `}

      <div class=${`flex gap-4 w-full ${stackedLayout || buttonBelow ? 'flex-col gap-6' : 'lg:flex-row flex-col lg:min-h-[64px]'}`}>
        <div class=${`flex gap-4 w-full ${stackedLayout ? 'flex-col' : 'flex-col md:flex-row'}`}>
          <div class="w-full min-w-[184px] flex-1">
            <${Input}
              id="mmb-pnr-code"
              name="pnrCode"
              label=${labels.pnrLabel}
              placeholder=${labels.pnrPlaceholder}
              type="text"
              value=${pnrCode}
              onChange=${handlePnrChange}
              onKeyPress=${handlePnrKeyPress}
              state=${errors.pnrCode ? 'error' : 'normal'}
              helperText=${errors.pnrCode || (helperVisible ? labels.pnrHelper : '')}
              prefixIconName=${labels.pnrIcon}
              aria-required="true"
              aria-invalid=${errors.pnrCode ? 'true' : 'false'}
              aria-describedby=${errors.pnrCode ? 'mmb-pnr-error' : 'mmb-pnr-helper'}
            />
          </div>

          <div class="w-full min-w-[184px] flex-1">
            <${Input}
              id="mmb-last-name"
              name="lastName"
              label=${labels.lastnameLabel}
              placeholder=${labels.lastnamePlaceholder}
              type="text"
              value=${lastName}
              onChange=${handleLastNameChange}
              onKeyPress=${handleLastNameKeyPress}
              state=${errors.lastName ? 'error' : 'normal'}
              helperText=${errors.lastName || (helperVisible ? labels.lastnameHelper : '')}
              prefixIconName=${labels.lastnameIcon}
              aria-required="true"
              aria-invalid=${errors.lastName ? 'true' : 'false'}
              aria-describedby=${errors.lastName ? 'mmb-lastname-error' : 'mmb-lastname-helper'}
            />
          </div>
        </div>

        <div class=${`flex items-center ${stackedLayout || buttonBelow ? 'w-full' : 'max-h-[4rem] w-full lg:w-auto'}`}>
          <${Button}
            type="submit"
            variant="primary"
            size="md"
            customClassName=${`${stackedLayout || buttonBelow ? 'w-full' : 'w-full lg:w-auto'} whitespace-nowrap`}
            aria-label=${labels.buttonText || 'Continuar a MMB'}
          >
            ${labels.buttonText}
          </${Button}>
        </div>
      </div>
    </form>
  `;
};

export default MMBForm;
