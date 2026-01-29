import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Modal } from './modal.js';
import { ModalAviancaLayout } from './modal-avianca-layout.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * ModalSample - Modal component showcase
 * Shows different examples of modal usage
 */
export const ModalSample = () => {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);
  const [isOpen4, setIsOpen4] = useState(false);
  const [isOpen5, setIsOpen5] = useState(false);
  const [isOpen6, setIsOpen6] = useState(false);
  const [isOpenAvianca, setIsOpenAvianca] = useState(false);

  // Example 1: Simple modal with HTML content
  const simpleContent = html`
    <div>
      <h2 class="font-[var(--heading-h500-family)] text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
        Modal Title
      </h2>
      <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
        This is an example of simple content inside the modal. You can add any HTML or component here.
      </p>
      <div class="flex gap-[var(--spacing-small)] justify-end">
        <${Button} variant="secondary" onClick=${() => setIsOpen1(false)}>
          Cancel
        </${Button}>
        <${Button} variant="primary" onClick=${() => setIsOpen1(false)}>
          Accept
        </${Button}>
      </div>
    </div>
  `;

  // Example 2: Modal with form
  const formContent = html`
    <div>
      <h2 class="font-[var(--heading-h500-family)] text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
        Contact Form
      </h2>
      <form class="flex flex-col gap-[var(--spacing-medium)]">
        <div>
          <label class="block font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-tiny)]">
            Name
          </label>
          <input
            type="text"
            class="w-full p-[var(--spacing-small)] border border-[var(--border-stroke-default)] rounded-[var(--border-radius-small)] font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)]"
          />
        </div>
        <div>
          <label class="block font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-tiny)]">
            Email
          </label>
          <input
            type="email"
            class="w-full p-[var(--spacing-small)] border border-[var(--border-stroke-default)] rounded-[var(--border-radius-small)] font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)]"
          />
        </div>
        <div class="flex gap-[var(--spacing-small)] justify-end">
          <${Button} variant="secondary" onClick=${() => setIsOpen2(false)}>
            Cancel
          </${Button}>
          <${Button} variant="primary" onClick=${() => setIsOpen2(false)}>
            Send
          </${Button}>
        </div>
      </form>
    </div>
  `;

  // Example 3: Large modal with complex content
  const largeContent = html`
    <div>
      <h2 class="font-[var(--heading-h500-family)] text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
        Complex Content
      </h2>
      <div class="flex flex-col gap-[var(--spacing-medium)]">
        <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)]">
          This modal can contain any type of complex content, including images, lists, tables, etc.
        </p>
        <div class="grid grid-cols-2 gap-[var(--spacing-medium)]">
          <div class="p-[var(--spacing-medium)] bg-[var(--bg-page-light)] rounded-[var(--border-radius-small)]">
            <h3 class="font-[var(--heading-h400-family)] text-[var(--heading-h400-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
              Section 1
            </h3>
            <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
              Section 1 content
            </p>
          </div>
          <div class="p-[var(--spacing-medium)] bg-[var(--bg-page-light)] rounded-[var(--border-radius-small)]">
            <h3 class="font-[var(--heading-h400-family)] text-[var(--heading-h400-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-small)]">
              Section 2
            </h3>
            <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)]">
              Section 2 content
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Example 4: Full screen modal
  const fullScreenContent = html`
    <div class="h-full flex flex-col">
      <h2 class="font-[var(--heading-h500-family)] text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
        Full Screen Modal
      </h2>
      <div class="flex-1 overflow-auto">
        <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
          This modal occupies the entire screen and is useful for extensive content or immersive experiences.
        </p>
      </div>
    </div>
  `;

  return html`
    <div class="p-[40px] max-w-[1200px] mx-auto">
      <h1 class="mb-[var(--spacing-x-large)]">
        Modal Component Examples
      </h1>

      <!-- Example 7: Avianca Layout Modal -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 7: Avianca Layout Modal
        </h2>
        <${Button} variant="secondary" onClick=${() => setIsOpenAvianca(true)}>
          Open Avianca Modal
        </${Button}>
        <${ModalAviancaLayout}
          isOpen=${isOpenAvianca}
          onClose=${() => setIsOpenAvianca(false)}
          title="Title"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam finibus est quam, eu suscipit mi aliquet vel. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam finibus est quam, eu suscipit mi aliquet vel."
          icon="alert/success"
          primaryButtonLabel="Confirmar"
          secondaryButtonLabel="Cancelar"
          onPrimaryClick=${() => {
    setIsOpenAvianca(false);
  }}
          onSecondaryClick=${() => setIsOpenAvianca(false)}
        />
      </section>

      <!-- Example 1: Simple modal -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 1: Simple Modal (Medium Size)
        </h2>
        <${Button} variant="primary" onClick=${() => setIsOpen1(true)}>
          Open Simple Modal
        </${Button}>
        <${Modal}
          isOpen=${isOpen1}
          onClose=${() => setIsOpen1(false)}
          size="md"
        >
          ${simpleContent}
        </${Modal}>
      </section>

      <!-- Example 2: Modal with form -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 2: Modal with Form (Medium Size)
        </h2>
        <${Button} variant="primary" onClick=${() => setIsOpen2(true)}>
          Open Modal with Form
        </${Button}>
        <${Modal}
          isOpen=${isOpen2}
          onClose=${() => setIsOpen2(false)}
          size="md"
        >
          ${formContent}
        </${Modal}>
      </section>

      <!-- Example 3: Large modal -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 3: Large Modal
        </h2>
        <${Button} variant="primary" onClick=${() => setIsOpen3(true)}>
          Open Large Modal
        </${Button}>
        <${Modal}
          isOpen=${isOpen3}
          onClose=${() => setIsOpen3(false)}
          size="lg"
        >
          ${largeContent}
        </${Modal}>
      </section>

      <!-- Example 4: Full screen modal -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 4: Full Screen Modal
        </h2>
        <${Button} variant="primary" onClick=${() => setIsOpen4(true)}>
          Open Full Screen Modal
        </${Button}>
        <${Modal}
          isOpen=${isOpen4}
          onClose=${() => setIsOpen4(false)}
          size="full"
        >
          ${fullScreenContent}
        </${Modal}>
      </section>

      <!-- Example 5: Side modal from left -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 5: Side Modal from Left
        </h2>
        <${Button} variant="primary" onClick=${() => setIsOpen5(true)}>
          Open Modal from Left
        </${Button}>
        <${Modal}
          isOpen=${isOpen5}
          onClose=${() => setIsOpen5(false)}
          variant="left"
          size="md"
        >
          <div>
            <h2 class="font-[var(--heading-h500-family)] text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
              Left Side Panel
            </h2>
            <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
              This modal opens from left to right. Useful for side menus, navigation, or configuration panels.
            </p>
            <div class="flex flex-col gap-[var(--spacing-small)]">
              <${Button} variant="secondary" onClick=${() => setIsOpen5(false)}>
                Close
              </${Button}>
            </div>
          </div>
        </${Modal}>
      </section>

      <!-- Example 6: Side modal from right -->
      <section class="mb-[var(--spacing-x-large)]">
        <h2 class="mb-[var(--spacing-medium)]">
          Example 6: Side Modal from Right
        </h2>
        <${Button} variant="primary" onClick=${() => setIsOpen6(true)}>
          Open Modal from Right
        </${Button}>
        <${Modal}
          isOpen=${isOpen6}
          onClose=${() => setIsOpen6(false)}
          variant="right"
          size="lg"
        >
          <div>
            <h2 class="font-[var(--heading-h500-family)] text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
              Right Side Panel
            </h2>
            <p class="font-[var(--paragraph-p300-family)] text-[var(--paragraph-p300-size)] text-[var(--text-normal-primary)] mb-[var(--spacing-medium)]">
              This modal opens from right to left. Ideal for shopping carts, filters, or additional information panels.
            </p>
            <div class="flex flex-col gap-[var(--spacing-small)]">
              <${Button} variant="secondary" onClick=${() => setIsOpen6(false)}>
                Close
              </${Button}>
            </div>
          </div>
        </${Modal}>
      </section>
    </div>
  `;
};

export default ModalSample;
