import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractHeaderNavbarData, validateHeaderNavbarData, convertToNavbarSections } from './header-navbar-helper.js';
import { Navbar } from '../../design-system/organisms/header/navbar/navbar.js';

const html = htm.bind(h);

/**
 * Decorates the Header Navbar block.
 * Extracts menu items and sub-items from the block structure and transforms them.
 *
 * Expected HTML structure:
 * <div class="header-navbar block">
 *   <div>
 *     <div><p>Label</p></div>                    <!-- Col 0: Menu item label -->
 *     <div><a href="/url">/url</a></div>         <!-- Col 1: Menu item URL -->
 *     <div><p>icon-name</p></div>                <!-- Col 2: Menu item icon -->
 *     <div>                                       <!-- Col 3: Sub-items -->
 *       <ul>
 *         <li>sub-label | /sub-url | sub-icon</li>
 *       </ul>
 *     </div>
 *   </div>
 * </div>
 *
 * @param {Element} block The header-navbar block element
 */
export default function decorate(block) {
  // 1. Detectar Author Mode
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // Preservar contenido editable
    block.classList.add('header-navbar-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'header-navbar-author-indicator';
    authorIndicator.textContent = '🧭 Header Navbar (Author Mode - Add Menu Items below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);
    return;
  }

  // 2. Extraer datos del bloque usando el helper
  const navbarData = extractHeaderNavbarData(block);
  // Validar que se extrajeron los datos correctamente
  const validation = validateHeaderNavbarData(navbarData);
  if (!validation.isValid) {
    // eslint-disable-next-line no-console
    console.warn('[header-navbar] Validation errors:', validation.errors);
  }

  // Si no hay items, ocultar el bloque y no renderizar nada
  if (navbarData.items.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[header-navbar] No menu items found in block');
    block.style.display = 'none';
    return;
  }

  // Convertir datos al formato esperado por el componente Navbar
  const sections = convertToNavbarSections(navbarData);

  // Variables para tracking de contenedores y listeners
  let mobileContainer = null;
  let desktopContainer = null;
  let resizeHandler = null;
  let headerResizeHandler = null;
  let isInitialRender = false;

  // 3. Función para renderizar ambos navbars en sus contenedores respectivos
  // La visibilidad será manejada por header.js
  const renderNavbarInContainers = (mobile, desktop) => {
    if (!mobile && !desktop) return;

    // Store container references
    mobileContainer = mobile;
    desktopContainer = desktop;

    // Renderizar navbar mobile en su contenedor
    if (mobileContainer) {
      // Clear container before rendering
      mobileContainer.innerHTML = '';
      render(
        html`<${Navbar} mode="mobile" sections=${sections} />`,
        mobileContainer,
      );
    }

    // Renderizar navbar desktop en su contenedor
    if (desktopContainer) {
      // Clear container before rendering
      desktopContainer.innerHTML = '';
      render(
        html`<${Navbar} mode="desktop" sections=${sections} />`,
        desktopContainer,
      );
    }

    isInitialRender = true;
  };

  // 4. Buscar los contenedores .header-navbar-mobile y .header-navbar-desktop en el DOM
  const findAndRenderNavbar = (forceRerender = false) => {
    const mobile = document.querySelector('.header-navbar-mobile');
    const desktop = document.querySelector('.header-navbar-desktop');

    if (mobile || desktop) {
      // Si existen, renderizar directamente ahí
      renderNavbarInContainers(mobile, desktop, forceRerender);
      // Ocultar bloque original
      block.style.display = 'none';

      // Setup resize listeners only on first render
      if (!isInitialRender || forceRerender) {
        // Remove existing listeners if any
        if (resizeHandler) {
          window.matchMedia('(min-width: 900px)').removeEventListener('change', resizeHandler);
        }
        if (headerResizeHandler) {
          window.removeEventListener('header-resize', headerResizeHandler);
        }

        // Create new handlers for re-rendering
        const isDesktop = window.matchMedia('(min-width: 900px)');
        resizeHandler = () => {
          // Re-render when size changes
          renderNavbarInContainers(mobile, desktop, true);
        };
        headerResizeHandler = () => {
          // Re-render when header emits resize event
          renderNavbarInContainers(mobile, desktop, true);
        };

        // Listen for media query changes
        isDesktop.addEventListener('change', resizeHandler);
        // Listen for custom header-resize event
        window.addEventListener('header-resize', headerResizeHandler);
      }

      return true;
    }

    return false;
  };

  // Intentar encontrar los contenedores inmediatamente
  if (!findAndRenderNavbar()) {
    // Si no existen aún (problema de timing), usar requestAnimationFrame para esperar
    // Esto maneja el caso donde header se decora después de header-navbar
    let attempts = 0;
    const maxAttempts = 20; // Máximo 20 intentos (aproximadamente 1 segundo)

    const tryRender = () => {
      attempts += 1;

      if (findAndRenderNavbar()) {
        // Si encontramos y renderizamos, salir
        return;
      }

      if (attempts < maxAttempts) {
        // Si aún no encontramos, intentar de nuevo en el siguiente frame
        requestAnimationFrame(tryRender);
      } else {
        // Si después de varios intentos no encontramos los contenedores,
        // ocultar el bloque original como fallback
        // eslint-disable-next-line no-console
        console.warn('[header-navbar] Navbar containers not found after multiple attempts');
        block.style.display = 'none';
      }
    };

    // Empezar a intentar en el siguiente frame
    requestAnimationFrame(tryRender);
  }

  // Also listen for header-template-ready event to ensure we can render
  const handleHeaderReady = (event) => {
    if (isInitialRender) return;

    // Si el evento incluye los contenedores, usarlos directamente
    if (event && event.detail) {
      const { mobileContainer: eventMobile, desktopContainer: eventDesktop } = event.detail;
      if (eventMobile || eventDesktop) {
        renderNavbarInContainers(eventMobile, eventDesktop);
        block.style.display = 'none';
        return;
      }
    }

    // Si no, intentar encontrarlos en el DOM
    findAndRenderNavbar();
  };
  window.addEventListener('header-template-ready', handleHeaderReady);
}
