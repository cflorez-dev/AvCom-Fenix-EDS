import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Accordion } from './accordion.js';

const html = htm.bind(h);

/**
 * AccordionSample - Showcase of Accordion component
 * Shows different usage examples of the accordion
 */
export const AccordionSample = () => {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(true);

  // Example content with links (as in Figma design)
  const linkContent = html`
    <div class="flex flex-col gap-[var(--spacing-small)] w-full">
      ${['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'].map((label, index) => html`
        <div
          key=${index}
          class="flex gap-[var(--spacing-x-small)] items-center py-[var(--spacing-small)] w-full"
        >
          <p 
            class="m-0 whitespace-nowrap"
            style=${{
              fontFamily: 'var(--paragraph-p300-family)',
              fontWeight: 'var(--paragraph-p300-weight)',
              fontSize: 'var(--paragraph-p300-size)',
              lineHeight: 'var(--paragraph-p300-line-height)',
              letterSpacing: 'var(--paragraph-p300-letter-spacing)',
              color: 'var(--text-normal-light)',
            }}
          >
            ${label}
          </p>
          <div class="w-4 h-4 shrink-0 flex items-center justify-center relative">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4H12V10" stroke="var(--text-normal-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 4L4 10" stroke="var(--text-normal-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      `)}
    </div>
  `;

  // Example with custom HTML content
  const customHtmlContent = html`
    <div class="p-[var(--spacing-medium)] rounded-[var(--border-radius-small)]" style=${{ background: 'var(--bg-page-light)' }}>
      <p 
        class="mb-[var(--spacing-small)]"
        style=${{
          fontFamily: 'var(--paragraph-p300-family)',
          color: 'var(--text-normal-primary)',
        }}
      >
        This is an example of custom HTML content.
      </p>
      <ul class="pl-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-primary)' }}>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    </div>
  `;

  // Example with component content
  const componentContent = html`
    <div class="flex flex-col gap-[var(--spacing-small)]">
      <p style=${{
        fontFamily: 'var(--paragraph-p300-family)',
        color: 'var(--text-normal-primary)',
      }}>
        You can include any component here:
      </p>
      <div class="flex gap-[var(--spacing-small)] flex-wrap">
        <button 
          class="px-[var(--spacing-medium)] py-[var(--spacing-small)] border-0 rounded-[var(--border-radius-small)] cursor-pointer"
          style=${{
            background: 'var(--brand-primary)',
            color: 'var(--text-normal-lighter)',
          }}
        >
          Button 1
        </button>
        <button 
          class="px-[var(--spacing-medium)] py-[var(--spacing-small)] border-0 rounded-[var(--border-radius-small)] cursor-pointer"
          style=${{
            background: 'var(--brand-secondary)',
            color: 'var(--text-normal-lighter)',
          }}
        >
          Button 2
        </button>
      </div>
    </div>
  `;

  return html`
    <div class="p-10 max-w-[1200px] mx-auto" style=${{ background: 'var(--bg-brand-primary-default)' }}>
      <h1 class="mb-[var(--spacing-x-large)]" style=${{ color: 'var(--text-normal-lighter)' }}>
        Accordion Component Examples
      </h1>

      <!-- Example 1: Accordion closed by default with links -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-lighter)' }}>
          Example 1: Accordion with Links (Figma Design)
        </h2>
        <${Accordion}
          title="Navigation"
          defaultOpen=${isOpen1}
          onToggle=${setIsOpen1}
        >
          ${linkContent}
        </${Accordion}>
      </section>

      <!-- Example 2: Accordion open by default -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-lighter)' }}>
          Example 2: Accordion Open by Default
        </h2>
        <${Accordion}
          title="Information"
          defaultOpen=${isOpen2}
          onToggle=${setIsOpen2}
        >
          ${linkContent}
        </${Accordion}>
      </section>

      <!-- Example 3: Accordion with custom HTML -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-lighter)' }}>
          Example 3: Accordion with Custom HTML
        </h2>
        <${Accordion} title="HTML Content">
          ${customHtmlContent}
        </${Accordion}>
      </section>

      <!-- Example 4: Accordion with components -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-lighter)' }}>
          Example 4: Accordion with Components
        </h2>
        <${Accordion} title="Components">
          ${componentContent}
        </${Accordion}>
      </section>

      <!-- Example 5: Multiple Accordions -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-lighter)' }}>
          Example 5: Multiple Accordions
        </h2>
        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <${Accordion} title="Section 1">
            <p style=${{ color: 'var(--text-normal-lighter)' }}>Content of section 1</p>
          </${Accordion}>
          <${Accordion} title="Section 2">
            <p style=${{ color: 'var(--text-normal-lighter)' }}>Content of section 2</p>
          </${Accordion}>
          <${Accordion} title="Section 3">
            <p style=${{ color: 'var(--text-normal-lighter)' }}>Content of section 3</p>
          </${Accordion}>
        </div>
      </section>

      <!-- Example 6: Different Heading Levels -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]" style=${{ color: 'var(--text-normal-lighter)' }}>
          Example 6: Different Heading Levels (H2, H3, H4)
        </h2>
        <div class="flex flex-col gap-[var(--spacing-medium)]">
          <${Accordion} title="Heading Level 2" titleLevel="h2">
            <p style=${{ color: 'var(--text-normal-lighter)' }}>This accordion uses an H2 tag for semantic heading hierarchy</p>
          </${Accordion}>
          <${Accordion} title="Heading Level 3" titleLevel="h3">
            <p style=${{ color: 'var(--text-normal-lighter)' }}>This accordion uses an H3 tag for semantic heading hierarchy</p>
          </${Accordion}>
          <${Accordion} title="Heading Level 4" titleLevel="h4">
            <p style=${{ color: 'var(--text-normal-lighter)' }}>This accordion uses an H4 tag for semantic heading hierarchy</p>
          </${Accordion}>
        </div>
      </section>
    </div>
  `;
};

export default AccordionSample;
