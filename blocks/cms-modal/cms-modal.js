import { h, render } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ModalAviancaLayout } from '../../design-system/molecules/modal/modal-avianca-layout.js';
import { Button } from '../../design-system/atoms/button/button.js';

const html = htm.bind(h);

/**
 * Extracts and maps CMS Modal data from block structure
 * Expected HTML structure (based on component model):
 * <!-- Col 0: Title -->
 * <!-- Col 1: Description (richtext) -->
 * <!-- Col 2: Primary CTA Label -->
 * <!-- Col 3: Primary CTA URL -->
 * <!-- Col 4: Primary CTA Open In New Tab -->
 * <!-- Col 5: Secondary CTA Label -->
 * <!-- Col 6: Secondary CTA URL -->
 * <!-- Col 7: Secondary CTA Open In New Tab -->
 * <!-- Col 8: Show Dismiss Button -->
 * <!-- Col 9: Icon -->
 * <!-- Col 10: Icon Image (reference) -->
 * <!-- Col 11: Cover Image (reference) -->
 * @param {Element} block - The cms-modal block element
 * @returns {Object} Object containing mapped modal data
 */
function extractCmsModalData(block) {
  if (!block || !block.children) {
    return {
      title: '',
      description: '',
      primaryCtaLabel: '',
      primaryCtaUrl: '',
      primaryCtaOpenInNewTab: false,
      secondaryCtaLabel: '',
      secondaryCtaUrl: '',
      secondaryCtaOpenInNewTab: false,
      showDismissButton: true,
      icon: '',
      iconImage: '',
      coverImage: '',
      autoOpen: false,
      variant: 'center',
      clickOutsideToClose: true,
      escapeToClose: true,
      role: 'dialog',
    };
  }

  const cols = Array.from(block.children);

  // Helper function to extract text content from a column
  const getTextContent = (col, preserveHTML = false) => {
    if (!col) return '';
    const p = col.querySelector('p');
    if (!p) return '';

    if (preserveHTML) {
      // For richtext fields, preserve HTML structure
      return p.innerHTML || '';
    }
    return p.textContent?.trim() || '';
  };

  // Helper function to extract URL from a link
  const getUrl = (col) => {
    if (!col) return '';
    const link = col.querySelector('a');
    if (link) {
      return link.getAttribute('href') || link.textContent?.trim() || '';
    }
    // Fallback: try to get from text content
    return getTextContent(col);
  };

  // Helper function to parse boolean values
  const parseBoolean = (col, defaultValue = false) => {
    const text = getTextContent(col).toLowerCase();
    if (text === 'true') return true;
    if (text === 'false') return false;
    return defaultValue;
  };

  // Col 0: Title
  const title = getTextContent(cols[0]);

  // Col 1: Description (richtext - preserve HTML)
  const description = getTextContent(cols[1], true);

  // Col 2: Primary CTA Label
  const primaryCtaLabel = getTextContent(cols[2]);

  // Col 3: Primary CTA URL
  const primaryCtaUrl = getUrl(cols[3]);

  // Col 4: Primary CTA Open In New Tab
  const primaryCtaOpenInNewTab = parseBoolean(cols[4], false);

  // Col 5: Secondary CTA Label
  const secondaryCtaLabel = getTextContent(cols[5]);

  // Col 6: Secondary CTA URL
  const secondaryCtaUrl = getUrl(cols[6]);

  // Col 7: Secondary CTA Open In New Tab
  const secondaryCtaOpenInNewTab = parseBoolean(cols[7], false);

  // Col 8: Show Dismiss Button
  const showDismissButton = parseBoolean(cols[8], true);

  // Col 9: Icon (system icon name)
  const icon = getTextContent(cols[9]);

  // Col 10: Icon Image (reference - extract image URL if present)
  const iconImageCol = cols[10];
  let iconImage = '';
  if (iconImageCol) {
    const img = iconImageCol.querySelector('img');
    if (img) {
      iconImage = img.getAttribute('src') || img.getAttribute('data-src') || '';
    } else {
      // Try to get from link if it's a reference
      const link = iconImageCol.querySelector('a');
      if (link) {
        iconImage = link.getAttribute('href') || '';
      }
    }
  }

  // Col 11: Cover Image (reference - extract image URL if present)
  const coverImageCol = cols[11];
  let coverImage = '';
  if (coverImageCol) {
    const img = coverImageCol.querySelector('img');
    if (img) {
      coverImage = img.getAttribute('src') || img.getAttribute('data-src') || '';
    } else {
      // Try to get from link if it's a reference
      const link = coverImageCol.querySelector('a');
      if (link) {
        coverImage = link.getAttribute('href') || '';
      }
    }
  }

  return {
    title,
    description,
    primaryCtaLabel,
    primaryCtaUrl,
    primaryCtaOpenInNewTab,
    secondaryCtaLabel,
    secondaryCtaUrl,
    secondaryCtaOpenInNewTab,
    showDismissButton,
    icon,
    iconImage,
    coverImage,
    // Default values for optional fields
    autoOpen: false,
    variant: 'center',
    clickOutsideToClose: true,
    escapeToClose: true,
    role: 'dialog',
  };
}

/**
 * CMS Modal Component
 * Overlay component that temporarily interrupts the user flow
 * to deliver important information, request confirmations, or present
 * critical actions within a process.
 * Fields are configured directly in the Universal Editor model:
 * - title: Main modal title
 * - description: Secondary text (richtext with HTML and line breaks)
 * - primaryCtaLabel, primaryCtaUrl, primaryCtaOpenInNewTab: Primary button
 * - secondaryCtaLabel, secondaryCtaUrl, secondaryCtaOpenInNewTab: Secondary button
 * - showDismissButton: Show close X button
 * - icon: System icon name (e.g., "alert/success")
 * - iconImage: Custom image/illustration
 * - coverImage: Modal header image
 * - autoOpen: Automatically open on page load
 * - variant: Modal position (center/left/right)
 * - clickOutsideToClose, escapeToClose: Close options
 * - role: ARIA role (dialog/alertdialog)
 * @param {Element} block The cms-modal block element
 */
export default function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;
  if (isAuthorEnv) {
    block.classList.add('cms-modal-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cms-modal-author-indicator';
    authorIndicator.textContent = '💬 CMS Modal (Author Mode - Configure below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 12px; border: 2px dashed #0066cc; margin-bottom: 8px; font-size: 14px; color: #333; font-weight: 600; border-radius: 4px;';
    block.insertBefore(authorIndicator, block.firstChild);
    return;
  }

  // Extract data from block structure
  const config = extractCmsModalData(block);
  const {
    autoOpen,
    variant = 'center',
    showDismissButton,
    clickOutsideToClose,
    escapeToClose,
    role = 'dialog',
  } = config;

  // Map extracted data to ModalAviancaLayout format
  const modalData = {
    title: config.title || '',
    description: config.description || '',
    primaryButtonLabel: config.primaryCtaLabel || '',
    primaryButtonHref: config.primaryCtaUrl || '',
    primaryButtonTarget: config.primaryCtaOpenInNewTab ? '_blank' : '',
    secondaryButtonLabel: config.secondaryCtaLabel || '',
    secondaryButtonHref: config.secondaryCtaUrl || '',
    secondaryButtonTarget: config.secondaryCtaOpenInNewTab ? '_blank' : '',
    icon: config.icon || '',
    image: config.iconImage || '',
    imageAlt: config.title || '',
    coverImage: config.coverImage || '',
    coverImageAlt: config.coverImageAlt || '',
  };
  const container = document.createElement('div');
  container.className = 'cms-modal-wrapper';
  container.dataset.blockName = 'cms-modal';
  const ModalWrapper = () => {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const handleClose = () => {
      setIsOpen(false);
    };
    const handlePrimaryClick = (e) => {
      if (modalData.primaryButtonTarget === '_blank') {
        window.open(modalData.primaryButtonHref, '_blank', 'noopener,noreferrer');
        e.preventDefault();
      }
      if (!modalData.primaryButtonHref) {
        handleClose();
      }
    };
    const handleSecondaryClick = (e) => {
      if (!modalData.secondaryButtonHref) {
        e.preventDefault();
        handleClose();
        return;
      }
      if (modalData.secondaryButtonTarget === '_blank') {
        window.open(modalData.secondaryButtonHref, '_blank', 'noopener,noreferrer');
        e.preventDefault();
        handleClose();
      }
    };
    const TriggerButton = !autoOpen && html`
      <${Button}
        variant="primary"
        onClick=${() => setIsOpen(true)}
        aria-label="Open modal"
        customClassName="m-2"
      >
        ${modalData.title || 'Open Modal'}
      </${Button}>
    `;
    return html`
      <div>
        ${!autoOpen && TriggerButton}
        <${ModalAviancaLayout}
          isOpen=${isOpen}
          onClose=${handleClose}
          title=${modalData.title}
          description=${modalData.description}
          primaryButtonLabel=${modalData.primaryButtonLabel}
          secondaryButtonLabel=${modalData.secondaryButtonLabel}
          icon=${modalData.icon}
          coverImage=${modalData.coverImage}
          coverImageAlt=${modalData.coverImageAlt}
          image=${modalData.image}
          imageAlt=${modalData.imageAlt}
          onPrimaryClick=${handlePrimaryClick}
          onSecondaryClick=${handleSecondaryClick}
          primaryButtonHref=${modalData.primaryButtonHref || undefined}
          secondaryButtonHref=${modalData.secondaryButtonHref || undefined}
          showCloseButton=${showDismissButton}
          clickOutsideToClose=${clickOutsideToClose}
          escapeToClose=${escapeToClose}
          variant=${variant}
          role=${role}
        />
      </div>
    `;
  };
  render(html`<${ModalWrapper} />`, container);
  container.dataset.autoOpen = autoOpen;
  container.dataset.variant = variant;
  container.dataset.showDismissButton = showDismissButton;
  block.style.display = 'none';
  block.parentNode.insertBefore(container, block.nextSibling);
}
