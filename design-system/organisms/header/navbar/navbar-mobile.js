import { h } from '@dropins/tools/preact.js';
import { useEffect, useRef, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Modal } from '../../../molecules/modal/modal.js';
import { Logo } from '../../../atoms/logo/logo.js';
import { LanguageSelectorButton } from '../language-selector-button/language-selector-button.js';
import { PosForm } from '../pos-form/pos-form.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';
import { sanitizeSVG } from '../../../../scripts/utils/sanitize.js';
import { waitForHlxCodeBasePath, buildIconPath } from '../../../../scripts/utils/hlx.helper.js';
import { Icon } from '../../../atoms/icon/icon.js';
import { MegamenuItem } from '../../../molecules/megamenu/megamenu.js';
import { CabinUpgradeForm } from '../../forms/cabin-upgrade-form/cabin-upgrade-form.js';
import { MMBForm } from '../../forms/mmb-form/mmb-form.js';
import { SSCIForm } from '../../forms/ssci-form/ssci-form.js';
import {
  getCountries,
  getLanguages,
  getAllowedLanguages,
  getDefaultLanguage,
  getStoredPos,
  parsePos,
  setStoredPos,
  buildPos,
  getStorageEventName,
  navigateToPOS,
} from '../../../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

// Inject CSS overrides for the CMS banner slot inside the mobile megamenu drawer.
// 3-class chain beats (0,2,0) specificity in cms-secondary-banner.css.
const MOBILE_MM_STYLE_ID = 'megamenu-mobile-banner-styles';
if (!document.getElementById(MOBILE_MM_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = MOBILE_MM_STYLE_ID;
  s.textContent = [
    '.megamenu-mobile-banner .cms-secondary-banner{height:auto;}',
    '.megamenu-mobile-banner .cms-secondary-banner .cms-secondary-banner-content{padding:0;}',
    '.megamenu-mobile-banner .cms-secondary-banner .cms-secondary-banner-content>div{',
    'max-width:100%;width:100%;margin:0;padding-bottom:0;border-radius:0;box-shadow:none;}',
  ].join('');
  document.head.appendChild(s);
}

/**
 * MegaBannerSlot - Renders the banner area in the mobile megamenu drawer.
 * When formType is set it renders the matching form component;
 * otherwise it clones the decorated CMS block into the slot.
 */
const MegaBannerSlot = ({ cmsBlock, formType, formLabel }) => {
  const slotRef = useRef(null);
  useEffect(() => {
    const el = slotRef.current;
    if (!el || formType || !cmsBlock) return undefined;

    let rafId = null;
    // Debounced re-clone: collapses bursts of source mutations (e.g., during a
    // resize sweep where Preact re-renders multiple times) into a single sync
    // after the next frame. Also skips work when the slot is offscreen (modal
    // hidden under desktop viewport) — there is no point updating an invisible
    // slot, and avoiding the work prevents transient layouts from leaking.
    const scheduleSync = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const slot = slotRef.current;
        if (!slot) return;
        if (slot.offsetParent === null) return;
        slot.innerHTML = '';
        const clone = cmsBlock.cloneNode(true);
        clone.style.display = '';
        slot.appendChild(clone);

        // El card de la variante izquierda usa `!h-fit` (fit-content, correcto para el
        // banner standalone del CMS). Pero en el slot del menu mobile debe LLENAR los
        // 220px del slot en tablet (como en produccion y en el megamenu desktop); si no,
        // queda ~160px y el contenido/CTA se recorta. El `!h-fit` (Tailwind v4) no cede a
        // CSS externo, asi que se fuerza inline. En mobile (<768) se deja fit-content
        // (layout apilado, mas alto).
        const leftCard = clone.querySelector(
          '[data-name="secondary-banner"][data-image-position="left"]',
        );
        if (leftCard) {
          // OJO: hay que usar priority 'important' — el card trae `md:!h-fit`
          // (height:fit-content !important de Tailwind v4) y un inline sin important
          // NO lo gana. En mobile (<768) se quita para dejar el fit-content apilado.
          if (window.innerWidth >= 768) {
            leftCard.style.setProperty('height', '220px', 'important');
          } else {
            leftCard.style.removeProperty('height');
          }
        }
      });
    };

    scheduleSync();

    // Observe SOURCE for changes (e.g., viewport-driven re-renders that swap
    // condor SVGs or picture wrappers). Without this, the clone is a stale
    // snapshot of whatever state the source had at the moment the modal
    // opened, and the condor / picture would not appear after a desktop→mobile
    // resize because the source mutates after the clone was made.
    const observer = new MutationObserver(scheduleSync);
    observer.observe(cmsBlock, { childList: true, subtree: true });

    // Re-aplica la altura del card (fija en tablet, fit-content en mobile) al cruzar
    // el breakpoint de 768px sin que la fuente mute.
    window.addEventListener('resize', scheduleSync, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleSync);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [cmsBlock, formType]);

  if (formType === 'cabin-upgrade') {
    return html`
      <div class="megamenu-mobile-banner rounded-[16px] mt-6">
        <${CabinUpgradeForm} />
      </div>
    `;
  }
  if (formType === 'mmb') {
    // The label is read from i18n (`mmbForm.megamenuLabel`) and rendered by
    // the organism itself in simplified mode.
    return html`
      <div class="megamenu-mobile-banner rounded-[16px] mt-6 flex flex-col gap-4">
        <${MMBForm} simplified=${true} context="megamenu" />
      </div>
    `;
  }
  if (formType === 'ssci') {
    // Same wrapper as MMB; SSCI organism reads its label from i18n
    // (`ssciForm.megamenuLabel`) in simplified mode.
    return html`
      <div class="megamenu-mobile-banner rounded-[16px] mt-6 flex flex-col gap-4">
        <${SSCIForm} simplified=${true} context="megamenu" />
      </div>
    `;
  }
  return html`<div ref=${slotRef} class="megamenu-mobile-banner rounded-[16px] overflow-hidden md:min-h-[220px]" />`;
};

/**
 * NavbarMobile - Mobile header navigation component
 *
 * ## Props
 * - `sections`: `Array` – Array of objects with the navigation structure:
 *   `[{ itemLabel: string, url: string, subItems?: Array }]`.
 * - `customClassName`: Additional CSS classes.
 * - `...rest`: Other valid properties.
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
        dangerouslySetInnerHTML=${{ __html: sanitizeSVG(clonedSvg.outerHTML) }}
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

  // Auto-close mobile modal when viewport grows to desktop (≥1024). Otherwise
  // the modal stays mounted with stale mobile-state clones that the source's
  // MutationObserver can leak into the desktop megamenu — the user sees a
  // broken layout until the modal is closed manually.
  //
  // Usamos `matchMedia` con el MISMO query que header.js (`(max-width: 1023.98px)`)
  // para evitar off-by-one en Windows con DPR fraccional: `window.innerWidth`
  // redondea distinto al motor de media queries y podía dejar el modal abierto
  // 1px de rango justo cuando header.js ya había cambiado a modo desktop.
  useEffect(() => {
    if (!isModalOpen) return undefined;
    const mq = window.matchMedia('(max-width: 1023.98px)');
    const handleChange = () => {
      if (!mq.matches) {
        setIsModalOpen(false);
        setSelectedSection(null);
        setShowLanguageForm(false);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [isModalOpen]);

  const handleNavLinkClick = () => {
    handleCloseModal();
  };

  const handleSectionClick = (section) => {
    if (section.subItems && section.subItems.length > 0) {
      setSelectedSection(section);
    } else if (section.megamenu && section.megamenu.columns?.length > 0) {
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
    const hasMegamenu = section.megamenu && section.megamenu.columns?.length > 0;
    const isExpandable = hasSubItems || hasMegamenu;
    // Estado seleccionado (1263924, Sub C): "Lifemiles" destacado en rutas /members.
    const isSelected = !!section.selected;

    if (isExpandable) {
      return html`
              <li class="group/itemList flex flex-row items-center" key=${section.url}>
                  <div class=${`${isSelected ? 'block' : 'hidden group-hover/itemList:block'} bg-[var(--color-background-brand-highlight-default)] h-[36px] w-[4px]`}></div>
                  <div class="w-full py-4 px-0 text-[16px] group-hover/itemList:translate-x-2 transition-transform">
                    <button
                      type="button"
                      aria-current=${isSelected ? 'page' : undefined}
                      class=${`
                        h-[21px] flex items-center justify-between no-underline text-base ${isSelected ? 'font-bold' : 'font-normal'}
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
                <div class=${`${isSelected ? 'block' : 'hidden group-hover/itemList:block'} bg-[var(--color-background-brand-highlight-default)] h-[36px] w-[4px]`}></div>
                <div class="w-full py-4 px-0 text-[16px] group-hover:translate-x-2 transition-transform" >
                  <a
                    href=${section.url}
                    aria-current=${isSelected ? 'page' : undefined}
                    class=${`flex items-center justify-between no-underline text-base ${isSelected ? 'font-bold' : 'font-normal'} text-[var(--text-normal)] w-full transition-colors group-hover/itemList:text-[var(--brand-secondary)] [&:hover]:scale-100`}
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
        <div class="px-0 py-4">
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
            getAllowedLanguages=${getAllowedLanguages}
            getDefaultLanguage=${getDefaultLanguage}
            title=${posFormLabels.title || null}
            countryLabel=${posFormLabels.countryLabel || null}
            languageLabel=${posFormLabels.languageLabel || null}
            confirmButtonText=${posFormLabels.confirmButtonText || null}
          />
      </div>
    `;
  };

  // Render sub-items view — handles both legacy subItems and megamenu columns
  const renderSubItemsView = () => {
    if (!selectedSection) return null;

    // Build a flat list of items to display
    let itemsToRender = [];

    if (selectedSection.megamenu && selectedSection.megamenu.columns?.length > 0) {
      // Megamenu: render each column as a titled group
      const { columns } = selectedSection.megamenu;
      return html`
        <div class="flex flex-col gap-6 md:gap-4">
          <div
            class="flex items-center gap-3 cursor-pointer py-3"
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
            <h2 class="font-bold text-[var(--text-normal-primary)] m-0 flex-1">${selectedSection.itemLabel}</h2>
          </div>
          <nav role="navigation" aria-label=${`Submenú de ${selectedSection.itemLabel}`} class="flex flex-col gap-4 md:grid md:grid-cols-3 lg:gap-6">
            ${columns.map((col) => html`
              <div class="flex flex-col gap-4" key=${col.title}>
                ${col.title && html`
                  <p class="font-bold text-[#2B3C46] mb-4 !m-0">${col.title}</p>
                `}
                <ul class="list-none p-0 !m-0 flex flex-col" onClick=${handleNavLinkClick}>
                  ${col.items.map((item) => html`
                    <${MegamenuItem}
                      key=${item.url || item.label}
                      label=${item.label}
                      url=${item.url}
                      openMode=${item.openMode}
                      iconName=${item.iconName}
                    />
                  `)}
                </ul>
              </div>
            `)}
          </nav>          ${(selectedSection.megamenu.cmsBlock || selectedSection.megamenu.formType) && html`
            <${MegaBannerSlot} cmsBlock=${selectedSection.megamenu.cmsBlock} formType=${selectedSection.megamenu.formType} formLabel=${selectedSection.megamenu.formLabel} />
          `}        </div>
      `;
    }

    // Legacy: flat subItems list
    if (!selectedSection.subItems) return null;
    itemsToRender = selectedSection.subItems;

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
          <h2 class="font-bold text-[var(--color-text-normal-primary)] m-0 flex-1">${selectedSection.itemLabel}</h2>
        </div>
        <nav role="navigation" aria-label=${`Submenú de ${selectedSection.itemLabel}`}>
          <ul class="list-none p-0 !m-0 flex flex-col">
            ${itemsToRender.map((subItem) => {
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
          <header class="flex items-center justify-between px-4 lg:px-8 !h-[76px] mb-0 shadow-small">
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
          <div class="p-4 md:p-6 lg:px-8">
            ${renderModalContent()}
          </div>
        </div>
      </${Modal}>
    </div>
  `;
};

export default NavbarMobile;
