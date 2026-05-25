import { h } from '@dropins/tools/preact.js';
import { useEffect, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Modal } from '../../../molecules/modal/modal.js';
import { Logo } from '../../../atoms/logo/logo.js';
import { LanguageSelectorButton } from '../language-selector-button/language-selector-button.js';
import { PosForm } from '../pos-form/pos-form.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';
import { waitForHlxCodeBasePath, buildIconPath } from '../../../../scripts/utils/hlx.helper.js';
import { Icon } from '../../../atoms/icon/icon.js';
import {
  getCountries,
  getLanguages,
  getStoredPos,
  parsePos,
  setStoredPos,
  buildPos,
  getStorageEventName,
  navigateToPOS,
} from '../../../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

/**
 * NavbarMobile - Componente de navegación mobile del header
 *
 * ## Props
 * - `sections`: `Array` – Array de objetos con la estructura de navegación:
 *   `[{ itemLabel: string, url: string, subItems?: Array }]`.
 * - `customClassName`: Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 */
export const NavbarMobile = ({
  sections = [],
  customClassName = '',
  ...rest
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  const [menuIcon, setMenuIcon] = useState(null);
  const [chevronIcon, setChevronIcon] = useState(null);
  const [backIcon, setBackIcon] = useState(null);
  const [posFormLabels, setPosFormLabels] = useState(() => window.__languageSelectorLabels || {});

  // Get all countries and languages from service (load once)
  const allCountries = getCountries();
  const allLanguages = getLanguages();

  useEffect(() => {
    const loadIcons = async () => {
      try {
        // Wait for window.hlx to be initialized with robust retry logic
        const codeBasePath = await waitForHlxCodeBasePath({
          maxRetries: 30, // 30 retries = 3 seconds total
          retryDelay: 100,
        });

        const menuIconPath = buildIconPath('menu.svg', codeBasePath);
        const chevronIconPath = buildIconPath('chevron-right.svg', codeBasePath);
        const backIconPath = buildIconPath('back-icon.svg', codeBasePath);

        const [
          menuIconSVG,
          chevronIconSVG,
          backIconSVG,
        ] = await Promise.all([
          loadSVGIcon(menuIconPath).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Error loading menu icon:', menuIconPath, err);
            return null;
          }),
          loadSVGIcon(chevronIconPath).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Error loading chevron icon:', chevronIconPath, err);
            return null;
          }),
          loadSVGIcon(backIconPath).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Error loading back icon:', backIconPath, err);
            return null;
          }),
        ]);

        setMenuIcon(menuIconSVG);
        setChevronIcon(chevronIconSVG);
        setBackIcon(backIconSVG);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading icons:', error);
      }
    };

    loadIcons();
  }, []);

  // Render icon as Preact vnode using dangerouslySetInnerHTML
  const renderIcon = (svgElement, size = null) => {
    if (!svgElement) return null;

    // Clone the SVG element to modify it
    const clonedSvg = svgElement.cloneNode(true);
    if (size) {
      clonedSvg.setAttribute('width', size);
      clonedSvg.setAttribute('height', size);
    }

    // Ensure paths use currentColor
    const paths = clonedSvg.querySelectorAll('path');
    paths.forEach((path) => {
      const fill = path.getAttribute('fill');
      const stroke = path.getAttribute('stroke');
      if (fill && fill !== 'none' && fill !== 'currentColor') {
        path.setAttribute('fill', 'currentColor');
      }
      if (stroke && stroke !== 'none' && stroke !== 'currentColor') {
        path.setAttribute('stroke', 'currentColor');
      }
    });

    return html`
      <span
        class="inline-flex items-center justify-center"
        dangerouslySetInnerHTML=${{ __html: clonedSvg.outerHTML }}
      />
    `;
  };

  const handleMenuClick = () => {
    setIsModalOpen(true);
    setSelectedSection(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSection(null);
    setShowLanguageForm(false);
  };

  const handleNavLinkClick = () => {
    handleCloseModal();
  };

  const handleSectionClick = (section) => {
    if (section.subItems && section.subItems.length > 0) {
      setSelectedSection(section);
    }
  };

  const handleBackClick = () => {
    setSelectedSection(null);
  };

  const handleLanguageButtonClick = () => {
    setShowLanguageForm(true);
    setSelectedSection(null);
  };

  const handleLanguageFormClose = () => {
    setShowLanguageForm(false);
  };

  const handleLanguageFormBack = () => {
    setShowLanguageForm(false);
  };

  const handleLanguageFormConfirm = (data) => {
    const { language, country } = data;
    const newPos = buildPos(language, country);
    // Save to cookies
    setStoredPos(newPos);
    // Close form view and return to main menu
    setShowLanguageForm(false);
    // Navigate to the new POS path (explicit user action)
    navigateToPOS(newPos);
  };

  // Sync labels published by the header-language-selector block
  useEffect(() => {
    const handler = (e) => setPosFormLabels(e.detail || {});
    window.addEventListener('language-selector-labels', handler);
    return () => window.removeEventListener('language-selector-labels', handler);
  }, []);

  // Listen to cookie changes from header (desktop)
  useEffect(() => {
    const handleStorageChange = () => {
      // This will trigger re-render of LanguageSelectorButton
      // No need to do anything here as the button listens to the same event
    };

    window.addEventListener(getStorageEventName(), handleStorageChange);

    return () => {
      window.removeEventListener(getStorageEventName(), handleStorageChange);
    };
  }, []);

  const handleBackKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBackClick();
    }
  };

  // Render main menu
  const renderMainMenu = () => html`
      <nav role="navigation" aria-label="Navegación principal">
        <ul class="list-none p-0 !m-0 flex flex-col border-b border-[var(--border-stroke-default)]">
          ${sections.map((section) => {
    const hasSubItems = section.subItems && section.subItems.length > 0;

    if (hasSubItems) {
      return html`
                <li class="group/itemList flex flex-row items-center h-[72px]" key=${section.url}>
                  <div class="hidden group-hover/itemList:block bg-[var(--color-background-brand-highlight-default)] h-[36px] w-[4px]"></div>
                  <div class="w-full py-[24px] h-[72px] px-[16px] text-[16px] group-hover/itemList:translate-x-2 transition-transform">
                    <button
                      type="button"
                      class=${`
                        h-[21px] flex items-center justify-between no-underline text-base font-normal 
                        text-[var(--text-normal-primary)] w-full bg-transparent border-none cursor-pointer p-0 
                        text-left transition-colors 
                        group-hover/itemList:text-[var(--brand-secondary)] 
                        focus-visible:outline-none focus-visible:ring-0
                        [&:hover]:scale-100
                        `}
                      onClick=${() => handleSectionClick(section)}
                    >
                      <span>${section.itemLabel}</span>
                      <span class="w-6 h-6 inline-flex items-center justify-center shrink-0 ml-3">
                        ${renderIcon(chevronIcon, '12')}
                      </span>
                    </button>
                  </div>
                </li>
              `;
    }

    return html`
              <li class="group/itemList flex flex-row items-center" key=${section.url}>
                <div class="hidden group-hover/itemList:block bg-[var(--color-background-brand-highlight-default)] h-[36px] w-[4px]"></div>
                <div class="w-full py-[24px] px-[16px] text-[16px] group-hover:translate-x-2 transition-transform" >
                  <a
                    href=${section.url}
                    class="flex items-center justify-between no-underline text-base font-normal text-[var(--text-normal)] w-full transition-colors group-hover/itemList:text-[var(--brand-secondary)] [&:hover]:scale-100"
                    onClick=${handleNavLinkClick}
                  >
                    <span>${section.itemLabel}</span>
                  </a>
                </div>
              </li>
            `;
  })}
        </ul>
        <!-- Language Selector Button -->
        <div class="px-[1rem] py-[1.5rem]">
          <${LanguageSelectorButton} onClick=${handleLanguageButtonClick} customClassName="[&:hover]:scale-100" />
        </div>
      </nav>
    `;

  // Render language form view
  const renderLanguageFormView = () => {
    const storedPos = getStoredPos();
    const { country: currentCountry, language: currentLanguage } = parsePos(storedPos || '');

    return html`
      <div>
          <${PosForm}
            countries=${allCountries}
            languages=${allLanguages}
            initialCountry=${currentCountry || ''}
            initialLanguage=${currentLanguage || ''}
            onConfirm=${handleLanguageFormConfirm}
            onClose=${handleLanguageFormClose}
            showCloseButton=${false}
            responsiveMode=${true}
            title=${posFormLabels.title || null}
            countryLabel=${posFormLabels.countryLabel || null}
            languageLabel=${posFormLabels.languageLabel || null}
            confirmButtonText=${posFormLabels.confirmButtonText || null}
          />
      </div>
    `;
  };

  // Render sub-items view
  const renderSubItemsView = () => {
    if (!selectedSection || !selectedSection.subItems) return null;

    return html`
      <div>
        <div
          class="flex items-center gap-4 mb-6 cursor-pointer"
          onClick=${handleBackClick}
          role="button"
          tabIndex="0"
          aria-label="Volver al menú principal"
          onKeyDown=${handleBackKeyDown}
        >
          <button
            type="button"
            aria-label="Volver"
            class="inline-flex items-center justify-center w-6 h-6 p-0 bg-transparent border-none cursor-pointer shrink-0 text-[var(--text-normal-primary)]"
          >
            ${renderIcon(backIcon)}
          </button>
          <h2 class="!text-lg font-bold text-[var(--color-text-normal-primary)] m-0 flex-1">${selectedSection.itemLabel}</h2>
        </div>
        <nav role="navigation" aria-label=${`Submenú de ${selectedSection.itemLabel}`}>
          <ul class="list-none p-0 m-0 flex flex-col">
            ${selectedSection.subItems.map((subItem) => {
    const [isHovered, setIsHovered] = useState(false);
    const isExternalLink = subItem.url && subItem.url.startsWith('http');
    return html`
                <li
                  onMouseEnter=${() => setIsHovered(true)}
                  onMouseLeave=${() => setIsHovered(false)}
                  class="sub-item-link hover:text-[var(--brand-secondary)]  h-[56px] group flex flex-row items-center"
                  key=${subItem.url || subItem.itemLabel}
                >
                  <div class="w-full flex items-center justify-center h-[56px] py-[16px] px-[16px] text-[16px] group-hover:translate-x-2 transition-transform" >
                    <a
                      href=${subItem.url || '#'}
                      target=${isExternalLink ? '_blank' : undefined}
                      rel=${isExternalLink ? 'noopener noreferrer' : undefined}
                      class="flex items-center justify-between no-underline text-base font-medium text-[var(--text-normal-secondary)] w-full transition-colors hover:text-[var(--brand-secondary)] active:text-[var(--brand-secondary)] focus-visible:outline-none focus-visible:ring-0 [&:hover]:scale-100"
                      onClick=${handleNavLinkClick}
                    >
                      <span class=${`sub-item-link-text  h-[21px] ${isHovered ? 'text-[var(--brand-secondary)]' : 'text-[var(--text-normal-secondary)]'}`}>${subItem.itemLabel}</span>
                      <span class=${`w-6 h-6 inline-flex items-center justify-center shrink-0 ml-4 ${isHovered ? 'text-[var(--brand-secondary)]' : 'text-[var(--text-normal-secondary)]'}`}>
                        <${Icon}
                          icon=${isExternalLink ? 'navigation/open-in-new-16' : 'navigation/arrow-forward-16'}
                          size="s"
                          customClassName=${isHovered ? 'text-[var(--brand-secondary)]' : 'text-[var(--text-normal-secondary)]'}
                        />
                      </span>
                    </a>
                  </div>
                </li>
              `;
  })}
          </ul>
        </nav>
      </div>
    `;
  };

  // Render modal content based on current state
  const renderModalContent = () => {
    if (showLanguageForm) {
      return renderLanguageFormView();
    }
    if (selectedSection) {
      return renderSubItemsView();
    }
    return renderMainMenu();
  };

  return html`
    <div class=${`${customClassName} flex items-center`} ...${rest}>
      <button
        type="button"
        aria-label="Abrir menú de navegación"
        aria-expanded=${isModalOpen}
        onClick=${handleMenuClick}
        class="inline-flex items-center justify-center w-6 h-6 p-0 bg-transparent border-none cursor-pointer rounded text-[var(--brand-primary)] transition-colors"
      >
        <${Icon} icon="navigation/menu" size="sm" customClassName="!w-[18px] !h-[18px]" />
      </button>
      <${Modal}
        isOpen=${isModalOpen}
        onClose=${handleCloseModal}
        variant="left"
        size="full"
        showCloseButton=${false}
        clickOutsideToClose=${true}
        escapeToClose=${true}
        contentClassName="!rounded-[0]"
      >
        <div>
          <header class="flex items-center justify-between p-4 lg:px-8 !h-[76px] mb-6">
            <div class="w-auto !h-[24px]">
               <${Logo} variant="primary" mode="mobile" size="small" customImageClassName="!w-auto !h-[24px]" />
            </div>
            <button
              type="button"
              aria-label="Cerrar menú de navegación"
              class="inline-flex items-center justify-center w-6 h-6 p-0 bg-transparent border-none cursor-pointer rounded text-[var(--brand-primary)] transition-colors"
              onClick=${handleCloseModal}
            >
              <${Icon} icon="action/close-14" size="xl" color="var(--brand-primary)" />
            </button>
          </header>
          <div class="px-[16px] lg:px-8">
            ${renderModalContent()}
          </div>
        </div>
      </${Modal}>
    </div>
  `;
};

export default NavbarMobile;
