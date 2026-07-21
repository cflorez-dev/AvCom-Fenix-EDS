// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const gatePath = '../../../scripts/services/darksite/darksite-gate.js';

const STATE_ON = {
  enabled: true, level: 'max', affectedPos: ['ALL'], blockedPaths: ['/ofertas-destinos'], lastUpdated: null,
};

describe('darksite-gate decideAction', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    document.head.innerHTML = '';
  });

  it('estado apagado o null → none', async () => {
    const { decideAction } = await import(gatePath);
    expect(decideAction({
      state: null, pos: 'CO', pathname: '/es/', bypass: false,
    })).toBe('none');
    expect(decideAction({
      state: { ...STATE_ON, enabled: false }, pos: 'CO', pathname: '/es/', bypass: false,
    })).toBe('none');
  });

  it('activo sin bypass → overlay en home y en URL interna', async () => {
    const { decideAction } = await import(gatePath);
    expect(decideAction({
      state: STATE_ON, pos: 'CO', pathname: '/es/', bypass: false,
    })).toBe('overlay');
    expect(decideAction({
      state: STATE_ON, pos: 'CO', pathname: '/en/equipaje', bypass: false,
    })).toBe('overlay');
  });

  it('con bypass → none, salvo ruta bloqueada → redirect', async () => {
    const { decideAction } = await import(gatePath);
    expect(decideAction({
      state: STATE_ON, pos: 'CO', pathname: '/es/equipaje', bypass: true,
    })).toBe('none');
    expect(decideAction({
      state: STATE_ON, pos: 'CO', pathname: '/es/ofertas-destinos', bypass: true,
    })).toBe('redirect');
  });

  it('rutas /darksite exentas siempre', async () => {
    const { decideAction } = await import(gatePath);
    expect(decideAction({
      state: STATE_ON, pos: 'CO', pathname: '/darksite/es/', bypass: false,
    })).toBe('none');
    expect(decideAction({
      state: STATE_ON, pos: 'CO', pathname: '/darksite/es/faqs', bypass: true,
    })).toBe('none');
  });

  it('POS no afectado → none', async () => {
    const { decideAction } = await import(gatePath);
    const state = { ...STATE_ON, affectedPos: ['CO'] };
    expect(decideAction({
      state, pos: 'US', pathname: '/es/', bypass: false,
    })).toBe('none');
  });

  it('isAuthorEnvironment detecta window.hlx.aue y meta aue', async () => {
    const { isAuthorEnvironment } = await import(gatePath);
    expect(isAuthorEnvironment()).toBe(false);
    window.hlx = { aue: {} };
    expect(isAuthorEnvironment()).toBe(true);
    delete window.hlx;
    document.head.innerHTML = '<meta name="urn:auecon:aemconnection" content="x">';
    expect(isAuthorEnvironment()).toBe(true);
  });

  it('bypass helpers usan sessionStorage', async () => {
    const { hasBypass, setBypass } = await import(gatePath);
    expect(hasBypass()).toBe(false);
    setBypass();
    expect(hasBypass()).toBe(true);
    expect(sessionStorage.getItem('av-darksite-bypass')).toBe('1');
  });

  it('buildFragmentCandidates: pos → lang → es', async () => {
    const { buildFragmentCandidates } = await import(gatePath);
    expect(buildFragmentCandidates('en', 'CO')).toEqual([
      '/darksite/en/co/interstitial',
      '/darksite/en/interstitial',
      '/darksite/es/interstitial',
    ]);
    expect(buildFragmentCandidates('es', '')).toEqual([
      '/darksite/es/interstitial',
    ]);
  });

  // Task 11: applyContactPhase es pura/testeable (recibe overlay/state/now
  // explícitos) — no depende de mount/unmount del gate.
  describe('applyContactPhase', () => {
    function buildOverlay({ initial = true, updated = true } = {}) {
      const overlay = document.createElement('div');
      if (initial) {
        const div = document.createElement('div');
        div.className = 'darksite-contacts darksite-contacts-initial';
        overlay.append(div);
      }
      if (updated) {
        const div = document.createElement('div');
        div.className = 'darksite-contacts darksite-contacts-updated';
        overlay.append(div);
      }
      return overlay;
    }

    const BASE_STATE = { activatedAt: '2026-07-07T10:00:00Z', contactSwitchMinutes: 60 };

    it('antes del umbral: muestra initial, oculta updated, remainingMs correcto', async () => {
      const { applyContactPhase } = await import(gatePath);
      const overlay = buildOverlay();
      const now = Date.parse('2026-07-07T10:30:00Z'); // 30 min < 60
      const result = applyContactPhase(overlay, BASE_STATE, now);
      expect(result.phase).toBe('initial');
      expect(result.remainingMs).toBe(30 * 60000);
      expect(overlay.querySelector('.darksite-contacts-initial').style.display).toBe('');
      expect(overlay.querySelector('.darksite-contacts-updated').style.display).toBe('none');
    });

    it('después del umbral: muestra updated, oculta initial', async () => {
      const { applyContactPhase } = await import(gatePath);
      const overlay = buildOverlay();
      const now = Date.parse('2026-07-07T11:30:00Z'); // 90 min > 60
      const result = applyContactPhase(overlay, BASE_STATE, now);
      expect(result.phase).toBe('updated');
      expect(overlay.querySelector('.darksite-contacts-updated').style.display).toBe('');
      expect(overlay.querySelector('.darksite-contacts-initial').style.display).toBe('none');
    });

    it('activatedAt ausente/inválido ⇒ updated si existe (nunca rompe)', async () => {
      const { applyContactPhase } = await import(gatePath);
      const overlay1 = buildOverlay();
      expect(applyContactPhase(
        overlay1,
        { ...BASE_STATE, activatedAt: null },
        Date.now(),
      ).phase).toBe('updated');
      const overlay2 = buildOverlay();
      expect(applyContactPhase(
        overlay2,
        { ...BASE_STATE, activatedAt: 'no-es-fecha' },
        Date.now(),
      ).phase).toBe('updated');
      const overlay3 = buildOverlay();
      expect(applyContactPhase(overlay3, {}, Date.now()).phase).toBe('updated');
      const overlay4 = buildOverlay();
      expect(applyContactPhase(overlay4, null, Date.now()).phase).toBe('updated');
    });

    it('solo existe una sección ⇒ se muestra siempre, sin importar el tiempo', async () => {
      const { applyContactPhase } = await import(gatePath);
      const onlyInitial = buildOverlay({ updated: false });
      const past = Date.parse('2026-07-07T11:30:00Z'); // ya pasó el umbral
      const r1 = applyContactPhase(onlyInitial, BASE_STATE, past);
      expect(r1.phase).toBe('initial');
      expect(onlyInitial.querySelector('.darksite-contacts-initial').style.display).toBe('');

      const onlyUpdated = buildOverlay({ initial: false });
      const early = Date.parse('2026-07-07T10:00:01Z'); // antes del umbral
      const r2 = applyContactPhase(onlyUpdated, BASE_STATE, early);
      expect(r2.phase).toBe('updated');
      expect(onlyUpdated.querySelector('.darksite-contacts-updated').style.display).toBe('');
    });

    it('sin ninguna sección: no rompe, phase null', async () => {
      const { applyContactPhase } = await import(gatePath);
      const overlay = buildOverlay({ initial: false, updated: false });
      expect(() => applyContactPhase(overlay, BASE_STATE, Date.now())).not.toThrow();
      expect(applyContactPhase(overlay, BASE_STATE, Date.now()).phase).toBeNull();
    });
  });

  it('buildFragmentCandidates: parámetro name custom genera candidatos para ese fragment', async () => {
    const { buildFragmentCandidates } = await import(gatePath);
    expect(buildFragmentCandidates('en', 'CO', 'header-alert')).toEqual([
      '/darksite/en/co/header-alert',
      '/darksite/en/header-alert',
      '/darksite/es/header-alert',
    ]);
    expect(buildFragmentCandidates('en', 'CO', 'home-banner')).toEqual([
      '/darksite/en/co/home-banner',
      '/darksite/en/home-banner',
      '/darksite/es/home-banner',
    ]);
    // Regresión: sin tercer argumento sigue dando 'interstitial' (llamadas
    // existentes con 2 args no deben romperse).
    expect(buildFragmentCandidates('en', 'CO')).toEqual([
      '/darksite/en/co/interstitial',
      '/darksite/en/interstitial',
      '/darksite/es/interstitial',
    ]);
  });
});

describe('darksite-gate runDarksiteGate (DOM)', () => {
  const servicePath = '../../../scripts/services/darksite/darksite.service.js';
  const fragmentPath = '../../../blocks/fragment/fragment.js';
  const localePath = '../../../scripts/utils/locale.js';
  const langSelectorPath = '../../../scripts/services/header/language-country-selector.js';

  const STATE_ACTIVE = {
    enabled: true, level: 'max', affectedPos: ['ALL'], blockedPaths: [], lastUpdated: null,
  };

  // View-model del CF `getDarksiteInterstitial` — mismo shape que normaliza
  // `darksite.service.js` (titles, labels de CTA, contactos initial/updated).
  // Se inyecta vía `mockDeps` como retorno de `readCachedInterstitial`/
  // `fetchDarksiteInterstitial` para que los tests de mount no dependan del
  // env real ni del backend.
  const INTERSTITIAL_CONTENT_MOCK = {
    titleSingle: 'Vuelo {flightCode} afectado',
    titleMultiple: 'Información sobre vuelos afectados',
    operatorTemplate: 'Operado por {operator}',
    contactsLabel: 'Líneas de contacto:',
    primaryCtaLabel: 'Ver información del vuelo',
    primaryCtaAlt: 'Ver información del vuelo',
    secondaryCtaLabel: 'Continuar en avianca.com',
    secondaryCtaAlt: 'Continuar en avianca.com',
    detailCtaLabel: 'Ver detalle',
    // Separador origen→destino y chevron del CTA de detalle — espejo del CF
    // real publicado por el líder. `showFlightIcon=true` + chevron habilitado.
    flightIcon: 'action/plane2',
    showFlightIcon: true,
    flightSeparator: '',
    detailCtaChevron: true,
    contactsInitial: [
      { title: 'Contact center', subtitle: 'Test', phones: ['+57 000'] },
    ],
    contactsUpdated: [
      { title: 'Contact center updated', subtitle: 'Test', phones: ['+57 111'] },
    ],
  };

  // Vuelo por defecto del state para que `buildInterstitialViewModel` tenga
  // datos con qué interpolar `titleSingle`/`operatorTemplate` y para poblar
  // el molecule DarksiteFlightInfo. Los tests de mount que quieran variantes
  // (single vs multi) pueden pasar `flights` custom vía `state`.
  const DEFAULT_FLIGHT = {
    flightCode: 'AV062',
    origin: 'Bogotá',
    destination: 'Miami',
    operatorName: 'Avianca',
    detailUrl: '/darksite/es/flight-info?code=AV062',
    sortOrder: 0,
  };

  function mockDeps({
    state = STATE_ACTIVE, fragmentHtml = null, fragmentsByName = {},
    interstitial = INTERSTITIAL_CONTENT_MOCK, includeFlights = true,
    banner = null,
  } = {}) {
    const stateWithFlights = includeFlights && !state.flights
      ? { ...state, flights: [DEFAULT_FLIGHT] }
      : state;
    const loadFragmentSpy = vi.fn().mockImplementation(async (path) => {
      // Igual que hydrateFragment (blocks/fragment/fragment.js): la raíz
      // devuelta es un <main> cuyos hijos directos son secciones <div>.
      // Soporta distintos fragments (header-alert) según el nombre al final
      // del path de candidatos. Ni el interstitial ni el home-banner se
      // fetchean vía fragment ya — vienen de CFs (`interstitial`, `banner`).
      const nameKey = Object.keys(fragmentsByName).find((name) => path.endsWith(`/${name}`));
      const html = nameKey ? fragmentsByName[nameKey] : fragmentHtml;
      if (!html) return null;
      const el = document.createElement('main');
      el.innerHTML = html;
      return el;
    });
    const setStoredLanguageSpy = vi.fn();
    vi.doMock(servicePath, async (importOriginal) => {
      const original = await importOriginal();
      return {
        ...original,
        readCachedState: vi.fn().mockReturnValue(stateWithFlights),
        fetchDarksiteState: vi.fn().mockResolvedValue(stateWithFlights),
        // Nuevo CF del interstitial: el mock devuelve el mismo objeto
        // sincrónicamente (cache) y como resolved Promise (revalidación) para
        // que los mount-tests no gatillen network real ni dependan del env.
        readCachedInterstitial: vi.fn().mockReturnValue(interstitial),
        fetchDarksiteInterstitial: vi.fn().mockResolvedValue(interstitial),
        // CF del banner del home (Figma 9611:7981): mismo patrón SWR que
        // el interstitial. Por defecto `banner=null` (fail-closed: sin
        // data el swap oculta la sección y NO inserta card). Los tests que
        // esperan el banner inyectan `banner: BANNER_MOCK`.
        readCachedBanner: vi.fn().mockReturnValue(banner),
        fetchDarksiteBanner: vi.fn().mockResolvedValue(banner),
      };
    });
    vi.doMock(fragmentPath, () => ({ loadFragment: loadFragmentSpy }));
    vi.doMock(langSelectorPath, () => ({ setStoredLanguage: setStoredLanguageSpy }));
    vi.doMock(localePath, () => ({
      resolveLocale: vi.fn().mockResolvedValue({ country: 'co', language: 'es', prefix: '/es' }),
    }));
    vi.doMock('../../../scripts/aem.js', async (importOriginal) => {
      const original = await importOriginal();
      return { ...original, loadCSS: vi.fn() };
    });
    return { loadFragmentSpy, setStoredLanguageSpy };
  }

  // Estructura como la que produce decorateSections (scripts/aem.js) con
  // contenido real: h1 + ruta + CTAs comparten UN default-content-wrapper.
  // El h1 en el mismo wrapper que los CTAs es deliberado: documenta la
  // regresión del fix 1 (un flex row/column-reverse sobre el grupo movía el
  // título a la fila de botones o al fondo).
  const FRAGMENT = `
    <div>
      <h1>Vuelo AV062 afectado</h1>
      <p><a href="/darksite/es/">Ver información del evento</a></p>
      <p><a href="/es/#darksite-continue">Seguir en avianca.com</a></p>
    </div>`;

  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
    document.body.className = '';
    window.history.replaceState({}, '', '/es/');
  });

  it('monta el overlay con role=dialog y bloquea el scroll del body', async () => {
    mockDeps({ fragmentHtml: FRAGMENT });
    const { runDarksiteGate } = await import(gatePath);
    await runDarksiteGate(document);
    const overlay = document.querySelector('.darksite-interstitial');
    expect(overlay).not.toBeNull();
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    // Se insertan los hijos del <main> del fragment, no el wrapper: las
    // secciones <div> quedan como hijos directos entre el chrome header/footer
    // (el CSS `.darksite-interstitial > div` depende de esto).
    expect(overlay.querySelector(':scope > main')).toBeNull();
    expect(overlay.firstElementChild.tagName).toBe('HEADER');
    expect(overlay.lastElementChild.tagName).toBe('FOOTER');
    expect(overlay.querySelector(':scope > div')).not.toBeNull();
    expect(document.body.classList.contains('darksite-open')).toBe(true);
  });

  it('click en link #darksite-continue setea bypass y desmonta', async () => {
    mockDeps({ fragmentHtml: FRAGMENT });
    const { runDarksiteGate } = await import(gatePath);
    await runDarksiteGate(document);
    const cta = document.querySelector('a[href$="#darksite-continue"]');
    cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(sessionStorage.getItem('av-darksite-bypass')).toBe('1');
    expect(document.querySelector('.darksite-interstitial')).toBeNull();
    expect(document.body.classList.contains('darksite-open')).toBe(false);
  });

  // Fix F1 (revisión final): el bypass NO libera rutas bloqueadas. Si el CTA
  // continuar se clickea estando en una ruta bloqueada, debe comportarse
  // igual que la rama 'redirect' de decideAction/runDarksiteGate (mismo
  // destino: el hub), en vez de montar el chrome inline (headerAlert + swap).
  it('F1: click en continuar con pathname bloqueado ⇒ setBypass + redirect al hub, sin alerta inline', async () => {
    window.history.replaceState({}, '', '/es/ofertas-destinos');
    const stateBlocked = { ...STATE_ACTIVE, blockedPaths: ['/ofertas-destinos'] };
    mockDeps({ state: stateBlocked, fragmentHtml: FRAGMENT });
    const { runDarksiteGate } = await import(gatePath);
    await runDarksiteGate(document);

    const replaceSpy = vi.spyOn(window.location, 'replace').mockImplementation(() => {});
    const cta = document.querySelector('a[href$="#darksite-continue"]');
    cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(sessionStorage.getItem('av-darksite-bypass')).toBe('1');
    expect(document.querySelector('.darksite-interstitial')).toBeNull();
    expect(replaceSpy).toHaveBeenCalledWith('/darksite/es/');
    // Nunca debe llegar a montar el chrome inline (headerAlert/swap): se fue
    // por la rama de redirect, no por la de bypass in-place.
    await new Promise((resolve) => { setTimeout(resolve, 20); });
    expect(document.querySelector('.darksite-header-alert')).toBeNull();

    replaceSpy.mockRestore();
  });

  // Fix F9: el foco inicial debe ir al primer focusable DEL CONTENIDO del
  // fragment (el CTA/link autorado), no al trigger de idioma del header, que
  // por ser el primer nodo del overlay "ganaba" el querySelector genérico.
  it('F9: el foco inicial va al primer focusable del contenido, no al trigger de idioma', async () => {
    mockDeps({ fragmentHtml: FRAGMENT });
    const { runDarksiteGate } = await import(gatePath);
    await runDarksiteGate(document);
    const trigger = document.querySelector('.darksite-lang-trigger');
    expect(document.activeElement).not.toBe(trigger);
    expect(document.activeElement.textContent).toBe('Ver información del evento');
  });

  it('fail-open: sin fragment publicado no monta overlay', async () => {
    mockDeps({ fragmentHtml: null });
    const { runDarksiteGate } = await import(gatePath);
    await runDarksiteGate(document);
    expect(document.querySelector('.darksite-interstitial')).toBeNull();
    expect(document.body.classList.contains('darksite-open')).toBe(false);
  });

  it('en author env no hace nada', async () => {
    mockDeps({ fragmentHtml: FRAGMENT });
    window.hlx = { aue: {} };
    const { runDarksiteGate } = await import(gatePath);
    await runDarksiteGate(document);
    expect(document.querySelector('.darksite-interstitial')).toBeNull();
    delete window.hlx;
  });

  describe('chrome del overlay: header y footer', () => {
    it('monta header.darksite-header con logo y trigger de idioma accesible', async () => {
      mockDeps({ fragmentHtml: FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const header = document.querySelector('.darksite-interstitial > header.darksite-header');
      expect(header).not.toBeNull();
      const logo = header.querySelector('.darksite-logo img');
      expect(logo).not.toBeNull();
      expect(logo.getAttribute('alt')).toBe('Avianca');
      const trigger = header.querySelector('button.darksite-lang-trigger');
      expect(trigger).not.toBeNull();
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.textContent).toContain('Español');
    });

    it('monta footer.darksite-footer con copyright default y año actual', async () => {
      mockDeps({ fragmentHtml: FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const footer = document.querySelector('.darksite-interstitial > footer.darksite-footer');
      expect(footer).not.toBeNull();
      expect(footer.textContent).toContain(`Copyright © Avianca ${new Date().getFullYear()}`);
    });

    it('marca el padre del CTA continuar con darksite-cta-group (layout responsive sin :has)', async () => {
      mockDeps({ fragmentHtml: FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const cta = document.querySelector('a[href$="#darksite-continue"]');
      const group = cta.closest('p').parentElement;
      expect(group.classList.contains('darksite-cta-group')).toBe(true);
      // El grupo es el wrapper COMPARTIDO con el h1 (decorateSections agrupa
      // título + ruta + CTAs): el CSS del grupo no debe reordenar siblings
      // que no sean .button-container (solo order en los containers).
      expect(group.querySelector('h1')).not.toBeNull();
    });

    it('usa la sección darksite-footer del fragment como copyright si existe', async () => {
      const withFooter = `${FRAGMENT}
        <div class="darksite-footer"><p>Copyright © Avianca S.A. 2027</p></div>`;
      mockDeps({ fragmentHtml: withFooter });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const overlay = document.querySelector('.darksite-interstitial');
      const footer = overlay.querySelector(':scope > footer.darksite-footer');
      expect(footer.textContent).toContain('Copyright © Avianca S.A. 2027');
      expect(footer.textContent).not.toContain(`Avianca ${new Date().getFullYear()}`);
      // La sección original se movió al footer: no queda duplicada como <div>.
      expect(overlay.querySelector(':scope > div.darksite-footer')).toBeNull();
    });

    // Fix F4: los aria-label del overlay/alerta/dismiss estaban fijos en
    // español; ahora salen de un mapa por idioma (es/en/pt/fr).
    it('F4: overlay montado con lang "en" tiene aria-label localizado en inglés', async () => {
      mockDeps({ fragmentHtml: FRAGMENT });
      vi.doMock(localePath, () => ({
        resolveLocale: vi.fn().mockResolvedValue({ country: 'us', language: 'en', prefix: '/en' }),
      }));
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const overlay = document.querySelector('.darksite-interstitial');
      expect(overlay.getAttribute('aria-label')).toBe('Important information');
    });

    // Minor #10 del ledger: el trigger del dropdown debe referenciar el panel
    // vía aria-controls, y el panel debe tener el id correspondiente.
    it('dropdown de idioma: el trigger tiene aria-controls apuntando al id del panel', async () => {
      mockDeps({ fragmentHtml: FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const trigger = document.querySelector('.darksite-lang-trigger');
      const panel = document.querySelector('.darksite-lang-panel');
      expect(panel.id).toBeTruthy();
      expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    });
  });

  describe('language dropdown', () => {
    const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

    async function mountWithDropdown(opts = {}) {
      const spies = mockDeps({ fragmentHtml: FRAGMENT, ...opts });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      return {
        ...spies,
        get trigger() { return document.querySelector('.darksite-lang-trigger'); },
        get panel() { return document.querySelector('.darksite-lang-panel'); },
      };
    }

    it('abre y cierra con click en el trigger, con roles y aria correctos', async () => {
      const ui = await mountWithDropdown();
      expect(ui.panel.hidden).toBe(true);
      click(ui.trigger);
      expect(ui.trigger.getAttribute('aria-expanded')).toBe('true');
      expect(ui.panel.hidden).toBe(false);
      expect(ui.panel.getAttribute('role')).toBe('listbox');
      const options = [...ui.panel.querySelectorAll('[role="option"]')];
      expect(options).toHaveLength(4);
      expect(options.map((o) => o.dataset.lang)).toEqual(['es', 'en', 'pt', 'fr']);
      const selected = ui.panel.querySelector('[role="option"][aria-selected="true"]');
      expect(selected.dataset.lang).toBe('es');
      // Checkmark solo en la opción seleccionada.
      expect(selected.querySelector('.darksite-lang-check')).not.toBeNull();
      expect(ui.panel.querySelectorAll('.darksite-lang-check')).toHaveLength(1);
      click(ui.trigger);
      expect(ui.trigger.getAttribute('aria-expanded')).toBe('false');
      expect(ui.panel.hidden).toBe(true);
    });

    it('click fuera del dropdown cierra el panel sin desmontar el overlay', async () => {
      const ui = await mountWithDropdown();
      click(ui.trigger);
      expect(ui.panel.hidden).toBe(false);
      click(document.querySelector('.darksite-interstitial > div'));
      expect(ui.panel.hidden).toBe(true);
      expect(document.querySelector('.darksite-interstitial')).not.toBeNull();
    });

    it('teclado: flechas mueven el foco, Esc cierra SOLO el panel y devuelve el foco', async () => {
      const ui = await mountWithDropdown();
      key(ui.trigger, 'ArrowDown');
      expect(ui.panel.hidden).toBe(false);
      // Foco inicial en la opción seleccionada (es); ArrowDown → siguiente (en).
      expect(document.activeElement.dataset.lang).toBe('es');
      key(document.activeElement, 'ArrowDown');
      expect(document.activeElement.dataset.lang).toBe('en');
      key(document.activeElement, 'ArrowUp');
      expect(document.activeElement.dataset.lang).toBe('es');
      key(document.activeElement, 'Escape');
      expect(ui.panel.hidden).toBe(true);
      expect(document.activeElement).toBe(ui.trigger);
      // Esc NO cierra el overlay.
      expect(document.querySelector('.darksite-interstitial')).not.toBeNull();
    });

    it('Enter selecciona idioma: setea cookie via helper y re-monta el fragment del nuevo lang', async () => {
      const ui = await mountWithDropdown();
      const initialCalls = ui.loadFragmentSpy.mock.calls.length;
      click(ui.trigger);
      const optionEn = ui.panel.querySelector('[role="option"][data-lang="en"]');
      optionEn.focus();
      key(optionEn, 'Enter');
      await vi.waitFor(() => {
        expect(ui.setStoredLanguageSpy).toHaveBeenCalledWith('en');
      });
      await vi.waitFor(() => {
        const paths = ui.loadFragmentSpy.mock.calls.slice(initialCalls).map(([p]) => p);
        expect(paths[0]).toBe('/darksite/en/co/interstitial');
      });
      // Re-mount sin recargar página: overlay sigue montado, con el nuevo idioma.
      await vi.waitFor(() => {
        const trigger = document.querySelector('.darksite-lang-trigger');
        expect(trigger.textContent).toContain('Inglés');
      });
      expect(document.querySelectorAll('.darksite-interstitial')).toHaveLength(1);
      expect(document.body.classList.contains('darksite-open')).toBe(true);
      const selected = document.querySelector('.darksite-lang-panel [aria-selected="true"]');
      expect(selected.dataset.lang).toBe('en');
    });

    it('seleccionar el idioma actual solo cierra el panel, sin cookie ni re-mount', async () => {
      const ui = await mountWithDropdown();
      const initialCalls = ui.loadFragmentSpy.mock.calls.length;
      click(ui.trigger);
      const optionEs = ui.panel.querySelector('[role="option"][data-lang="es"]');
      click(optionEs);
      expect(ui.panel.hidden).toBe(true);
      expect(ui.setStoredLanguageSpy).not.toHaveBeenCalled();
      expect(ui.loadFragmentSpy.mock.calls.length).toBe(initialCalls);
    });
  });

  // Task 10: modo bypass (overlay ya no tapa la página) — headerAlert sticky
  // + reemplazo del banner del home. Spec: figma darksite-figma-spec.md §1.1.
  describe('modo bypass: headerAlert + swap del home banner', () => {
    const ALERT_FRAGMENT = `
      <div>
        <p>Infórmate sobre la afectación del <a href="/darksite/es/">vuelo AV366</a>. <a href="/darksite/es/">Más detalles</a>.</p>
      </div>`;
    // View-model del CF `getDarksiteBanner` — mismo shape que normaliza
    // `darksite.service.js#normalizeBanner`. Se inyecta vía `mockDeps` como
    // retorno de `readCachedBanner`/`fetchDarksiteBanner` para desacoplar
    // los tests del env y del backend.
    const BANNER_MOCK = {
      title: 'Ruta Bogotá-Miami',
      description: 'AV120 operado por avianca',
      ctaLabel: 'Información del vuelo',
      ctaUrl: '/darksite/es/detalle',
      ctaAlt: 'Ver información del vuelo AV120',
    };

    function setBypassOn() {
      sessionStorage.setItem('av-darksite-bypass', '1');
    }

    beforeEach(() => {
      document.body.innerHTML = '<main><div class="section"><div>contenido normal</div></div></main>';
    });

    it('CTA continuar: tras el click monta headerAlert y procesa el swap INLINE, sin navegación (fix post-review Task 12)', async () => {
      // SIN bypass previo: el overlay se monta primero; el click del CTA
      // continuar debe dejar visible de inmediato el chrome del modo bypass.
      document.body.innerHTML = `
        <main>
          <div class="section darksite-swap"><div>promo original</div></div>
        </main>`;
      mockDeps({
        fragmentHtml: FRAGMENT,
        fragmentsByName: { 'header-alert': ALERT_FRAGMENT },
        banner: BANNER_MOCK,
      });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      expect(document.querySelector('.darksite-interstitial')).not.toBeNull();

      const cta = document.querySelector('a[href$="#darksite-continue"]');
      cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      // Overlay desmontado y bypass persistido (comportamiento previo intacto).
      expect(document.querySelector('.darksite-interstitial')).toBeNull();
      expect(sessionStorage.getItem('av-darksite-bypass')).toBe('1');

      // Y ADEMÁS, sin ninguna navegación: alerta montada…
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-header-alert')).not.toBeNull();
      });
      expect(document.body.firstElementChild).toBe(document.querySelector('.darksite-header-alert'));
      // …y sección darksite-swap procesada (oculta + banner insertado después).
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-informative-banner')).not.toBeNull();
      });
      const section = document.querySelector('main .section.darksite-swap');
      expect(section.classList.contains('darksite-swapped')).toBe(true);
      expect(section.nextElementSibling).toBe(document.querySelector('.darksite-informative-banner'));
    });

    it('CTA continuar: si el flag de dismiss ya estaba en la sesión, NO monta la alerta inline (pero sí procesa el swap)', async () => {
      document.body.innerHTML = `
        <main>
          <div class="section darksite-swap"><div>promo original</div></div>
        </main>`;
      sessionStorage.setItem('av-darksite-alert-dismissed', '1');
      mockDeps({
        fragmentHtml: FRAGMENT,
        fragmentsByName: { 'header-alert': ALERT_FRAGMENT },
        banner: BANNER_MOCK,
      });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const cta = document.querySelector('a[href$="#darksite-continue"]');
      cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-informative-banner')).not.toBeNull();
      });
      expect(document.querySelector('.darksite-header-alert')).toBeNull();
    });

    it('bypass + darksite activo: monta la marquesina headerAlert al inicio del body', async () => {
      setBypassOn();
      mockDeps({ fragmentsByName: { 'header-alert': ALERT_FRAGMENT } });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);

      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-header-alert')).not.toBeNull();
      });
      const alert = document.querySelector('.darksite-header-alert');
      expect(alert.getAttribute('role')).toBe('region');
      expect(alert.getAttribute('aria-label')).toBeTruthy();
      // Prepend a body: es el primer hijo.
      expect(document.body.firstElementChild).toBe(alert);
      expect(alert.textContent).toContain('Más detalles');
      // No se abre el overlay: el bypass ya se hizo.
      expect(document.querySelector('.darksite-interstitial')).toBeNull();
      const dismissButton = alert.querySelector('button');
      expect(dismissButton.getAttribute('aria-label')).toBe('Cerrar alerta');
    });

    it('dismiss: setea el flag de sesión, remueve la alerta y no vuelve a montarla en el mismo ciclo', async () => {
      setBypassOn();
      mockDeps({ fragmentsByName: { 'header-alert': ALERT_FRAGMENT } });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-header-alert')).not.toBeNull();
      });

      const dismissButton = document.querySelector('.darksite-header-alert button');
      dismissButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(document.querySelector('.darksite-header-alert')).toBeNull();
      expect(sessionStorage.getItem('av-darksite-alert-dismissed')).toBe('1');

      // Segundo ciclo de mount (misma sesión): no debe re-aparecer.
      await runDarksiteGate(document);
      await new Promise((resolve) => { setTimeout(resolve, 20); });
      expect(document.querySelector('.darksite-header-alert')).toBeNull();
    });

    // La alerta darksite REEMPLAZA la marquesina promocional (regla de negocio
    // "sin promociones en darksite", mismo criterio que swapHomeBanner). El
    // gate agrega `body.darksite-active`, oculta cualquier
    // `.marquesina-global-container` preexistente y `--marquee-height` refleja
    // SOLO la altura de la alerta darksite (no la suma con la marquesina).
    it('reemplazo de marquesina: oculta el contenedor previo, --marquee-height = altura darksite, dismiss lo reduce a 0px sin restaurar la marquesina', async () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
      // happy-dom no calcula layout real: se fuerza una altura medida
      // determinística (64px) para poder verificar el valor exacto.
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 64 });
      // Simular marquesina promocional ya montada por blocks/marquesina.
      const marquesinaContainer = document.createElement('div');
      marquesinaContainer.className = 'marquesina-global-container';
      document.body.appendChild(marquesinaContainer);
      document.documentElement.style.setProperty('--marquee-height', '40px');

      setBypassOn();
      mockDeps({ fragmentsByName: { 'header-alert': ALERT_FRAGMENT } });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-header-alert')).not.toBeNull();
      });
      // Body marcado como darksite-active (habilita la regla CSS que oculta la marquesina).
      expect(document.body.classList.contains('darksite-active')).toBe(true);
      // Defensa en profundidad: el gate aplica display:none inline sobre la marquesina.
      expect(marquesinaContainer.style.display).toBe('none');
      // --marquee-height = SOLO altura darksite (64px), sin sumar los 40px previos.
      expect(document.documentElement.style.getPropertyValue('--marquee-height').trim()).toBe('64px');

      const dismissButton = document.querySelector('.darksite-header-alert button');
      dismissButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      // Dismiss: --marquee-height=0 (nuestra alerta ya no ocupa reserva) y la
      // marquesina promocional NO reaparece (darksite sigue activo por sesión).
      expect(document.documentElement.style.getPropertyValue('--marquee-height').trim()).toBe('0px');
      expect(document.body.classList.contains('darksite-active')).toBe(true);
      expect(marquesinaContainer.style.display).toBe('none');

      if (originalDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalDescriptor);
      } else {
        delete HTMLElement.prototype.offsetHeight;
      }
      document.documentElement.style.removeProperty('--marquee-height');
      document.body.classList.remove('darksite-active');
      marquesinaContainer.remove();
    });

    it('sin bypass: NO monta la headerAlert (el overlay tapa la página)', async () => {
      // bypass NO seteado: hasBypass() → false, decideAction → 'overlay'.
      mockDeps({ fragmentsByName: { 'header-alert': ALERT_FRAGMENT }, fragmentHtml: FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-interstitial')).not.toBeNull();
      });
      expect(document.querySelector('.darksite-header-alert')).toBeNull();
    });

    it('flag de dismiss preexistente: no monta la headerAlert', async () => {
      setBypassOn();
      sessionStorage.setItem('av-darksite-alert-dismissed', '1');
      mockDeps({ fragmentsByName: { 'header-alert': ALERT_FRAGMENT } });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      // Da tiempo al fire-and-forget por si acaso montara indebidamente.
      await new Promise((resolve) => { setTimeout(resolve, 20); });
      expect(document.querySelector('.darksite-header-alert')).toBeNull();
    });

    it('swap: con sección .darksite-swap presente, la oculta e inserta el home-banner', async () => {
      document.body.innerHTML = `
        <main>
          <div class="section darksite-swap"><div>promo original</div></div>
        </main>`;
      setBypassOn();
      mockDeps({ banner: BANNER_MOCK });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);

      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-informative-banner')).not.toBeNull();
      });
      const section = document.querySelector('main .section.darksite-swap');
      expect(section.classList.contains('darksite-swapped')).toBe(true);
      const banner = document.querySelector('.darksite-informative-banner');
      // El molecule `DarksiteInformativeBanner` renderiza el título del CF dentro
      // de un <p> hijo con `data-name="darksiteInformativeBanner"` en la raíz.
      expect(banner.querySelector('[data-name="darksiteInformativeBanner"]')).not.toBeNull();
      expect(banner.textContent).toContain('Ruta Bogotá-Miami');
      expect(banner.textContent).toContain('AV120 operado por avianca');
      // CTA con label y href del CF.
      const ctaLink = banner.querySelector('a[href="/darksite/es/detalle"]');
      expect(ctaLink).not.toBeNull();
      expect(ctaLink.textContent.trim()).toBe('Información del vuelo');
      // El banner queda inmediatamente después de la sección oculta.
      expect(section.nextElementSibling).toBe(banner);
    });

    it('swap: la búsqueda de la sección se difiere hasta después de decorateMain (no corre en el mismo tick síncrono que runDarksiteGate)', async () => {
      // Regresión: runDarksiteGate() corre en loadEager ANTES de
      // decorateMain(main) (scripts.js), que es quien recién aplica
      // decorateSections() y por lo tanto la clase `darksite-swap` de
      // section-metadata. Si swapHomeBanner leyera la sección de forma
      // síncrona (sin diferir a un macrotask), este test fallaría: la clase
      // se agrega DESPUÉS de invocar runDarksiteGate, simulando que
      // decorateMain corre luego, en el mismo flujo de loadEager.
      document.body.innerHTML = `
        <main>
          <div class="section"><div>promo original</div></div>
        </main>`;
      setBypassOn();
      mockDeps({ banner: BANNER_MOCK });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);

      // Simula decorateMain aplicando la clase de section-metadata DESPUÉS
      // de que runDarksiteGate ya devolvió su promesa (igual que en
      // scripts.js: decorateMain se llama tras el await de runDarksiteGate).
      document.querySelector('main .section').classList.add('darksite-swap');

      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-informative-banner')).not.toBeNull();
      });
      const section = document.querySelector('main .section.darksite-swap');
      expect(section.classList.contains('darksite-swapped')).toBe(true);
    });

    it('swap: sin sección .darksite-swap NI booking-box, no-op y console.warn', async () => {
      // beforeEach ya deja un <main> sin sección darksite-swap ni booking-box.
      setBypassOn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockDeps({ banner: BANNER_MOCK });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await new Promise((resolve) => { setTimeout(resolve, 20); });
      expect(document.querySelector('.darksite-informative-banner')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('swap: sin .darksite-swap pero CON booking-box → inserta el banner inmediatamente después del booking-box (sin ocultar nada)', async () => {
      // Fallback: home sin authoring prep (`darksite-swap`) pero con el
      // booking-box (presente en todo home). El banner debe visualizarse
      // igual, ancla­do justo después del booking-box.
      document.body.innerHTML = `
        <main>
          <div class="section hero-container"><div>hero</div></div>
          <div class="section booking-box-container"><div class="booking-box block">buscador</div></div>
          <div class="section promo"><div>promo autorada</div></div>
        </main>`;
      setBypassOn();
      mockDeps({ banner: BANNER_MOCK });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-informative-banner')).not.toBeNull();
      });
      const bookingSection = document.querySelector('main .section.booking-box-container');
      const banner = document.querySelector('.darksite-informative-banner');
      // Banner queda como hermano inmediato posterior al booking-box.
      expect(bookingSection.nextElementSibling).toBe(banner);
      // La promo autorada NO se toca (fallback nunca oculta anchor).
      expect(document.querySelector('main .section.promo').classList.contains('darksite-swapped')).toBe(false);
      // Contenido correcto del CF renderizado.
      expect(banner.querySelector('[data-name="darksiteInformativeBanner"]')).not.toBeNull();
      expect(banner.textContent).toContain('Ruta Bogotá-Miami');
    });

    it('swap: si existen AMBOS (.darksite-swap y booking-box), prioriza .darksite-swap (oculta la promo autorada)', async () => {
      // Prioridad: cuando el home tiene el authoring prep, el banner
      // reemplaza la promo autorada, no se ancla al booking-box.
      document.body.innerHTML = `
        <main>
          <div class="section booking-box-container"><div class="booking-box block">buscador</div></div>
          <div class="section darksite-swap"><div>promo original</div></div>
        </main>`;
      setBypassOn();
      mockDeps({ banner: BANNER_MOCK });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-informative-banner')).not.toBeNull();
      });
      const swapSection = document.querySelector('main .section.darksite-swap');
      const bookingSection = document.querySelector('main .section.booking-box-container');
      const banner = document.querySelector('.darksite-informative-banner');
      expect(swapSection.classList.contains('darksite-swapped')).toBe(true);
      // El banner queda después de .darksite-swap, NO del booking-box.
      expect(swapSection.nextElementSibling).toBe(banner);
      expect(bookingSection.nextElementSibling).not.toBe(banner);
    });

    it('swap: sección presente pero CF getDarksiteBanner sin data → queda oculta igual (fail-closed)', async () => {
      document.body.innerHTML = `
        <main>
          <div class="section darksite-swap"><div>promo original</div></div>
        </main>`;
      setBypassOn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockDeps({ banner: null }); // CF sin data
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      await new Promise((resolve) => { setTimeout(resolve, 20); });
      const section = document.querySelector('main .section.darksite-swap');
      expect(section.classList.contains('darksite-swapped')).toBe(true);
      expect(document.querySelector('.darksite-informative-banner')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // Task 11: contactos temporizados, integración vía runDarksiteGate.
  describe('contactos temporizados (activatedAt/contactSwitchMinutes) en el overlay', () => {
    const CONTACTS_FRAGMENT = `${FRAGMENT}
      <div class="darksite-contacts darksite-contacts-initial"><p>Contacto inicial</p></div>
      <div class="darksite-contacts darksite-contacts-updated"><p>Contacto actualizado</p></div>`;

    function stateWithContacts(overrides = {}) {
      return {
        ...STATE_ACTIVE,
        activatedAt: '2026-07-07T10:00:00Z',
        contactSwitchMinutes: 1, // umbral corto (60000ms) para el test
        ...overrides,
      };
    }

    // Para los tests con timers REALES (sin vi.useFakeTimers) necesitamos que
    // la fase calculada sea 'initial' respecto al reloj real de la máquina
    // (no un timestamp fijo de 2026-07-07, que puede quedar en el pasado
    // respecto al reloj real del entorno) para que se agende un timer y así
    // poder verificar su cancelación.
    function stateWithContactsRealClock(overrides = {}) {
      return {
        ...STATE_ACTIVE,
        activatedAt: new Date(Date.now() - 1000).toISOString(), // "activado" hace 1s
        contactSwitchMinutes: 60, // default: 1h de margen, no llega a disparar
        ...overrides,
      };
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    it('monta en fase initial y cambia en caliente a updated al cruzar el umbral', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-07T10:00:00Z'));
      mockDeps({ state: stateWithContacts(), fragmentHtml: CONTACTS_FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);

      const initial = document.querySelector('.darksite-contacts-initial');
      const updated = document.querySelector('.darksite-contacts-updated');
      expect(initial.style.display).toBe('');
      expect(updated.style.display).toBe('none');

      await vi.advanceTimersByTimeAsync(61_000);

      expect(initial.style.display).toBe('none');
      expect(updated.style.display).toBe('');
    });

    it('activatedAt inválido: monta directo en fase updated sin agendar timer', async () => {
      vi.useFakeTimers();
      mockDeps({
        state: stateWithContacts({ activatedAt: 'no-es-fecha' }),
        fragmentHtml: CONTACTS_FRAGMENT,
      });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      expect(document.querySelector('.darksite-contacts-updated').style.display).toBe('');
      expect(document.querySelector('.darksite-contacts-initial').style.display).toBe('none');
      expect(vi.getTimerCount()).toBe(0);
    });

    it('cancela el timer del cambio en caliente al hacer clic en continuar (unmount)', async () => {
      mockDeps({ state: stateWithContactsRealClock(), fragmentHtml: CONTACTS_FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      const clearSpy = vi.spyOn(global, 'clearTimeout');
      const cta = document.querySelector('a[href$="#darksite-continue"]');
      cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('cancela el timer del cambio en caliente al re-montar por cambio de idioma', async () => {
      const ui = mockDeps({ state: stateWithContactsRealClock(), fragmentHtml: CONTACTS_FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);

      const clearSpy = vi.spyOn(global, 'clearTimeout');
      const trigger = document.querySelector('.darksite-lang-trigger');
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const optionEn = document.querySelector('[role="option"][data-lang="en"]');
      optionEn.focus();
      optionEn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        expect(ui.setStoredLanguageSpy).toHaveBeenCalledWith('en');
      });
      await vi.waitFor(() => {
        expect(document.querySelector('.darksite-lang-trigger').textContent).toContain('Inglés');
      });
      expect(clearSpy).toHaveBeenCalled();
      // El overlay re-montado sigue teniendo las secciones de contactos.
      expect(document.querySelector('.darksite-contacts-initial')).not.toBeNull();
      clearSpy.mockRestore();
    });

    it('sin activatedAt (state normalizado sin campo): no rompe, cae a updated si existe', async () => {
      const { activatedAt, ...rest } = stateWithContacts();
      mockDeps({ state: rest, fragmentHtml: CONTACTS_FRAGMENT });
      const { runDarksiteGate } = await import(gatePath);
      await runDarksiteGate(document);
      expect(document.querySelector('.darksite-contacts-updated').style.display).toBe('');
      expect(document.querySelector('.darksite-contacts-initial').style.display).toBe('none');
    });
  });

  // Fix F5: guard anti doble-montaje. La carrera real es cached-mount vs.
  // fresh-mount (revalidation.then) o dos re-mounts rápidos por cambio de
  // idioma: el resultado visible SIEMPRE debe corresponder al mount más
  // reciente, sin importar en qué orden resuelven sus fetches de fragment.
  describe('guard anti doble-montaje con generación (F5)', () => {
    it('dos mounts concurrentes: el más reciente gana aunque el más viejo resuelva después', async () => {
      document.body.innerHTML = '';
      document.body.className = '';
      window.history.replaceState({}, '', '/es/');
      sessionStorage.clear();
      localStorage.clear();

      let resolveEn;
      let resolvePt;
      const enGate = new Promise((resolve) => { resolveEn = resolve; });
      const ptGate = new Promise((resolve) => { resolvePt = resolve; });
      const loadFragmentSpy = vi.fn().mockImplementation(async (path) => {
        const el = document.createElement('main');
        if (path.includes('/en/')) {
          await enGate;
          el.innerHTML = '<div><h1>EN</h1><p><a href="/en/#darksite-continue">c</a></p></div>';
          return el;
        }
        if (path.includes('/pt/')) {
          await ptGate;
          el.innerHTML = '<div><h1>PT</h1><p><a href="/pt/#darksite-continue">c</a></p></div>';
          return el;
        }
        return null;
      });

      vi.doMock(servicePath, async (importOriginal) => {
        const original = await importOriginal();
        return {
          ...original,
          readCachedState: vi.fn().mockReturnValue(STATE_ACTIVE),
          // Nunca resuelve: aísla este test de la corrección stale→fresh
          // (revalidation.then), que no es lo que se quiere ejercitar acá.
          fetchDarksiteState: vi.fn().mockReturnValue(new Promise(() => {})),
        };
      });
      vi.doMock(fragmentPath, () => ({ loadFragment: loadFragmentSpy }));
      vi.doMock(localePath, () => ({
        resolveLocale: vi.fn()
          .mockResolvedValueOnce({ country: 'co', language: 'en', prefix: '/en' })
          .mockResolvedValueOnce({ country: 'co', language: 'pt', prefix: '/pt' }),
      }));
      vi.doMock('../../../scripts/aem.js', async (importOriginal) => {
        const original = await importOriginal();
        return { ...original, loadCSS: vi.fn() };
      });

      const { runDarksiteGate } = await import(gatePath);
      const first = runDarksiteGate(document); // generación 1 → idioma 'en'
      await vi.waitFor(() => {
        expect(loadFragmentSpy).toHaveBeenCalledWith(expect.stringContaining('/en/'));
      });
      const second = runDarksiteGate(document); // generación 2 → idioma 'pt'
      await vi.waitFor(() => {
        expect(loadFragmentSpy).toHaveBeenCalledWith(expect.stringContaining('/pt/'));
      });

      // El SEGUNDO (pt, generación vigente) resuelve primero.
      resolvePt();
      await second;
      expect(document.querySelector('.darksite-interstitial').textContent).toContain('PT');

      // El PRIMERO (en, generación obsoleta) resuelve después: no debe pisar el resultado.
      resolveEn();
      await first;
      expect(document.querySelector('.darksite-interstitial').textContent).toContain('PT');
      expect(document.querySelector('.darksite-interstitial').textContent).not.toContain('EN');
      expect(document.querySelectorAll('.darksite-interstitial')).toHaveLength(1);
    });
  });
});
