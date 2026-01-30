import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Select } from '../../../atoms/inputs/select/select.js';
import { Button } from '../../../atoms/button/button.js';
import { Icon } from '../../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * PosForm Component - Point of Sale form for country/language selection
 *
 * @param {Object} props - Component properties
 * @param {Array} props.countries - Array of countries with optional flag emoji
 * @param {Array} props.languages - Array of languages
 * @param {string} [props.initialCountry=''] - Initial selected country value
 * @param {string} [props.initialLanguage=''] - Initial selected language value
 * @param {Function} [props.onClose] - Callback when close button is clicked
 * @param {Function} [props.onConfirm] - Callback when form is submitted
 * @param {Object} [props.labels=null] - Object with custom labels (optional)
 * @param {string} [props.countryPlaceholder] - Placeholder for country select
 * @param {string} [props.languagePlaceholder] - Placeholder for language select
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {Object} props.rest - Additional HTML attributes
 * @returns {import('preact').VNode}
 */
export const PosForm = ({
  countries = [],
  languages = [],
  initialCountry = '',
  initialLanguage = '',
  onClose,
  onConfirm,
  title = null,
  countryLabel = null,
  countryPlaceholder = 'Seleccionar país/región',
  languageLabel = null,
  languagePlaceholder = 'Seleccionar idioma',
  confirmButtonText = null,
  customClassName = '',
  isDropdown = false,
  showCloseButton = true,
  responsiveMode = false,
  ...rest
}) => {
  // Use default values if labels are null or empty string
  const finalTitle = (title && title.trim()) || 'Selecciona tu ubicación e idioma';
  const finalCountryLabel = (countryLabel && countryLabel.trim()) || 'Seleccionar país/región';
  const finalLanguageLabel = (languageLabel && languageLabel.trim()) || 'Seleccionar idioma';
  const finalConfirmButtonText = (confirmButtonText && confirmButtonText.trim()) || 'Confirmar';

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  // Update when initial values change
  useEffect(() => {
    setSelectedCountry(initialCountry);
  }, [initialCountry]);

  useEffect(() => {
    setSelectedLanguage(initialLanguage);
  }, [initialLanguage]);

  // Determine if form is valid
  const isFormValid = selectedCountry && selectedLanguage;

  // Get display value for country (with flag if available)
  // eslint-disable-next-line no-unused-vars
  const getCountryDisplayValue = () => {
    const country = countries.find((c) => c.value === selectedCountry);
    return country ? country.label : '';
  };

  // Get display value for language
  // eslint-disable-next-line no-unused-vars
  const getLanguageDisplayValue = () => {
    const language = languages.find((l) => l.value === selectedLanguage);
    return language ? language.label : '';
  };

  // Handle country change
  const handleCountryChange = (value) => {
    setSelectedCountry(value);
  };

  // Handle language change
  const handleLanguageChange = (value) => {
    setSelectedLanguage(value);
  };

  // Handle form submission
  const handleConfirm = (e) => {
    e.preventDefault();

    if (isFormValid && onConfirm) {
      onConfirm({
        country: selectedCountry,
        language: selectedLanguage,
      });
    }
  };

  // Handle close
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Reorder options to show selected item first
  const getOrderedCountries = () => {
    if (!selectedCountry || countries.length === 0) return countries;

    const selectedIndex = countries.findIndex((c) => c.value === selectedCountry);
    if (selectedIndex === -1) return countries;

    // Create a new array with selected item first
    const ordered = [...countries];
    const [selectedItem] = ordered.splice(selectedIndex, 1);
    return [selectedItem, ...ordered];
  };

  const getOrderedLanguages = () => {
    if (!selectedLanguage || languages.length === 0) return languages;

    const selectedIndex = languages.findIndex((l) => l.value === selectedLanguage);
    if (selectedIndex === -1) return languages;

    // Create a new array with selected item first
    const ordered = [...languages];
    const [selectedItem] = ordered.splice(selectedIndex, 1);
    return [selectedItem, ...ordered];
  };

  // Determine state for selects - always use 'normal' to avoid permanent green border
  const countryState = 'normal';
  const languageState = 'normal';

  return html`
    <div
      class=${`w-full flex flex-col gap-[24px] ${isDropdown ? '!border-[1px] !border-[solid] !border-[black]' : ''} ${customClassName}`}
      data-name="posForm"
      ...${rest}
    >
      <!-- Header with Title and Close Button -->
      <div class="flex items-center justify-between">
        <h2 class="!text-[16px] !m-0 font-semibold text-[var(--text-normal-primary)] flex-1">
          ${finalTitle}
        </h2>
        ${showCloseButton && html`
        <${Button}
          onClick=${handleClose}
          variant="transparent"
          size="xxxs"
          iconOnly=${true}
          customClassName="w-6 h-6 flex items-center justify-center transition-colors duration-200 hover:!bg-[#D9D9D9] active:!bg-[#B8B8B8] !rounded-[12px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.6666 4.27301L11.7266 3.33301L7.99992 7.05967L4.27325 3.33301L3.33325 4.27301L7.05992 7.99967L3.33325 11.7263L4.27325 12.6663L7.99992 8.93967L11.7266 12.6663L12.6666 11.7263L8.93992 7.99967L12.6666 4.27301Z" fill="#1B1B1B"/>
          </svg>
        </${Button}>
        `}
      </div>

      <!-- Form -->
      <form onSubmit=${handleConfirm} class=${`flex flex-col gap-6 ${responsiveMode ? 'lg:gap-6 ' : ''}`}>
        <!-- Selects Container - Row on large screens only if responsiveMode is true -->
        <div class=${`flex flex-col gap-6 leading-[auto] ${responsiveMode ? 'lg:flex-row lg:gap-6' : ''}`}>
          <!-- Country/Region Select -->
          <div class=${responsiveMode ? 'flex-1' : ''}>
            <${Select}
              label=${finalCountryLabel}
              labelClassName="left-[1rem] top-[0.625rem] leading-[1.125rem]"
              placeholder=${countryPlaceholder}
              options=${getOrderedCountries()}
              value=${selectedCountry}
              onChange=${handleCountryChange}
              state=${countryState}
              required=${true}
              id="pos-country"
              hasPrefixIcon=${false}
              dropdownMaxHeight="13.813rem"
              name="country"
            />
          </div>

          <!-- Language Select -->
          <div class=${responsiveMode ? 'flex-1' : ''}>
            <${Select}
              label=${finalLanguageLabel}
              labelClassName="left-[1rem] top-[0.625rem] leading-[1.125rem]"
              placeholder=${languagePlaceholder}
              options=${getOrderedLanguages()}
              value=${selectedLanguage}
              onChange=${handleLanguageChange}
              state=${languageState}
              required=${true}
              id="pos-language"
              name="language"
              hasPrefixIcon=${false}
            />
          </div>
        </div>

        <!-- Confirm Button - Right aligned on large screens only if responsiveMode is true -->
        <div class=${`w-full ${responsiveMode ? 'lg:flex lg:justify-end' : ''}`}>
          <${Button}
            type="submit"
            variant="primary"
            size="md"
            disabled=${!isFormValid}
            customClassName=${`w-full ${responsiveMode ? 'lg:w-auto' : ''} h-[52px] [&>span]:text-[20px] [&>span]:font-[700] [&:hover]:scale-100`}
          >
            ${finalConfirmButtonText}
          </${Button}>
        </div>
      </form>
    </div>
  `;
};

export default PosForm;
