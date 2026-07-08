import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from '../../../atoms/inputs/input/input.js';
import { Button } from '../../../atoms/button/button.js';
import { fetchAEMData } from '../../../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

let ssciI18Cache = null;
let ssciI18FallbackCache = null;
let ssciEnvironmentConfig = null;

// Test-only: clears module-level caches so tests can re-exercise the
// i18n/environment loading flow with different mocks.
// Do not invoke from production code.
// eslint-disable-next-line no-underscore-dangle
export const __resetCachesForTests = () => {
  ssciI18Cache = null;
  ssciI18FallbackCache = null;
  ssciEnvironmentConfig = null;
};

// Hardcoded fallbacks, used ONLY when the author has not configured the
// environment.json keys yet. isProduction() picks the safe default per host.
const DEFAULT_URLS = {
  dev: 'https://controllercheckinnewqa.avtest.ink',
  prd: 'https://controllercheckinnew.avianca.com',
};

const DEFAULT_PATH = '/Checkin/Redirect';

function isProduction() {
  const host = window.location.hostname;
  return host === 'avianca.com' || host === 'www.avianca.com';
}

// Defensive .trim() on Key and Text — AEM spreadsheets sometimes contain
// invisible whitespace that breaks exact matching.
const findEnvKey = (config, k) => config?.data
  ?.find((item) => item.Key?.trim() === k)?.Text?.trim();

// Each AEM environment (dev/stage/prod) serves its own environment.json with a
// single AV_SSCI_URL / AV_SSCI_PATH already pointing to the right backend, so
// there is NO DEV/PRD switching here. isProduction() only selects the hardcoded
// fallback when the keys are missing. One fetch populates both fields.
async function loadSsciEnvironment() {
  if (ssciEnvironmentConfig) return ssciEnvironmentConfig;
  const config = await fetchAEMData('environment');
  const fallbackUrl = isProduction() ? DEFAULT_URLS.prd : DEFAULT_URLS.dev;
  ssciEnvironmentConfig = {
    baseUrl: findEnvKey(config, 'AV_SSCI_URL') ?? fallbackUrl,
    path: findEnvKey(config, 'AV_SSCI_PATH') ?? DEFAULT_PATH,
  };
  return ssciEnvironmentConfig;
}

async function getSsciBaseUrl() {
  const { baseUrl } = await loadSsciEnvironment();
  return baseUrl;
}

async function getSsciPath() {
  const { path } = await loadSsciEnvironment();
  return path;
}

function getI18nLabel(key, fallback = '') {
  if (ssciI18Cache) {
    const labelData = ssciI18Cache.find((item) => item.Key === key);
    if (labelData?.Text) return labelData.Text;
  }
  if (ssciI18FallbackCache) {
    const labelData = ssciI18FallbackCache.find((item) => item.Key === key);
    if (labelData?.Text) return labelData.Text;
  }
  return fallback;
}

/**
 * SSCIForm — Access form for Avianca's Self Service Check-In (SSCI).
 *
 * Like MMBForm, this form does NOT consume an API: it validates on the
 * frontend and redirects via deeplink with query params (`identifier`,
 * `lastName`, `lang`). PNR/booking existence validation is handled by the
 * SSCI system itself.
 *
 * Validation rules (PBI 1222767):
 *  - PNR: alphanumeric only, auto-uppercase, truncated to 6 characters.
 *  - Lastname: letters and spaces only (rejects Ñ, accents, digits, symbols),
 *    auto-uppercase.
 *
 * Iconography:
 * PNR and lastname icons are read from the i18n keys `ssciForm.icon.pnr`
 * and `ssciForm.icon.lastname`. If the key is missing, falls back to defaults
 * (`services/airplane-ticket` and `social/person`). Authors can change them
 * from the language spreadsheets without touching code.
 *
 * Helper text visibility per context is controlled via i18n:
 *   - `ssciForm.showHelperText.headerBanner` (default true)
 *   - `ssciForm.showHelperText.heroBanner` (default true)
 *   - `ssciForm.showHelperText.megamenu` (default false per Figma)
 * The container block declares its context via the `context` prop. The
 * `showHelperText` prop remains as an optional override for special cases
 * (tests, sample viewer, backwards-compat).
 *
 * Endpoint base URL and path come from `environment.json` keys
 * (`AV_SSCI_URL`, `AV_SSCI_PATH`). Each AEM environment ships its own
 * environment.json already pointing to the right backend, so there is no
 * DEV/PRD switching in code — hardcoded fallbacks apply only when the keys
 * are missing.
 *
 * @param {Object} props
 * @param {boolean} [props.openInNewTab] - DEPRECATED. The organism reads the flag from the
 *   i18n key `ssciForm.openInNewTab` (default `true` if missing). The prop is kept in the
 *   signature only for backwards-compat with tests/sample viewer; it is ignored at runtime.
 * @param {boolean} [props.simplified=false] - Compact mode (megamenu): no title or description
 * @param {boolean} [props.stackedLayout=false] - Stacked vertical layout: inputs and button
 *   always in a column (narrow spaces)
 * @param {boolean} [props.buttonBelow=false] - Force the button full-width below.
 *   Use it in narrow containers like the hero banner card (not inline at lg+).
 * @param {'headerBanner'|'heroBanner'|'megamenu'} [props.context='headerBanner'] - Container
 *   context. Determines which i18n key is read for showHelperText.
 * @param {boolean} [props.showHelperText] - Optional override. If passed, takes precedence
 *   over i18n. If NOT passed (undefined), the organism derives the flag from i18n + context.
 * @param {Function} [props.onSubmit] - Optional callback (analytics)
 * @param {string} [props.customClassName='']
 * @returns {import('preact').VNode}
 */
export const SSCIForm = ({
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
      if (!ssciI18Cache) {
        const cookieLanguage = getStoredLanguage() || 'es';
        const i18Data = await fetchAEMData(cookieLanguage);
        ssciI18Cache = i18Data?.data || [];

        if (cookieLanguage !== 'es' && !ssciI18FallbackCache) {
          const esFallback = await fetchAEMData('es');
          ssciI18FallbackCache = esFallback?.data || [];
        }
      }

      const showHelperKeyMap = {
        headerBanner: 'ssciForm.showHelperText.headerBanner',
        heroBanner: 'ssciForm.showHelperText.heroBanner',
        megamenu: 'ssciForm.showHelperText.megamenu',
      };
      const showHelperKey = showHelperKeyMap[context] || showHelperKeyMap.headerBanner;
      const defaultShowHelper = context !== 'megamenu' ? 'true' : 'false';
      const showHelperFromI18n = getI18nLabel(showHelperKey, defaultShowHelper)
        .trim()
        .toLowerCase() === 'true';
      const openInNewTabFromI18n = getI18nLabel('ssciForm.openInNewTab', 'true')
        .trim()
        .toLowerCase() === 'true';

      setLabels({
        title: getI18nLabel('ssciForm.title'),
        description: getI18nLabel('ssciForm.description'),
        pnrLabel: getI18nLabel('ssciForm.labels.pnr'),
        lastnameLabel: getI18nLabel('ssciForm.labels.lastname'),
        pnrPlaceholder: getI18nLabel('ssciForm.placeholders.pnr'),
        lastnamePlaceholder: getI18nLabel('ssciForm.placeholders.lastname'),
        pnrHelper: getI18nLabel('ssciForm.helperText.pnr'),
        lastnameHelper: getI18nLabel('ssciForm.helperText.lastname'),
        pnrError: getI18nLabel('ssciForm.error.pnr'),
        lastnameError: getI18nLabel('ssciForm.error.lastname'),
        buttonText: getI18nLabel('ssciForm.cta.buttonText'),
        pnrIcon: getI18nLabel('ssciForm.icon.pnr', 'services/airplane-ticket'),
        lastnameIcon: getI18nLabel('ssciForm.icon.lastname', 'social/person'),
        megamenuLabel: getI18nLabel('ssciForm.megamenuLabel'),
        showHelperTextI18n: showHelperFromI18n,
        openInNewTabI18n: openInNewTabFromI18n,
      });
    };

    loadLabels();
  }, [context]);

  const helperVisible = showHelperText ?? labels.showHelperTextI18n;
  // i18n is the only source of truth for openInNewTab. The `openInNewTab` prop is
  // intentionally ignored — the block models are generic shells that may host other
  // forms (e.g. cabin-upgrade, mmb) which manage their own redirect behavior.
  const newTabResolved = labels.openInNewTabI18n;

  const handlePnrKeyPress = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePnrChange = (value) => {
    const alphanumericOnly = value
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    setPnrCode(alphanumericOnly);
    if (errors.pnrCode && alphanumericOnly.length > 0) {
      setErrors((prev) => ({ ...prev, pnrCode: '' }));
    }
  };

  const handleLastNameKeyPress = (e) => {
    if (!/[a-zA-Z\s]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleLastNameChange = (value) => {
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
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

    const baseUrl = await getSsciBaseUrl();
    const path = await getSsciPath();
    const lang = getStoredLanguage() || 'es';
    const url = `${baseUrl}${path}?identifier=${encodeURIComponent(pnrCode)}&lastName=${encodeURIComponent(lastName)}&lang=${lang}`;

    window.open(url, newTabResolved ? '_blank' : '_self', 'noopener,noreferrer');
    onSubmit({ pnrCode, lastName, url });
  };

  const containerClasses = `ssci-form w-full ${customClassName}`.trim();

  return html`
    <form
      class=${containerClasses}
      onSubmit=${handleSubmit}
      data-name="ssciForm"
      aria-label=${labels.title || 'SSCI form'}
      novalidate
      ...${rest}
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
              id="ssci-pnr-code"
              name="pnrCode"
              label=${labels.pnrLabel}
              placeholder=${labels.pnrPlaceholder}
              type="text"
              maxLength=${6}
              value=${pnrCode}
              onChange=${handlePnrChange}
              onKeyPress=${handlePnrKeyPress}
              state=${errors.pnrCode ? 'error' : 'normal'}
              helperText=${errors.pnrCode || (helperVisible ? labels.pnrHelper : '')}
              prefixIconName=${labels.pnrIcon}
              aria-required="true"
              aria-invalid=${errors.pnrCode ? 'true' : 'false'}
              aria-describedby=${errors.pnrCode ? 'ssci-pnr-error' : 'ssci-pnr-helper'}
            />
          </div>

          <div class="w-full min-w-[184px] flex-1">
            <${Input}
              id="ssci-last-name"
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
              aria-describedby=${errors.lastName ? 'ssci-lastname-error' : 'ssci-lastname-helper'}
            />
          </div>
        </div>

        <div class=${`flex items-center ${stackedLayout || buttonBelow ? 'w-full' : 'max-h-[4rem] w-full lg:w-auto'}`}>
          <${Button}
            type="submit"
            variant="primary"
            size="md"
            customClassName=${`${stackedLayout || buttonBelow ? 'w-full' : 'w-full lg:w-auto'} whitespace-nowrap`}
            aria-label=${labels.buttonText || 'Continuar a SSCI'}
          >
            ${labels.buttonText}
          </${Button}>
        </div>
      </div>
    </form>
  `;
};

export default SSCIForm;
