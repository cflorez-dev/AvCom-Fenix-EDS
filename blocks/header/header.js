import { getMetadata } from '../../scripts/aem.js';
import { getLocalizedPathsForErrorPage } from '../../scripts/utils/locale.js';
import { loadFragment } from '../fragment/fragment.js';

const isMobileNavbar = window.matchMedia('(max-width: 1247px)');
/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    block.classList.add('header-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'p-3 bg-[#e3f2fd] border-l-4 border-[#1976d2] mb-4 text-[13px] text-[#333]';
    authorIndicator.innerHTML = `
      <strong>📝 Header Block (Author Mode)</strong><br/>
      <span class="text-xs text-[#666]">Navigation data loaded from: <a href="/nav" class="text-[#1976d2]">/nav</a></span>
    `;
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }

  // Create header container structure FIRST so child blocks can find their containers
  // This fixes the race condition where header-navbar couldn't find .header-navbar-desktop
  const headerContainer = document.createElement('div');
  headerContainer.className = 'header-wrapper max-w-[1247px] w-full flex flex-row justify-between items-center h-[76px] min-[1440px]:h-[76px] top-[var(--marquee-height)]';
  headerContainer.innerHTML = `
    <div class="header-container flex flex-row items-center gap-[24px]">
      <div class="header-navbar-mobile"></div>
      <div class="header-logo flex items-center"></div>
    </div>
    <div class="header-navbar-desktop"></div>
    <div class="header-user-actions  h-[48px] flex items-center justify-center flex-row gap-[16px]">
      <div class="header-language-selector"></div>
      <div class="user-actions"></div>
    </div>
  `;

  block.style.display = 'none';

  if (block.parentNode) {
    block.parentNode.insertBefore(headerContainer, block.nextSibling);
  } else {
    block.after(headerContainer);
  }

  // Load nav as fragment with localized paths and fallback
  // Now containers exist in DOM so header-navbar can find them during decoration
  const navMeta = getMetadata('nav');
  const customPath = navMeta ? new URL(navMeta, window.location).pathname : null;
  const navPaths = await getLocalizedPathsForErrorPage('nav', customPath);
  // Try to load in priority order
  let fragment = null;
  for (const navPath of navPaths) {
    // Pass 'nav' as resourceType for path caching
    // eslint-disable-next-line no-await-in-loop
    fragment = await loadFragment(navPath, 'nav');
    if (fragment) {
      // eslint-disable-next-line no-console
      console.log(`✅ Header loaded from: ${navPath}`);
      break;
    }
  }
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.error('❌ No header fragment found in any path:', navPaths);
    return;
  }

  // Helper function to emit the event
  // Verifies that containers exist before firing
  const emitHeaderReadyEvent = () => {
    const logoContainer = headerContainer.querySelector('.header-logo');
    const mobileContainer = headerContainer.querySelector('.header-navbar-mobile');
    const desktopContainer = headerContainer.querySelector('.header-navbar-desktop');
    // Verify that critical containers exist before firing the event
    if (!logoContainer || !mobileContainer || !desktopContainer) {
      return false;
    }

    const eventDetail = {
      headerContainer,
      logoContainer,
      mobileContainer,
      desktopContainer,
      languageSelectorContainer: headerContainer.querySelector('.header-language-selector'),
      userActionsContainer: headerContainer.querySelector('.user-actions'),
    };

    window.dispatchEvent(new CustomEvent('header-template-ready', {
      detail: eventDetail,
    }));
    return true;
  };

  // Emit event with requestAnimationFrame to ensure DOM is fully rendered
  // This ensures containers are available before firing
  requestAnimationFrame(() => {
    if (!emitHeaderReadyEvent()) {
      // If containers are not ready yet, try again after a brief delay
      // This is especially important for Firefox and Edge
      setTimeout(() => {
        emitHeaderReadyEvent();
      }, 50);
    }
  });

  // Obtener referencias a los contenedores después de insertar en el DOM
  const mobileContainer = headerContainer.querySelector('.header-navbar-mobile');
  const desktopContainer = headerContainer.querySelector('.header-navbar-desktop');

  // Función para actualizar las clases de visibilidad según el tamaño de pantalla
  const updateVisibility = () => {
    const isMobileMode = isMobileNavbar.matches;
    const isDesktopMode = !isMobileMode;

    // Update header-wrapper class
    if (isDesktopMode) {
      headerContainer.classList.remove('isMobile');
      headerContainer.classList.add('isDesktop');
    } else {
      headerContainer.classList.remove('isDesktop');
      headerContainer.classList.add('isMobile');
    }

    // Update visibility of mobile and desktop containers
    if (mobileContainer) {
      if (isMobileMode) {
        mobileContainer.classList.remove('hidden');
        mobileContainer.classList.add('block');
      } else {
        mobileContainer.classList.remove('block', 'flex');
        mobileContainer.classList.add('hidden');
      }
    }

    if (desktopContainer) {
      if (isMobileMode) {
        desktopContainer.classList.remove('block', 'flex');
        desktopContainer.classList.add('hidden');
      } else {
        desktopContainer.classList.remove('hidden');
        desktopContainer.classList.add('block', 'flex');
      }
    }

    // Emit custom event to notify other components about resize
    window.dispatchEvent(new CustomEvent('header-resize', {
      detail: {
        isDesktop: isDesktopMode,
        headerContainer,
        logoContainer: headerContainer.querySelector('.header-logo'),
        mobileContainer,
        desktopContainer,
      },
    }));
  };

  // Aplicar visibilidad inicialmente
  updateVisibility();

  const headerRoot = block.closest('header');
  const updateHeaderSize = () => {
    const shouldShrink = window.scrollY > 0;
    headerContainer.classList.toggle('is-scrolled', shouldShrink);
    if (headerRoot) {
      headerRoot.classList.toggle('is-scrolled', shouldShrink);
    }
  };

  // Aplicar tamaño inicial según el scroll actual
  updateHeaderSize();

  // Escuchar cambios de tamaño de ventana usando MediaQueryList
  isMobileNavbar.addEventListener('change', updateVisibility);

  // También escuchar eventos de resize como fallback adicional con debounce
  let resizeTimeout;
  const handleResize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      updateVisibility();
    }, 150); // 150ms debounce to avoid too many updates
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', updateHeaderSize, { passive: true });
}
