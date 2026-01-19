import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';

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
const CountdownUnit = ({ value, label }) => html`
  <div 
    class="w-[50px] h-[50px] min-[1248px]:w-[65px] min-[1248px]:h-[65px] p-1 bg-white rounded-lg inline-flex flex-col justify-center items-center min-[1248px]:gap-[2px]"
    data-device="Mob"
    data-style="White"
    data-size="Default"
  >
    <div class="justify-start text-text-normal-primary text-xl min-[1248px]:text-[28px] leading-[26px]  min-[1248px]:leading-[37px] font-bold">
      ${String(value).padStart(2, '0')}
    </div>
    <div class="justify-start text-text-normal-primary text-xs font-normal leading-[18px] min-[1248px]:leading-[16px]">
      ${label}
    </div>
  </div>
`;

/**
 * AbsoluteCountdown Component
 * Desktop-only countdown positioned absolutely (hidden on mobile/tablet)
 */
export const AbsoluteCountdown = ({
  countdownLabel = '',
  endDateTime = '',
  daysLabel = 'Días',
  hoursLabel = 'Horas',
  minutesLabel = 'Min',
  secondsLabel = 'Seg',
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    if (!endDateTime) return () => {};

    const calculateTimeLeft = () => {
      const now = getColombiaTime();
      const end = new Date(endDateTime);
      const difference = end - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDateTime]);

  return html`
    <div class="hidden min-[1248px]:flex absolute right-[24px] bottom-[24px] flex-col justify-start items-center gap-3">
      <div class="inline-flex justify-start items-start gap-3">
        <div class="min-w-20 min-h-20 px-4 py-3 bg-zinc-900/70 rounded-lg backdrop-blur-[6px] inline-flex flex-col justify-center items-center gap-2">
          <div class="justify-start text-[var(--banner-banner-text-light)] text-xl font-normal leading-[26px]">
            ${countdownLabel}
          </div>
          <div class="self-stretch inline-flex justify-start items-center gap-3">
            ${timeLeft.days > 0 && html`
              <${CountdownUnit} 
                value=${timeLeft.days} 
                label=${daysLabel}
              />
            `}
            <${CountdownUnit} 
              value=${timeLeft.hours} 
              label=${hoursLabel}
            />
            <${CountdownUnit} 
              value=${timeLeft.minutes} 
              label=${minutesLabel}
            />
            <${CountdownUnit} 
              value=${timeLeft.seconds} 
              label=${secondsLabel}
            />
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * PromotionalCountdownCard Component
 * Card component with countdown timer, pricing info, and CTA button for promotional campaigns
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Main promotional title (supports HTML)
 * @param {string} props.subtitle - Promotional subtitle/description
 * @param {string} props.countdownLabel - Label above the countdown timer
 * @param {string} props.endDateTime - End date/time in ISO format
 * @param {boolean} props.showCountdown - Whether to show countdown timer
 * @param {string} props.priceLabel - Label above the price (e.g., "Trayecto desde")
 * @param {string} props.price - Price to display (e.g., "COP 240.000")
 * @param {string} props.routeLabel - Route description (e.g., "Bogotá a Miami")
 * @param {boolean} props.showPrice - Whether to show price section
 * @param {string} props.buttonText - CTA button text
 * @param {string} props.buttonUrl - CTA button URL
 * @param {boolean} props.showButton - Whether to show CTA button
 * @param {string} props.daysLabel - Label for days
 * @param {string} props.hoursLabel - Label for hours
 * @param {string} props.minutesLabel - Label for minutes
 * @param {string} props.secondsLabel - Label for seconds
 * @param {string} props.customClassName - Additional CSS classes
 */
export const PromotionalCountdownCard = ({
  title = '',
  subtitle = '',
  countdownLabel = 'Label',
  endDateTime = '',
  showCountdown = true,
  priceLabel = '',
  price = '',
  routeLabel = '',
  showPrice = true,
  buttonText = 'Reservar',
  buttonUrl = '#',
  showButton = true,
  daysLabel = 'Días',
  hoursLabel = 'Horas',
  minutesLabel = 'Min',
  secondsLabel = 'Seg',
  customClassName = '',
  ...rest
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen size for button size
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1248);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showCountdown || !endDateTime) return () => {};

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
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDateTime, showCountdown]);

  const handleButtonClick = () => {
    if (buttonUrl && buttonUrl !== '#') {
      window.location.href = buttonUrl;
    }
  };

  return html`
    <div 
      class="self-stretch min-[1248px]:w-[569px] min-[1248px]:flex-1 p-4 min-[1248px]:p-6 min-[1248px]:h-full bg-zinc-900/70 rounded-2xl backdrop-blur-sm flex flex-col justify-center min-[1248px]:justify-between items-start gap-4 min-[1248px]:gap-[7px] ${customClassName}"
      data-name="promotionalCountdownCard"
      ...${rest}
    >
      <!-- Title/Subtitle and Countdown Section (Mobile/Tablet: stacked or side-by-side, Desktop: countdown absolute) -->
      <div class="self-stretch flex flex-col min-[769px]:flex-row min-[1248px]:flex-col justify-start items-start gap-4 min-[1248px]:gap-2">
        <!-- Title and Subtitle Section -->
        <div class="self-stretch min-[769px]:flex-1 min-[1248px]:self-stretch flex flex-col justify-start items-start gap-2">
          <div 
            class="promotional-countdown-card-title self-stretch justify-start text-text-normal-lighter text-2xl min-[1248px]:text-4xl font-bold antialiased"
            dangerouslySetInnerHTML=${{ __html: title }}
          />
          <div 
            class="promotional-countdown-card-subtitle self-stretch justify-start text-text-normal-lighter text-sm min-[1248px]:text-lg font-normal leading-[21px] min-[1248px]:leading-[27px] antialiased"
            dangerouslySetInnerHTML=${{ __html: subtitle }}
          />
        </div>

        ${showCountdown && html`
          <div class="w-full min-[769px]:w-auto min-[1248px]:hidden rounded-2xl flex-col justify-start items-start gap-2 inline-flex" data-device="mob">
            <div class="text-[var(--banner-banner-text-light)] text-sm font-normal leading-[21px] antialiased">
              ${countdownLabel}
            </div>
            <div class="justify-start items-center gap-2 inline-flex">
              ${timeLeft.days > 0 && html`
                <${CountdownUnit} 
                  value=${timeLeft.days} 
                  label=${daysLabel}
                />
              `}
              <${CountdownUnit} 
                value=${timeLeft.hours} 
                label=${hoursLabel}
              />
              <${CountdownUnit} 
                value=${timeLeft.minutes} 
                label=${minutesLabel}
              />
              <${CountdownUnit} 
                value=${timeLeft.seconds} 
                label=${secondsLabel}
              />
            </div>
          </div>
        `}
      </div>

      <!-- Price and CTA Section -->
      <div class="self-stretch flex flex-col min-[321px]:flex-row justify-end items-end gap-2 min-[1248px]:gap-6">
        ${showPrice && html`
          <div class="self-stretch min-[321px]:flex-1 flex flex-col justify-start items-start">
            ${priceLabel && html`
              <div class="justify-start text-[var(--text-brand-light)] text-xs min-[1248px]:text-base font-normal leading-[18px] min-[1248px]:leading-6 antialiased">
                ${priceLabel}
              </div>
            `}
            ${price && html`
              <div class="justify-start text-[var(--text-normal-lighter)] text-2xl min-[1248px]:text-[32px] font-bold min-[1248px]:leading-normal antialiased">
                ${price}
              </div>
            `}
            ${routeLabel && html`
              <div class="justify-start text-[var(--text-brand-light)] text-xs min-[1248px]:text-base font-normal leading-[18px] min-[1248px]:leading-6 antialiased">
                ${routeLabel}
              </div>
            `}
          </div>
        `}
        
        ${showButton && html`
          <${Button}
            variant='tertiary' 
            size=${isDesktop ? 'md' : 'xs'}
            onClick=${handleButtonClick}
          >
            ${buttonText}
          </${Button}>
        `}
      </div>
    </div>
  `;
};
