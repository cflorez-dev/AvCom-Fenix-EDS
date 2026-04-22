import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { SecondaryBanner } from './secondary-banner.js';

const html = htm.bind(h);

export const SecondaryBannerSample = () => {
  const sampleImageDesktop = `${window.hlx?.codeBasePath || ''}/assets/samples/seat-and-lamp.png`;
  const sampleImageMobile = `${window.hlx?.codeBasePath || ''}/assets/samples/seat-and-lamp.png`;

  return html`
    <div class="p-10 max-w-screen-xl mx-auto">
      <h1 class="mb-[var(--spacing-x-large)] text-[var(--font-size-x-large)] font-bold">
        Secondary Banner Samples
      </h1>

      <!-- Default Banner (Light Mode) -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Default Banner (Light Mode)</h2>
        <${SecondaryBanner}
          title="Travel Requirements"
          firstLabel="Find out about visas"
          secondaryLabel="Check all the documents you need for your trip"
          imageDesktop=${sampleImageDesktop}
          imageMobile=${sampleImageMobile}
          imageAlt="Avianca Travel Requirements"
          ctaText="Ver más"
          ctaUrl="/travel-requirements"
          ctaLinkType="dofollow"
          mode="light"
          backgroundType="solid"
          backgroundColor="#1b1b1b"
          loading="lazy"
        />
      </div>

      <!-- Dark Mode Banner -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Dark Mode Banner</h2>
        <${SecondaryBanner}
          title="VIP Lounges"
          firstLabel="Relax before your flight"
          secondaryLabel="Enjoy our exclusive lounges with premium services"
          imageDesktop=${sampleImageDesktop}
          imageMobile=${sampleImageMobile}
          imageAlt="Avianca VIP Lounge"
          ctaText="Ver más"
          ctaUrl="/vip-lounges"
          ctaLinkType="dofollow"
          mode="dark"
          backgroundType="solid"
          backgroundColor="#1b1b1b"
          loading="lazy"
        />
      </div>

      <!-- Gradient Background Banner -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Gradient Background Banner</h2>
        <${SecondaryBanner}
          title="Special Services"
          firstLabel="Services available for your trip"
          secondaryLabel="Learn about the special services we offer"
          imageDesktop=${sampleImageDesktop}
          imageMobile=${sampleImageMobile}
          imageAlt="Avianca Special Services"
          ctaText="Ver más"
          ctaUrl="/special-services"
          ctaLinkType="dofollow"
          mode="light"
          backgroundType="gradient"
          gradientColorStart="#3b82f6"
          gradientColorEnd="#1e40af"
          loading="lazy"
        />
      </div>

      <!-- Custom Background Color Banner -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Custom Background Color Banner</h2>
        <${SecondaryBanner}
          title="Promotions"
          firstLabel="Exclusive offers"
          secondaryLabel="Discover our latest promotions and discounts"
          imageDesktop=${sampleImageDesktop}
          imageMobile=${sampleImageMobile}
          imageAlt="Avianca Promotions"
          ctaText="Ver más"
          ctaUrl="/promotions"
          ctaLinkType="dofollow"
          mode="light"
          backgroundType="solid"
          backgroundColor="#4b1bbf"
          loading="lazy"
        />
      </div>

      <!-- Banner with Condor Stroke Color -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Banner with Custom Condor Color</h2>
        <${SecondaryBanner}
          title="Avianca Experience"
          firstLabel="Premium travel experience"
          secondaryLabel="Experience the best of Avianca"
          imageDesktop=${sampleImageDesktop}
          imageMobile=${sampleImageMobile}
          imageAlt="Avianca Experience"
          ctaText="Ver más"
          ctaUrl="/experience"
          ctaLinkType="dofollow"
          mode="dark"
          backgroundType="solid"
          backgroundColor="#1b1b1b"
          condorStrokeColor="#ff0000"
          loading="lazy"
        />
      </div>

      <!-- Minimal Banner (No Secondary Label) -->
      <div class="mb-12">
        <h2 class="mb-6 text-2xl font-bold text-[var(--text-normal-primary)]">Minimal Banner</h2>
        <${SecondaryBanner}
          title="Book Your Flight"
          firstLabel="Start your journey"
          secondaryLabel=""
          imageDesktop=${sampleImageDesktop}
          imageMobile=${sampleImageMobile}
          imageAlt="Book Flight"
          ctaText="Ver más"
          ctaUrl="/book"
          ctaLinkType="dofollow"
          mode="light"
          backgroundType="solid"
          backgroundColor="#1b1b1b"
          loading="lazy"
        />
      </div>
    </div>
  `;
};

export default SecondaryBannerSample;

