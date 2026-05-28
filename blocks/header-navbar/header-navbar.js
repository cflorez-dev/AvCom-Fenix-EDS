import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import {
  extractHeaderNavbarData,
  validateHeaderNavbarData,
  convertToNavbarSections,
  parseMegamenuSection,
} from './header-navbar-helper.js';
import { Navbar } from '../../design-system/organisms/header/navbar/navbar.js';
import { readBlockConfig, loadBlock } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';

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
export default async function decorate(block) {
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

  // 1.1 Targeting check - hide if not matching current POS
  const config = readBlockConfig(block);

  // Leer targeting desde config (formato estándar: target-countries | co)
  let targetCountries = config['target-countries'] || '';
  let targetLanguages = config['target-languages'] || '';
  let accentColor = config['hover-accent-color'] || '';

  // Fallback: Si no hay config con nombre, leer de las primeras filas simples
  // AEM UE escribe los campos del modelo como filas de un solo valor (no key-value),
  // por lo que readBlockConfig no las lee correctamente.
  // SOLO si el contenido parece ser un código de país/idioma válido
  if (!targetCountries && !targetLanguages) {
    const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
    const validLanguages = ['es', 'en', 'pt', 'fr'];

    const rows = block.querySelectorAll(':scope > div');
    if (rows.length >= 2) {
      const firstRowValue = rows[0]?.children[0]?.textContent?.trim().toLowerCase();
      // Solo usar si es un código de país válido (2-3 letras) o lista separada por comas
      if (firstRowValue && (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())))) {
        targetCountries = firstRowValue;
      }

      const secondRowValue = rows[1]?.children[0]?.textContent?.trim().toLowerCase();
      // Solo usar si es un código de idioma válido o lista separada por comas
      if (secondRowValue && (validLanguages.includes(secondRowValue) || secondRowValue.split(',').every((l) => validLanguages.includes(l.trim())))) {
        targetLanguages = secondRowValue;
      }
    }
  }

  // Fallback: leer hover-accent-color de las primeras 3 filas cuando readBlockConfig no lo encontró
  // (el campo es single-column en AEM UE, no key-value)
  if (!accentColor) {
    const colorRows = Array.from(block.querySelectorAll(':scope > div')).slice(0, 3);
    const colorRow = colorRows.find((row) => {
      const val = row.children[0]?.textContent?.trim();
      return val && /^#[0-9a-fA-F]{3,8}$/.test(val);
    });
    if (colorRow) accentColor = colorRow.children[0].textContent.trim();
  }

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    block.style.display = 'none';
    return;
  }

  // 2. Extraer datos del bloque usando el helper
  const navbarData = extractHeaderNavbarData(block);

  // Filter individual menu items by their own targeting (per-item POS/language)
  navbarData.items = navbarData.items.filter(
    (item) => shouldShowByTargeting(item['target-countries'], item['target-languages']),
  );

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

  // For sections with a megamenu anchor: find the nav-page section, hide it,
  // and parse its header-megamenu-column blocks + CMS block into the section data.
  // IMPORTANT: The nav page is loaded as a detached fragment (<main>), so we
  // search within block.closest('main') — NOT document — to find the sections.
  const navRoot = block.closest('main') || document;
  await Promise.all(sections.map(async (section) => {
    if (!section.megamenu?.anchor) return;
    const anchorEl = navRoot.querySelector(`[data-megamenu-id="${section.megamenu.anchor}"]`);
    if (!anchorEl) return;
    const { columns, cmsBlock, formType, formLabel } = parseMegamenuSection(anchorEl);
    // Force decoration of the CMS block BEFORE hiding the section,
    // so it is fully rendered when the megamenu clones it.
    if (cmsBlock) await loadBlock(cmsBlock);
    // Hide the megamenu section from normal page flow (after decoration)
    anchorEl.style.display = 'none';
    // eslint-disable-next-line no-param-reassign
    section.megamenu = {
      anchor: section.megamenu.anchor, columns, cmsBlock, formType, formLabel,
    };
  }));

  // Variables para tracking de contenedores y listeners
  let mobileContainer = null;
  let desktopContainer = null;
  let resizeHandler = null;
  let headerResizeHandler = null;
  let isInitialRender = false;

  // 3. Función para renderizar ambos navbars en sus contenedores respectivos
  // La visibilidad será manejada por header.js
  // IMPORTANT: Skip if container already has content (first matching navbar wins)
  const renderNavbarInContainers = (mobile, desktop) => {
    if (!mobile && !desktop) return;

    // Check if containers already have content (another navbar block already rendered)
    const mobileHasContent = mobile && mobile.children.length > 0;
    const desktopHasContent = desktop && desktop.children.length > 0;

    if (mobileHasContent && desktopHasContent) {
      // Another navbar block already rendered - skip this one (first matching wins)
      block.style.display = 'none';
      return;
    }

    // Store container references
    mobileContainer = mobile;
    desktopContainer = desktop;

    // Renderizar navbar mobile en su contenedor (only if empty)
    if (mobileContainer && !mobileHasContent) {
      mobileContainer.innerHTML = '';
      render(
        html`<${Navbar} mode="mobile" sections=${sections} accentColor=${accentColor} />`,
        mobileContainer,
      );
    }

    // Renderizar navbar desktop en su contenedor (only if empty)
    if (desktopContainer && !desktopHasContent) {
      desktopContainer.innerHTML = '';
      render(
        html`<${Navbar} mode="desktop" sections=${sections} accentColor=${accentColor} />`,
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
          window.matchMedia('(min-width: 1024px)').removeEventListener('change', resizeHandler);
        }
        if (headerResizeHandler) {
          window.removeEventListener('header-resize', headerResizeHandler);
        }

        // Create new handlers for re-rendering
        const isDesktop = window.matchMedia('(min-width: 1024px)');
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
