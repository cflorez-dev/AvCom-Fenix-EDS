import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * Gets current time in Colombia timezone (America/Bogota)
 * @returns {Date} Current date/time in Colombia
 */
function getColombiaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

/**
 * CountdownUnit Component
 * Displays a single unit of the countdown (days, hours, minutes, seconds)
 */
const CountdownUnit = ({ value, label, counterTextColor, counterBackgroundColor }) => {
  const unitStyle = {
    color: counterTextColor,
    backgroundColor: counterBackgroundColor,
  };

  return html`
    <div 
      class="w-[50px] h-[50px] md:w-[64px] md:h-[64px] p-[0.25rem] rounded-[0.5rem] inline-flex flex-col justify-center items-center"
      style=${unitStyle}
    >
      <div class="justify-start text-[var(--text-normal-lighter)] text-xl md:text-3xl font-bold [text-shadow:_0px_0px_14px_rgb(162_240_255_/_1.00)] leading-auto">
        ${String(value).padStart(2, '0')}
      </div>
      <div class="justify-start text-[var(--text-normal-lighter)] text-xs md:text-sm font-normal leading-[1.5]">
        ${label}
      </div>
    </div>
  `;
};

/**
 * StickyCountdownBanner Component
 * A sticky banner with countdown timer that can be dismissed
 * @param {Object} props - Component props
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Subtitle text
 * @param {string} props.endDateTime - End date/time in ISO format
 * @param {boolean} props.dismissible - Whether the banner can be dismissed
 * @param {string} props.backgroundColor - Background color (hex)
 * @param {string} props.textColor - Text color (hex)
 * @param {string} props.counterTextColor - Counter text color (hex)
 * @param {string} props.buttonColor - Dismiss button color (hex)
 * @param {string} props.ariaRole - ARIA role for accessibility
 * @param {Function} props.onDismiss - Callback when banner is dismissed
 */
export const StickyCountdownBanner = ({
  title = '',
  subtitle = '',
  endDateTime = '',
  dismissible = true,
  backgroundColor = '#000000',
  textColor = '#FFFFFF',
  counterTextColor = '#FFFFFF',
  counterBackgroundColor = '#1B1B1B',
  buttonColor = '#FFFFFF',
  ariaRole = 'banner',
  daysLabel = 'Días',
  hoursLabel = 'Horas',
  minutesLabel = 'Min',
  secondsLabel = 'Seg',
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDateTime) - getColombiaTime();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        setIsDismissed(true);
        if (onDismiss) {
          onDismiss();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDateTime]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  const bannerStyle = {
    backgroundColor,
  };

  const textStyle = {
    color: textColor,
  };

  return html`
    <div 
      class="w-full px-6 pt-6 pb-[48px] md:p-6 rounded-tl-2xl rounded-tr-2xl md:rounded-2xl shadow-[0px_2px_32px_8px_rgba(27,27,27,0.40)] inline-flex flex-col md:flex-row justify-end md:justify-start items-center md:items-start gap-2 md:gap-4"
      style=${bannerStyle}
      role=${ariaRole}
      aria-live="polite"
      data-name="stickyCountdownBanner"
    >
      ${dismissible && html`
        <div class="self-stretch md:self-auto md:order-2 inline-flex justify-end items-center md:items-start gap-2.5">
          <button
            type="button"
            class="w-6 h-6 cursor-pointer bg-transparent border-0 p-0 focus:outline focus:outline-2 focus:outline-[var(--border-stroke-focus)] focus:outline-offset-2 rounded flex items-center justify-center"
            onClick=${handleDismiss}
            onKeyDown=${handleKeyDown}
            aria-label="Cerrar banner"
          >
            <${Icon}
              icon="navigation/close"
              size="s"
              color=${buttonColor}
              customClassName="!w-[14px] !h-[14px]"
            />
          </button>
        </div>
      `}
      
      <div class="self-stretch md:flex-1 md:order-1 flex flex-col md:inline-flex md:flex-row justify-center md:justify-start items-center md:items-center gap-6 md:gap-4">
        <div class="self-stretch md:flex-1 flex flex-col justify-center items-center md:items-start gap-[4px]">
          ${title && html`
            <div 
              class="self-stretch text-center md:text-left md:justify-start text-xl md:text-[1.75rem] font-bold leading-[26px] md:leading-[37px]"
              style=${textStyle}
            >
              ${title}
            </div>
          `}
          ${subtitle && html`
            <div 
              class="self-stretch text-center md:text-left md:justify-start text-base md:text-xl font-normal leading-6 md:leading-[30px]"
              style=${textStyle}
            >
              ${subtitle}
            </div>
          `}
        </div>
        
        ${endDateTime && timeLeft.total > 0 && html`
          <div class="inline-flex flex-col justify-start items-center gap-3">
            <div class="inline-flex justify-start items-center gap-3">
              ${timeLeft.days > 0 && html`
                <${CountdownUnit} 
                  value=${timeLeft.days} 
                  label=${daysLabel}
                  counterTextColor=${counterTextColor}
                  counterBackgroundColor=${counterBackgroundColor}
                />
              `}
              <${CountdownUnit} 
                value=${timeLeft.hours} 
                label=${hoursLabel}
                counterTextColor=${counterTextColor}
                counterBackgroundColor=${counterBackgroundColor}
              />
              <${CountdownUnit} 
                value=${timeLeft.minutes} 
                label=${minutesLabel}
                counterTextColor=${counterTextColor}
                counterBackgroundColor=${counterBackgroundColor}
              />
              <${CountdownUnit} 
                value=${timeLeft.seconds} 
                label=${secondsLabel}
                counterTextColor=${counterTextColor}
                counterBackgroundColor=${counterBackgroundColor}
              />
            </div>
          </div>
        `}
      </div>
    </div>
  `;
};

export default StickyCountdownBanner;
