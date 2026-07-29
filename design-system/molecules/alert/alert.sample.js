import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Alert } from './alert.js';

const html = htm.bind(h);

/**
 * AlertSample component for showcasing alert component variations
 * @returns {import('preact').VNode} Sample showcase
 */
export const AlertSample = () => {
  const handleDismiss = () => {
    console.log('Alert dismissed');
  };

  return html`
    <div class="flex flex-col gap-[var(--spacing-x-large)] max-w-[120rem] mx-auto p-6">
      <div>
        <h1 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
          Alert Component
      </h1>
        <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Flexible component for notifications and alerts. Can be used independently or composed into organisms.
      </p>
      </div>

      <!-- Sample 1: All Variants -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            All Variants
        </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            The Alert component supports 6 different variants, each with its own visual style.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Informative</h3>
            <${Alert}
              variant="informative"
              contentHTML="<p>Remember that arrival times at El Dorado airport are a bit high. <strong>Plan ahead to arrive on time.</strong></p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Promotional</h3>
            <${Alert}
              variant="promotional"
              contentHTML="<p>Special offer! <strong>Up to 30% discounts</strong> on domestic flights. <a href='#promo'>View details</a></p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Caution</h3>
            <${Alert}
              variant="caution"
              contentHTML="<p>Your flight has been rescheduled. Please verify the new departure time in your email.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Success</h3>
            <${Alert}
              variant="success"
              contentHTML="<p>Your reservation has been confirmed successfully! You will receive a confirmation email shortly.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Error</h3>
            <${Alert}
              variant="error"
              contentHTML="<p>Error! Your payment could not be processed. Please try again or contact support.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Neutral</h3>
            <${Alert}
              variant="neutral"
              contentHTML="<p>Check-in available in: 1 day, 20 hours.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>
        </div>
      </section>

      <!-- Sample 2: With and Without Rounded Corners -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Rounded Corners
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Control whether the alert has rounded corners using the <code>isRounded</code> prop.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">With rounded corners (isRounded=true)</h3>
            <${Alert}
              variant="informative"
              isRounded=${true}
              contentHTML="<p>This alert has rounded corners.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Without rounded corners (isRounded=false)</h3>
            <${Alert}
              variant="informative"
              isRounded=${false}
              contentHTML="<p>This alert does not have rounded corners.</p>"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 3: With and Without Dismiss Button -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Dismiss Button
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Control the visibility of the dismiss button with the <code>dismissible</code> prop.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">With dismiss button (dismissible=true)</h3>
            <${Alert}
              variant="caution"
              contentHTML="<p>This alert can be dismissed by the user.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Without dismiss button (dismissible=false)</h3>
            <${Alert}
              variant="caution"
              contentHTML="<p>This alert cannot be dismissed by the user.</p>"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 4: With and Without Icon -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Icon Visibility
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Control whether the icon is displayed using the <code>showIcon</code> prop or <code>icon="none"</code>.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">With icon (showIcon=true)</h3>
            <${Alert}
              variant="success"
              contentHTML="<p>This alert displays the default icon for the variant.</p>"
              showIcon=${true}
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Without icon (showIcon=false)</h3>
            <${Alert}
              variant="success"
              contentHTML="<p>This alert does not display any icon.</p>"
              showIcon=${false}
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Without icon (icon="none")</h3>
            <${Alert}
              variant="success"
              contentHTML="<p>This alert uses icon='none' to hide the icon.</p>"
              icon="none"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 5: Custom Icons -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Custom Icons
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Use <code>customIcon</code> and <code>customIconColor</code> to customize the alert icon.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Custom icon with default color</h3>
            <${Alert}
              variant="informative"
              customIcon="alert/announcement"
              contentHTML="<p>This alert uses a custom icon with color inherited from text.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Custom icon with specific color</h3>
            <${Alert}
              variant="informative"
              customIcon="alert/Notification"
              customIconColor="var(--color-info)"
              contentHTML="<p>This alert uses a custom icon with a specific color.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Custom icon using icon prop</h3>
            <${Alert}
              variant="promotional"
              icon="alert/New-Promo"
              contentHTML="<p>This alert uses the icon prop to specify a custom icon.</p>"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 6: Icon Override Examples -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Icon Examples by Variant
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Each variant has a default icon, but you can customize it.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Success with custom icon</h3>
            <${Alert}
              variant="success"
              customIcon="alert/success"
              customIconColor="var(--color-alert-success-border)"
              contentHTML="<p>Operation completed successfully.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Error with custom icon</h3>
            <${Alert}
              variant="error"
              customIcon="alert/Denied"
              customIconColor="var(--color-alert-error-icon-bg)"
              contentHTML="<p>Access denied. Please verify your credentials.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Caution with help icon</h3>
            <${Alert}
              variant="caution"
              customIcon="alert/help"
              contentHTML="<p>Need help? Contact our support team.</p>"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 7: Rich Content Examples -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Rich HTML Content
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            The component supports full HTML content using <code>contentHTML</code>.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Content with links and formatting</h3>
            <${Alert}
              variant="promotional"
              contentHTML="<p>New promotion available! <strong>Save up to 40%</strong> on your next trip. <a href='#promo' style='text-decoration: underline; font-weight: 600;'>View offers</a></p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Content with multiple lines</h3>
            <${Alert}
              variant="informative"
              contentHTML="<p><strong>Important information:</strong></p><ul style='margin-top: 8px; padding-left: 20px;'><li>Arrive at the airport 3 hours in advance</li><li>Bring identification documents</li><li>Check baggage restrictions</li></ul>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>
        </div>
      </section>

      <!-- Sample 8: Marquee Mode -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Marquee Mode
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Control content scrolling behavior with <code>marqueeMode</code>. When enabled, long content scrolls horizontally. Hover to pause.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Marquee mode enabled (marqueeMode=true) - Long content</h3>
            <p class="text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-x-small)]">
              This content is long enough to trigger horizontal scrolling. Hover over the alert to pause the animation.
            </p>
            <${Alert}
              variant="promotional"
              marqueeMode=${true}
              contentHTML="<p>This is a very long promotional message that will scroll horizontally when it exceeds the container width. The marquee effect will automatically activate when content overflows. Hover to pause!</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Marquee mode disabled (marqueeMode=false) - Text wrapping</h3>
            <p class="text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-x-small)]">
              Same long content but with text wrapping instead of scrolling.
            </p>
            <${Alert}
              variant="promotional"
              marqueeMode=${false}
              contentHTML="<p>This is a very long promotional message that will wrap to multiple lines instead of scrolling horizontally. The text will break and wrap naturally within the container boundaries.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Marquee mode with short content</h3>
            <p class="text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-x-small)]">
              When content fits within the container, marquee mode won't activate.
            </p>
            <${Alert}
              variant="informative"
              marqueeMode=${true}
              contentHTML="<p>Short message that fits.</p>"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 9: Height Mode -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Height Mode
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Use <code>heightMode</code> to prevent alerts with excessive content from collapsing the screen. Content will scroll vertically when it exceeds the maximum height.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Height mode enabled (heightMode='marquee')</h3>
            <p class="text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-x-small)]">
              Mobile: max-height 326px, Desktop: max-height 400px. Scroll vertically if content exceeds these limits.
            </p>
            <${Alert}
              variant="informative"
              heightMode="marquee"
              marqueeMode=${false}
              contentHTML="<p><strong>Important Information:</strong></p><p>This alert demonstrates height mode functionality. When content exceeds the maximum height, a vertical scrollbar will appear.</p><p>Paragraph 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><p>Paragraph 2: Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Paragraph 3: Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p><p>Paragraph 4: Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Paragraph 5: Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Height mode disabled (no heightMode)</h3>
            <p class="text-[var(--paragraph-p100-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-x-small)]">
              Without height mode, content expands naturally without height restrictions.
            </p>
            <${Alert}
              variant="informative"
              marqueeMode=${false}
              contentHTML="<p><strong>No Height Restrictions:</strong></p><p>This alert has no height mode set, so it will expand to fit all content without scrolling.</p><p>Paragraph 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><p>Paragraph 2: Ut enim ad minim veniam, quis nostrud exercitation.</p>"
              dismissible=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sample 10: Combined Features -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Combined Features
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Examples combining multiple features: marquee mode, height mode, custom icons, and rounded corners.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Marquee + Height Mode + Rounded Corners</h3>
            <${Alert}
              variant="promotional"
              marqueeMode=${true}
              heightMode="marquee"
              isRounded=${true}
              contentHTML="<p>This alert combines marquee mode for horizontal scrolling, height mode for vertical limits, and rounded corners for a polished look. Perfect for promotional banners!</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Height Mode + Custom Icon + No Dismiss</h3>
            <${Alert}
              variant="success"
              heightMode="marquee"
              customIcon="alert/success"
              customIconColor="var(--color-alert-success-border)"
              isRounded=${true}
              contentHTML="<p><strong>Success Story:</strong></p><p>This alert demonstrates height mode with a custom success icon and no dismiss button. Content will scroll vertically if it exceeds the maximum height.</p><p>Additional information can be added here, and it will scroll within the defined height limits.</p>"
              dismissible=${false}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Wrap Mode + Height Mode</h3>
            <${Alert}
              variant="caution"
              marqueeMode=${false}
              heightMode="marquee"
              isRounded=${true}
              contentHTML="<p><strong>Important Warning:</strong></p><p>This alert uses wrap mode (marqueeMode=false) combined with height mode. Text will wrap to multiple lines, and if content is too tall, it will scroll vertically.</p><ul style='margin-top: 8px; padding-left: 20px;'><li>Text wraps naturally</li><li>Height is limited</li><li>Vertical scroll when needed</li></ul>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>
        </div>
      </section>

      <!-- Sample 11: All Variants Without Dismiss -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            All Variants Without Dismiss Button
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Examples of all variants without the dismiss button, useful for persistent alerts.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <${Alert}
            variant="informative"
            contentHTML="<p>Persistent informative message.</p>"
            dismissible=${false}
          />
          <${Alert}
            variant="promotional"
            contentHTML="<p>Promotion available for a limited time.</p>"
            dismissible=${false}
          />
          <${Alert}
            variant="caution"
            contentHTML="<p>Important warning that requires attention.</p>"
            dismissible=${false}
          />
          <${Alert}
            variant="success"
            contentHTML="<p>Operation completed correctly.</p>"
            dismissible=${false}
          />
          <${Alert}
            variant="error"
            contentHTML="<p>Critical error that requires immediate action.</p>"
            dismissible=${false}
          />
          <${Alert}
            variant="neutral"
            contentHTML="<p>Neutral information without urgency.</p>"
            dismissible=${false}
          />
        </div>
      </section>

      <!-- Sample 12: Real-world Examples -->
      <section class="flex flex-col gap-[var(--spacing-large)]">
        <div>
          <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
            Real-world Examples
          </h2>
          <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
            Practical examples of how the Alert component can be used in different scenarios.
          </p>
        </div>

        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Airport Delay Notification</h3>
            <${Alert}
              variant="caution"
              marqueeMode=${true}
              heightMode="marquee"
              isRounded=${true}
              contentHTML="<p><strong>Flight Delay Notice:</strong> Flight AV1234 to Bogotá has been delayed by 2 hours. New departure time: 3:45 PM. Please check your email for updates and arrive at the airport accordingly.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Promotional Banner</h3>
            <${Alert}
              variant="promotional"
              marqueeMode=${true}
              heightMode="marquee"
              isRounded=${true}
              customIcon="alert/New-Promo"
              contentHTML="<p><strong>Special Offer:</strong> Book your next flight and save up to 40%! Use code SAVE40 at checkout. Valid until end of month. <a href='#promo' style='text-decoration: underline; font-weight: 600;'>View details</a></p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Check-in Reminder</h3>
            <${Alert}
              variant="informative"
              marqueeMode=${false}
              heightMode="marquee"
              isRounded=${true}
              contentHTML="<p><strong>Check-in Available:</strong> Online check-in is now available for your flight. Check-in opens 24 hours before departure. <a href='#checkin' style='text-decoration: underline; font-weight: 600;'>Check in now</a></p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 class="text-[var(--paragraph-p200-size)] font-medium mb-[var(--spacing-x-small)]">Booking Confirmation</h3>
            <${Alert}
              variant="success"
              marqueeMode=${false}
              isRounded=${true}
              contentHTML="<p><strong>Booking Confirmed!</strong> Your reservation has been successfully processed. Confirmation number: ABC123456. You will receive an email confirmation shortly.</p>"
              dismissible=${true}
              onDismiss=${handleDismiss}
            />
          </div>
        </div>
      </section>
    </div>
  `;
};

// Export all samples for use in design system block
export const alertSamples = [
  {
    title: 'Alert Component Examples',
    component: AlertSample,
  },
];

export default AlertSample;
