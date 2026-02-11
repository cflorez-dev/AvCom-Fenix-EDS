import { h } from '@dropins/tools/preact.js';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Incrementer } from '../../atoms/incrementer/incrementer.js';
import { Icon } from '../../atoms/icon/icon.js';
import { Button } from '../../atoms/button/button.js';
import { Alert } from '../alert/alert.js';
import { processContentHTML } from '../../helpers/process-content-html.js';

const html = htm.bind(h);

// Validation constants
const MIN_ADULTS = 1;
const MAX_ADULTS = 9;
const MAX_YOUTH_CHILDREN = 8;
const MAX_TOTAL_PASSENGERS = 9;

/**
 * PassengerSelector - Passenger selector with popup/modal based on device
 *
 * ## Props
 * - `value`: `object` – Object with passenger count:
 *    { adults, youth, children, infants, cabinClass }.
 * - `onChange`: `function` – Callback when passengers change (passengerData) => void.
 * - `onError`: `function` – Callback when validation error occurs (errorMessage) => void.
 * - `showCabinClass`: `boolean` – Show cabin class selector (default: true).
 * - `isStandalone`: `boolean` – If true, shows complete header on mobile.
 *        If false, BookingBox controls the header (default: true).
 * - `onBack`: `function` – Callback for back button (when controlled by BookingBox).
 *        If not provided, closes the modal.
 * - `onClose`: `function` – Callback for close/X button (when controlled by BookingBox).
 *        If not provided, closes the modal.
 * - `stepTitle`: `string` – Step title (default: 'Who is flying?').
 * - `showHeader`: `boolean` – Show header on mobile (default: true when isStandalone=true).
 * - `customClassName`: `string` – Additional CSS classes.
 * - `...rest`: Other properties.
 *
 * ## Design (Figma)
 * - Trigger: node-id 2742-5013 - Input with icon and count
 * - Desktop Popup: node-id 2742-5015 - Dropdown with list and radio buttons
 * - Mobile Modal: node-id 2742-5044 - Full screen with header
 *
 * ## Validation Rules
 * 1. **Adults**: 1-9 (minimum 1, maximum 9 considering other passengers)
 * 2. **Youth + Children**: Maximum 8 total
 * 3. **Infants**: Maximum 1 per adult
 * 4. **Total passengers**: Maximum 9 (adults + youth + children, not counting infants)
 *
 * ## Data Structure
 * ```javascript
 * {
 *   adults: 1,      // 12+ años (1-9)
 *   youth: 0,       // 12-17 años (0-8)
 *   children: 0,    // 2-11 años (0-8)
 *   infants: 0,     // 0-2 años (0-adults)
 *   cabinClass: 'economy' // 'economy' | 'business'
 * }
 * ```
 *
 * ## Usage Example
 *
 * ### Standalone Mode (independent use)
 * ```javascript
 * <${PassengerSelector}
 *   value=${passengers}
 *   onChange=${setPassengers}
 *   onError=${handleError}
 *   showCabinClass=${true}
 *   isStandalone=${true}
 * />
 * ```
 *
 * ### Step Mode (inside BookingBox)
 * ```javascript
 * <${PassengerSelector}
 *   value=${passengers}
 *   onChange=${setPassengers}
 *   onError=${handleError}
 *   showCabinClass=${true}
 *   isStandalone=${false}
 *   showHeader=${false}
 *   onBack=${handlePreviousStep}
 *   onClose=${handleCloseBookingBox}
 *   stepTitle="¿Quiénes vuelan?"
 * />
 * ```
 */
export const PassengerSelector = ({
  value = {
    adults: 1, youth: 0, children: 0, infants: 0, cabinClass: 'economy',
  },
  onChange,
  onError,
  showCabinClass = true,
  onBack,
  onClose,
  stepTitle = '¿Quiénes vuelan?',
  showHeader = true,
  customClassName = '',
  isOpen: isOpenProp,
  onOpenChange,
  dropdownPositionStyles = 'top-[calc(100%+8px)] left-0',
  containerRelative = true,
  i18n = {},
  ...rest
}) => {
  const [passengers, setPassengers] = useState({
    adults: 1,
    youth: 0,
    children: 0,
    infants: 0,
    ...value,
    cabinClass: value?.cabinClass || 'economy',
  });
  const [validationError, setValidationError] = useState(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  const [isMobile, setIsMobile] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Click outside and escape key handlers
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (isMobile) return;

      if (dropdownRef.current
          && !dropdownRef.current.contains(event.target)
          && triggerRef.current
          && !triggerRef.current.contains(event.target)) {
        if (isOpenProp === undefined) {
          setInternalIsOpen(false);
        }
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isOpenProp === undefined) {
          setInternalIsOpen(false);
        }
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (isMobile) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, isMobile, isOpenProp, onOpenChange]);

  // Sync external value with internal state
  useEffect(() => {
    setPassengers({
      adults: 1,
      youth: 0,
      children: 0,
      infants: 0,
      ...value,
      cabinClass: value?.cabinClass || 'economy',
    });
  }, [value]);

  // Validate passengers
  const validatePassengers = useCallback((newPassengers) => {
    const {
      adults, youth, children, infants,
    } = newPassengers;

    // Regla 1: Adultos 1-9
    if (adults < MIN_ADULTS) {
      return (i18n['bookingBox.validation.minAdults'] || 'Debe haber al menos {count} adulto').replace('{count}', MIN_ADULTS);
    }
    if (adults > MAX_ADULTS) {
      return (i18n['bookingBox.validation.maxAdults'] || 'Máximo {count} adultos permitidos').replace('{count}', MAX_ADULTS);
    }

    // Regla 2: Youth + Children máx 8
    if (youth + children > MAX_YOUTH_CHILDREN) {
      return (i18n['bookingBox.validation.maxYouthChildren'] || 'Máximo {count} jóvenes y niños en total').replace('{count}', MAX_YOUTH_CHILDREN);
    }

    // Regla 3: Infants máx 1 por adulto
    if (infants > adults) {
      const infantLabel = adults === 1 ? (i18n['bookingBox.labels.infant'] || 'infante') : (i18n['bookingBox.labels.infants'] || 'infantes');
      return (i18n['bookingBox.validation.maxInfants'] || 'Máximo {count} {count, plural, one {infante} other {infantes}} (1 por adulto)').replace('{count}', adults).replace('{count, plural, one {infante} other {infantes}}', infantLabel);
    }

    // Regla 4: Total pasajeros máx 9 (SIN contar infantes)
    const total = adults + youth + children;
    if (total > MAX_TOTAL_PASSENGERS) {
      return (i18n['bookingBox.validation.maxTotalPassengers'] || 'Máximo {count} pasajeros en total').replace('{count}', MAX_TOTAL_PASSENGERS);
    }

    return null;
  }, [i18n]);

  // Handler for changes (now only updates temporary state)
  const handlePassengerChange = useCallback((type, newValue) => {
    const newPassengers = {
      ...passengers,
      [type]: Number(newValue),
    };

    // Si se reducen adultos, auto-reducir infantes si exceden el nuevo número de adultos
    if (type === 'adults' && newPassengers.infants > Number(newValue)) {
      newPassengers.infants = Number(newValue);
    }

    setPassengers(newPassengers);

    // Validar
    const error = validatePassengers(newPassengers);
    setValidationError(error);

    if (error && onError) {
      onError(error);
    }

    // On desktop: update immediately without confirming
    if (!isMobile && !error && onChange) {
      onChange(newPassengers);
    }
  }, [passengers, validatePassengers, onError, isMobile, onChange]);

  const handleCabinClassChange = useCallback((selectedClass) => {
    const newPassengers = {
      ...passengers,
      cabinClass: selectedClass,
    };

    setPassengers(newPassengers);

    // On desktop: update immediately without confirming
    if (!isMobile && onChange) {
      onChange(newPassengers);
    }
  }, [passengers, isMobile, onChange]);

  const handleConfirm = useCallback(() => {
    // Validate before confirming
    const error = validatePassengers(passengers);
    if (!error && onChange) {
      onChange(passengers);
      if (isOpenProp === undefined) {
        setInternalIsOpen(false);
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  }, [validatePassengers, passengers, onChange, isOpenProp, onOpenChange]);

  const handleTriggerClick = useCallback(() => {
    const newIsOpen = !isOpen;
    if (isOpenProp === undefined) {
      setInternalIsOpen(newIsOpen);
    }
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  }, [isOpen, isOpenProp, onOpenChange]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      if (isOpenProp === undefined) {
        setInternalIsOpen(false);
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  }, [onBack, isOpenProp, onOpenChange]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      if (isOpenProp === undefined) {
        setInternalIsOpen(false);
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  }, [onClose, isOpenProp, onOpenChange]);

  // Calculate trigger text (memoized)
  const getDisplayText = useMemo(() => {
    const total = passengers.adults + passengers.youth + passengers.children + passengers.infants;

    // Desktop: Solo mostrar el número total
    if (!isMobile) {
      return total === 1 ? '1' : String(total);
    }

    // Mobile: Mostrar breakdown detallado
    if (total === 1) {
      return `1 ${i18n['bookingBox.labels.adult'] || 'Adulto'}`;
    }
    const parts = [];
    if (passengers.adults > 0) parts.push(`${passengers.adults} ${passengers.adults === 1 ? (i18n['bookingBox.labels.adult'] || 'Adulto') : (i18n['bookingBox.labels.adults'] || 'Adultos')}`);
    if (passengers.youth > 0) parts.push(`${passengers.youth} ${passengers.youth === 1 ? 'Joven' : (i18n['bookingBox.labels.youth'] || 'Jóvenes')}`);
    if (passengers.children > 0) parts.push(`${passengers.children} ${passengers.children === 1 ? (i18n['bookingBox.labels.child'] || 'Niño') : (i18n['bookingBox.labels.children'] || 'Niños')}`);
    if (passengers.infants > 0) parts.push(`${passengers.infants} ${passengers.infants === 1 ? (i18n['bookingBox.labels.infant'] || 'Bebé') : (i18n['bookingBox.labels.infants'] || 'Bebés')}`);
    return parts.join(', ');
  }, [passengers, isMobile, i18n]);

  // Calculate totals (infants DO NOT count towards limit of 9)
  const totalPassengers = useMemo(
    () => passengers.adults + passengers.youth + passengers.children,
    [passengers.adults, passengers.youth, passengers.children],
  );

  // Process groupTravelLink HTML so <a> get LinkButton styles (process-content-html)
  const groupTravelLinkProcessed = useMemo(() => {
    const processed = processContentHTML(
      i18n['bookingBox.labels.groupTravelLink'] || '',
      'informative',
      { linkButtonOptions: { customClassName: '!text-[14px]' } },
    );
    // Normalize link text size: replace 16px with 14px (LinkButton default can be 16px)
    return processed
      .replace(/\b!?text-\[16px\]/g, 'text-[14px]')
      .replace(/\b!?text-\[1rem\]/g, 'text-[14px]');
  }, [i18n['bookingBox.labels.groupTravelLink']]);

  // Performance: Radio Button Component optimizado
  const RadioButton = ({ label, checked, onClick }) => {
    // Performance: Pre-calculate classes
    const buttonClasses = useMemo(
      () => 'flex items-center gap-2 cursor-pointer transition-opacity duration-200 hover:opacity-80',
      [],
    );
    const outerCircleClasses = useMemo(
      () => 'bg-[var(--bg-brand-secondary-default)] rounded-[32px] inline-flex justify-center items-center',
      [],
    );
    const middleCircleClasses = useMemo(
      () => `w-5 h-5 p-1 rounded-[32px] outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 transition-[background-color,outline-color] duration-200 ${
        checked
          ? 'bg-[var(--icon-accent-positive)] outline-[var(--icon-accent-positive)]'
          : 'bg-[var(--bg-brand-secondary-default)] outline-[var(--color-text-normal-primary)]'
      }`,
      [checked],
    );
    const labelClasses = useMemo(
      () => `text-base text-[var(--text-normal-primary)] leading-6 transition-[font-weight] duration-200 ${
        checked ? 'font-bold' : 'font-normal'
      }`,
      [checked],
    );

    return html`
      <button
        type="button"
        role="radio"
        aria-checked=${checked}
        class=${buttonClasses}
        onClick=${onClick}
      >
        <div data-state=${checked ? 'pressed' : 'default'} class=${outerCircleClasses} aria-hidden="true">
          <div class=${middleCircleClasses}>
            ${checked && html`<div class="w-2 h-2 bg-[var(--bg-brand-secondary-default)] rounded-full shadow-[0px_1px_1px_0px_rgba(52,62,91,0.30)]"></div>`}
          </div>
        </div>
        <span class=${labelClasses}>${label}</span>
      </button>
    `;
  };

  return html`
    <div
      class="${`${containerRelative ? 'relative' : ''} ${customClassName}`} group"
      data-name="passengerSelector"
      ...${rest}
    >
      <!-- Trigger Input (flex-col: content row + green line) -->
      <div class="w-full rounded-lg outline-1 outline-[var(--color-border-default)] inline-flex justify-start items-start overflow-hidden">
        <button
          ref=${triggerRef}
          type="button"
          class="flex-1 flex flex-col cursor-pointer transition-all duration-200 outline-0 bg-white max-w-full rounded-lg overflow-hidden group/passengerTrigger"
          onClick=${handleTriggerClick}
          aria-expanded=${isOpen}
          aria-haspopup="true"
          aria-label=${i18n['bookingBox.aria.selectPassengers'] || 'Seleccionar pasajeros'}
        >
          <!-- Content Row -->
          <div class="flex items-center gap-2 w-full h-12 px-4">
            <${Icon} icon="action/addpeople" size="m"/>
            <div class="flex-1 inline-flex flex-col justify-center items-start text-left min-w-0">
              <div class="self-stretch justify-start text-[var(--text-normal-secondary)] text-xs font-normal">${i18n['bookingBox.labels.passengers'] || 'Pasajeros'}</div>
              <div class="self-stretch h-5 justify-start text-[var(--text-normal-primary)] text-base font-bold truncate">${getDisplayText}</div>
            </div>
            <div class="w-5 h-5 flex justify-center items-center">
              <div class="${isOpen ? 'rotate-180' : ''} transition-transform duration-200 flex items-center justify-center h-5">
                <${Icon} icon="navigation/expand-more" size="xsm" />
              </div>
            </div>
          </div>
          <!-- Green bottom line (straight, no border-radius) -->
          <div class="w-full h-[3px] bg-transparent transition-colors duration-200 group-hover/passengerTrigger:bg-border-input-positive group-focus-within/passengerTrigger:bg-border-input-positive ${isOpen ? '!bg-border-input-positive' : ''}" aria-hidden="true"></div>
        </button>
      </div>

      <!-- Desktop Popup / Mobile Modal -->
      ${isOpen && (isMobile ? html`
        <!-- Mobile Full-Screen Modal -->
        <div class="fixed inset-0 bg-white z-[700] flex flex-col max-w-[100vw] min-h-svh">
          <!-- Header (condicional - solo si showHeader=true) -->
          ${showHeader && html`
            <div class="px-[16px] py-[24px] flex items-center justify-between">
              <button
                type="button"
                class="hover:opacity-60"
                onClick=${handleBack}
                aria-label=${i18n['bookingBox.aria.back'] || 'Regresar'}
              >
               <${Icon} icon="navigation/arrow-back" size="sm" />
              </button>
              <h2 class="!text-[18px] font-bold text-[var(--color-text-normal-primary)]">${i18n['bookingBox.labels.whoFlies'] || stepTitle}</h2>
              <button
                type="button"
                class="hover:opacity-60"
                onClick=${handleClose}
                aria-label=${i18n['bookingBox.aria.close'] || 'Cerrar'}
              >
                <${Icon} icon="navigation/close" size="sm" />
              </button>
            </div>
          `}

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-[32px] pt-[16px] pb-0 flex flex-col gap-[16px]">
            <!-- Selected Passengers Display (Input Style) -->
            <div class="self-stretch inline-flex flex-col justify-start items-start gap-1">
              <div class="self-stretch h-12 rounded-lg outline-1 outline-offset-[-1px] outline-[var(--color-border-default)] inline-flex justify-start items-start overflow-hidden">
                <div class="flex-1 h-12 px-4 bg-[var(--bg-input-default)] border-b-[3px] border-[var(--color-border-input-positive)] flex justify-start items-center gap-2 max-w-full">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10 9.99967C11.8417 9.99967 13.3334 8.50801 13.3334 6.66634C13.3334 4.82467 11.8417 3.33301 10 3.33301C8.15837 3.33301 6.66671 4.82467 6.66671 6.66634C6.66671 8.50801 8.15837 9.99967 10 9.99967ZM10 11.6663C7.77504 11.6663 3.33337 12.783 3.33337 14.9997V16.6663H16.6667V14.9997C16.6667 12.783 12.225 11.6663 10 11.6663Z" fill="#1B1B1B"/>
                  </svg>
                  <div class="flex-1 inline-flex flex-col justify-center items-start max-w-[85%]">
                    <div class="self-stretch text-[var(--text-normal-secondary)] text-xs font-normal leading-none">${i18n['bookingBox.labels.passengers'] || 'Pasajeros'}</div>
                    <div class="self-stretch h-5 text-[var(--text-normal-primary)] text-base font-bold truncate">${getDisplayText}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Passenger List -->
            <div class="flex flex-col">
              <!-- Adultos -->
              <div class="flex justify-between items-center h-[64px] py-[8px]">
                <div class="flex flex-col gap-[4px]">
                  <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.adults'] || 'Adultos'}</span>
                  <span class="text-[12px] text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.adultsAge'] || 'De 15 a 64 años'}</span>
                </div>
                <${Incrementer}
                  value=${passengers.adults}
                  min=${MIN_ADULTS}
                  max=${Math.min(MAX_ADULTS, MAX_TOTAL_PASSENGERS - passengers.youth - passengers.children)}
                  onChange=${(newValue) => handlePassengerChange('adults', newValue)}
                />
              </div>
              
              <!-- Helper Text (solo mostrar cuando total = 9) -->
              ${totalPassengers === MAX_TOTAL_PASSENGERS && html`
                <p 
                  class="!text-[14px] text-[var(--color-text-brand-disable)] leading-[1.5] link-container !m-0"
                  dangerouslySetInnerHTML=${{ __html: groupTravelLinkProcessed }}
                />
              `}

              <!-- Jóvenes -->
              <div class="flex justify-between items-center h-[64px] py-[8px]">
                <div class="flex flex-col gap-[4px]">
                  <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.youth'] || 'Jóvenes'}</span>
                  <span class="text-[12px] text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.youthAge'] || 'De 12 a 14 años'}</span>
                </div>
                <${Incrementer}
                  value=${passengers.youth}
                  min=${0}
                  max=${Math.min(MAX_YOUTH_CHILDREN - passengers.children, MAX_TOTAL_PASSENGERS - passengers.adults - passengers.children)}
                  onChange=${(newValue) => handlePassengerChange('youth', newValue)}
                />
              </div>

              <!-- Niños -->
              <div class="flex justify-between items-center h-[64px] py-[8px]">
                <div class="flex flex-col gap-[4px]">
                  <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.children'] || 'Niños'}</span>
                  <span class="text-[12px] text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.childrenAge'] || 'De 2 a 11 años'}</span>
                </div>
                <${Incrementer}
                  value=${passengers.children}
                  min=${0}
                  max=${Math.min(MAX_YOUTH_CHILDREN - passengers.youth, MAX_TOTAL_PASSENGERS - passengers.adults - passengers.youth)}
                  onChange=${(newValue) => handlePassengerChange('children', newValue)}
                />
              </div>

              <!-- Bebés (1 por adulto, NO cuentan para límite de 9) -->
              <div class="flex justify-between items-center h-[64px] py-[8px]">
                <div class="flex flex-col gap-[4px]">
                  <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.infants'] || 'Bebés'}</span>
                  <span class="text-[12px] text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.infantsAge'] || 'Menores de 2 años (1 por adulto)'}</span>
                </div>
                <${Incrementer}
                  value=${passengers.infants}
                  min=${0}
                  max=${passengers.adults}
                  onChange=${(newValue) => handlePassengerChange('infants', newValue)}
                />
              </div>
            </div>

            <!-- Info Banner -->
            ${showInfoBanner && html`
              <${Alert}
                variant="informative"
                contentHTML=${i18n['bookingBox.labels.youthPolicyLearn'] || ''}
                dismissible=${true}
                onDismiss=${() => setShowInfoBanner(false)}
                marqueeMode=${false}
              />
            `}

            ${showCabinClass && html`
              <!-- Cabin Class -->
              <div class="self-stretch py-4 border-t border-[var(--border-stroke-default)] inline-flex flex-col justify-start items-start gap-4">
                <div class="self-stretch justify-start text-[var(--text-normal-primary)] text-base font-semibold">${i18n['bookingBox.labels.cabin'] || 'Cabina'}</div>
                <div class="self-stretch inline-flex justify-start items-center gap-6">
                  <${RadioButton}
                    label=${i18n['bookingBox.labels.economy'] || 'Economy'}
                    checked=${passengers.cabinClass === 'economy'}
                    onClick=${() => handleCabinClassChange('economy')}
                  />
                  <${RadioButton}
                    label=${i18n['bookingBox.labels.businessClass'] || 'Business Class'}
                    checked=${passengers.cabinClass === 'business'}
                    onClick=${() => handleCabinClassChange('business')}
                  />
                </div>
              </div>
            `}

            ${validationError && html`
              <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <p class="text-[14px] text-red-600">${validationError}</p>
              </div>
            `}

            <div class="sticky bottom-0 left-0 right-0 bg-white pt-3 pb-[48px] mt-auto">
              <${Button}
                variant="primary"
                size="md"
                onClick=${handleConfirm}
                disabled=${!!validationError}
                customClassName="w-full"
              >
                ${i18n['bookingBox.labels.confirm'] || 'Confirmar'}
              </${Button}>
            </div>
          </div>
        </div>
      ` : html`
        <!-- Desktop Dropdown Popup -->
        <div
          ref=${dropdownRef}
          class="absolute ${dropdownPositionStyles} bg-white rounded-[16px] shadow-[0px_2px_12px_0px_rgba(27,27,27,0.15)] p-[24px] z-50 flex flex-col gap-[16px] w-[359px]"
        >
          <!-- Title -->
          <h3 class="!text-[16px] !font-bold text-[var(--color-text-normal-primary)] leading-[normal] !mt-0 !mb-0 h-[21px]">${i18n['bookingBox.labels.whoFlies'] || '¿Quiénes vuelan?'}</h3>

          <!-- Passenger List -->
          <div class="flex flex-col">
            <!-- Adultos -->
            <div class="flex justify-between items-center h-[64px] py-[8px]">
              <div class="flex flex-col gap-[4px]">
                <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.adults'] || 'Adultos'}</span>
                <span class="text-[12px] font-normal text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.adultsAge'] || 'De 15 a 64 años'}</span>
              </div>
              <${Incrementer}
                value=${passengers.adults}
                min=${MIN_ADULTS}
                max=${Math.min(MAX_ADULTS, MAX_TOTAL_PASSENGERS - passengers.youth - passengers.children)}
                onChange=${(newValue) => handlePassengerChange('adults', newValue)}
              />
            </div>
            
            <!-- Helper Text (solo mostrar cuando total = 9) -->
            ${totalPassengers === MAX_TOTAL_PASSENGERS && html`
              <p 
                class="text-[14px] text-[var(--color-text-brand-disable)] leading-[1.5] link-container !m-0"
                dangerouslySetInnerHTML=${{ __html: groupTravelLinkProcessed }}
              />
            `}

            <!-- Jóvenes -->
            <div class="flex justify-between items-center h-[64px] py-[8px]">
              <div class="flex flex-col gap-[4px]">
                <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.youth'] || 'Jóvenes'}</span>
                <span class="text-[12px] font-normal text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.youthAge'] || 'De 12 a 14 años'}</span>
              </div>
              <${Incrementer}
                value=${passengers.youth}
                min=${0}
                max=${Math.min(MAX_YOUTH_CHILDREN - passengers.children, MAX_TOTAL_PASSENGERS - passengers.adults - passengers.children)}
                onChange=${(newValue) => handlePassengerChange('youth', newValue)}
              />
            </div>

            <!-- Niños -->
            <div class="flex justify-between items-center h-[64px] py-[8px]">
              <div class="flex flex-col gap-[4px]">
                <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.children'] || 'Niños'}</span>
                <span class="text-[12px] font-normal text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.childrenAge'] || 'De 2 a 11 años'}</span>
              </div>
              <${Incrementer}
                value=${passengers.children}
                min=${0}
                max=${Math.min(MAX_YOUTH_CHILDREN - passengers.youth, MAX_TOTAL_PASSENGERS - passengers.adults - passengers.youth)}
                onChange=${(newValue) => handlePassengerChange('children', newValue)}
              />
            </div>

            <!-- Bebés (1 por adulto, NO cuentan para límite de 9) -->
            <div class="flex justify-between items-center h-[64px] py-[8px]">
              <div class="flex flex-col gap-[4px]">
                <span class="text-[18px] font-normal text-[var(--color-text-normal-primary)] leading-[normal]">${i18n['bookingBox.labels.infants'] || 'Bebés'}</span>
                <span class="text-[12px] font-normal text-[var(--color-text-disabled)] leading-[normal]">${i18n['bookingBox.labels.infantsAge'] || 'Menores de 2 años (1 por adulto)'}</span>
              </div>
              <${Incrementer}
                value=${passengers.infants}
                min=${0}
                max=${passengers.adults}
                onChange=${(newValue) => handlePassengerChange('infants', newValue)}
              />
            </div>
          </div>

          <!-- Info Banner -->
          ${showInfoBanner && html`
            <${Alert}
              variant="informative"
              contentHTML=${i18n['bookingBox.labels.youthPolicyLearn'] || ''}
              dismissible=${true}
              onDismiss=${() => setShowInfoBanner(false)}
              marqueeMode=${false}
              isRounded=${true}
              customClassName="rounded-[8px] border-none !p-[16px] !leading-[21px]"
            />
          `}

          ${showCabinClass && html`
            <!-- Cabin Class -->
            <div class="self-stretch py-4 border-t border-[var(--border-stroke-default)] inline-flex flex-col justify-start items-start gap-4">
              <div class="self-stretch justify-start text-[var(--text-normal-primary)] text-base font-semibold h-[21px]">${i18n['bookingBox.labels.cabin'] || 'Cabina'}</div>
              <div class="self-stretch inline-flex justify-start items-center gap-6">
                <${RadioButton}
                  label=${i18n['bookingBox.labels.economy'] || 'Economy'}
                  checked=${passengers.cabinClass === 'economy'}
                  onClick=${() => handleCabinClassChange('economy')}
                />
                <${RadioButton}
                  label=${i18n['bookingBox.labels.businessClass'] || 'Business Class'}
                  checked=${passengers.cabinClass === 'business'}
                  onClick=${() => handleCabinClassChange('business')}
                />
              </div>
            </div>
          `}

          <!-- Error Message -->
          ${validationError && html`
            <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <p class="text-[14px] text-red-600">${validationError}</p>
            </div>
          `}

          <div class="bg-white">
            <${Button}
              variant="primary"
              size="md"
              onClick=${handleConfirm}
              disabled=${!!validationError}
              customClassName="w-full max-h-[50px] py-[12px]"
            >
              ${i18n['bookingBox.labels.confirm'] || 'Confirmar'}
            </${Button}>
          </div>
        </div>
      `)}
    </div>
  `;
};

export default PassengerSelector;
