import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from './button.js';


const html = htm.bind(h);

/**
 * ButtonSample - Minimalist showcase of the Button component
 * Shows all available variants and sizes according to Figma design
 */
export const ButtonSample = () => html`
    <div class="p-10 max-w-[1200px] mx-auto">
      
      <!-- Variants -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Variants</h2>
        <div class="flex gap-4 flex-wrap">
          <${Button} variant="primary" size="md">Primary</${Button}>
          <${Button} variant="secondary" size="md">Secondary</${Button}>
          <${Button} variant="tertiary" size="md">Tertiary</${Button}>
          <${Button} variant="danger" size="md">Danger</${Button}>
          <${Button} variant="transparent" size="md">Transparent</${Button}>
        </div>
      </section>

      <!-- Sizes -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Sizes</h2>
        <div class="flex gap-4 items-center flex-wrap">
          <${Button} variant="primary" size="xxs">XXS (24px)</${Button}>
          <${Button} variant="primary" size="xs">Extra Small</${Button}>
          <${Button} variant="primary" size="sm">Small</${Button}>
          <${Button} variant="primary" size="md">Medium</${Button}>
          <${Button} variant="primary" size="lg">Large</${Button}>
        </div>
        <div class="mt-4 flex gap-4 items-center flex-wrap">
          <${Button} variant="secondary" size="xxs">XXS (24px)</${Button}>
          <${Button} variant="secondary" size="xs">Extra Small</${Button}>
          <${Button} variant="secondary" size="sm">Small</${Button}>
          <${Button} variant="secondary" size="md">Medium</${Button}>
          <${Button} variant="secondary" size="lg">Large</${Button}>
        </div>
        <div class="mt-4 flex gap-4 items-center flex-wrap">
          <${Button} variant="transparent" size="xxs">XXS (24px)</${Button}>
          <${Button} variant="transparent" size="xs">Extra Small</${Button}>
          <${Button} variant="transparent" size="sm">Small</${Button}>
          <${Button} variant="transparent" size="md">Medium</${Button}>
          <${Button} variant="transparent" size="lg">Large</${Button}>
        </div>
      </section>

      <!-- With icons (child nodes) -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">With icons</h2>
        <div class="flex gap-4 flex-wrap">
          <${Button} variant="primary" size="md">
            <span class="avi-button__icon avi-button__icon--before">→</span>
            Icon before
          </${Button}>
          <${Button} variant="primary" size="md">
            Icon after
            <span class="avi-button__icon avi-button__icon--after">→</span>
          </${Button}>
          <${Button} variant="secondary" size="md">
            <span class="avi-button__icon avi-button__icon--before">✓</span>
            Both sides
            <span class="avi-button__icon avi-button__icon--after">→</span>
          </${Button}>
        </div>
      </section>

      <!-- Icon only mode -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Icon only mode</h2>
        <div class="flex gap-4 items-center flex-wrap">
          <${Button} variant="primary" size="xxs" iconOnly=${true}>
            <span class="avi-button__icon">☰</span>
          </${Button}>
          <${Button} variant="primary" size="md" iconOnly=${true}>
            <span class="avi-button__icon">☰</span>
          </${Button}>
          <${Button} variant="secondary" size="md" iconOnly=${true}>
            <span class="avi-button__icon">+</span>
          </${Button}>
          <${Button} variant="danger" size="md" iconOnly=${true}>
            <span class="avi-button__icon">×</span>
          </${Button}>
          <${Button} variant="primary" size="sm" iconOnly=${true}>
            <span class="avi-button__icon">→</span>
          </${Button}>
          <${Button} variant="transparent" size="md" iconOnly=${true}>
            <span class="avi-button__icon">☰</span>
          </${Button}>
        </div>
      </section>

      <!-- States -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">States</h2>
        <div class="flex gap-4 flex-wrap items-center">
          <${Button} variant="primary" size="md">Normal</${Button}>
          <${Button} variant="primary" size="md" disabled=${true}>Disabled</${Button}>
          <${Button} variant="secondary" size="md" disabled=${true}>Disabled Secondary</${Button}>
          <${Button} variant="tertiary" size="md" disabled=${true}>Disabled Tertiary</${Button}>
          <${Button} variant="danger" size="md" disabled=${true}>Disabled Danger</${Button}>
          <${Button} variant="transparent" size="md" disabled=${true}>Disabled Transparent</${Button}>
        </div>
        <div class="mt-4 flex gap-4 flex-wrap items-center">
          <${Button} variant="primary" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="secondary" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="tertiary" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="danger" size="md" loading=${true}>Loading</${Button}>
          <${Button} variant="transparent" size="md" loading=${true}>Loading</${Button}>
        </div>
        <p class="mt-4 text-sm text-gray-500">
          Note: The "Focused" state is activated by clicking or using Tab to navigate with the keyboard
        </p>
      </section>

      <!-- Combinations: Variants and Sizes -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6">Combinations: Variants and Sizes</h2>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Primary</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="primary" size="xxs">XXS</${Button}>
            <${Button} variant="primary" size="xs">XS</${Button}>
            <${Button} variant="primary" size="sm">SM</${Button}>
            <${Button} variant="primary" size="md">MD</${Button}>
            <${Button} variant="primary" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Secondary</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="secondary" size="xxs">XXS</${Button}>
            <${Button} variant="secondary" size="xs">XS</${Button}>
            <${Button} variant="secondary" size="sm">SM</${Button}>
            <${Button} variant="secondary" size="md">MD</${Button}>
            <${Button} variant="secondary" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Tertiary</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="tertiary" size="xxs">XXS</${Button}>
            <${Button} variant="tertiary" size="xs">XS</${Button}>
            <${Button} variant="tertiary" size="sm">SM</${Button}>
            <${Button} variant="tertiary" size="md">MD</${Button}>
            <${Button} variant="tertiary" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Danger</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="danger" size="xxs">XXS</${Button}>
            <${Button} variant="danger" size="xs">XS</${Button}>
            <${Button} variant="danger" size="sm">SM</${Button}>
            <${Button} variant="danger" size="md">MD</${Button}>
            <${Button} variant="danger" size="lg">LG</${Button}>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Transparent</h3>
          <div class="flex gap-4 items-center flex-wrap">
            <${Button} variant="transparent" size="xxs">XXS</${Button}>
            <${Button} variant="transparent" size="xs">XS</${Button}>
            <${Button} variant="transparent" size="sm">SM</${Button}>
            <${Button} variant="transparent" size="md">MD</${Button}>
            <${Button} variant="transparent" size="lg">LG</${Button}>
          </div>
        </div>
      </section>

    </div>
  `;

export default ButtonSample;
