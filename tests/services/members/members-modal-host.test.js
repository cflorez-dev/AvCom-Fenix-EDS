/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const hostPath = '../../../scripts/services/members/members-modal-host.js';
const modalPath = '../../../design-system/organisms/user-session/members-modal.js';
const i18nPath = '../../../scripts/services/members/members-i18n.js';
const pageTypePath = '../../../scripts/services/members/page-type.js';
const configPath = '../../../scripts/services/members/members-config.js';
const sanitizePath = '../../../scripts/utils/sanitize.js';
const errorPath = '../../../scripts/services/members/members-error.js';

const setupDom = () => {
  const reload = vi.fn();
  const appended = [];
  globalThis.window = { location: { pathname: '/pt/', reload } };
  globalThis.location = globalThis.window.location;
  globalThis.document = {
    createElement: () => ({ id: '', remove: vi.fn() }),
    body: { appendChild: (el) => { appended.push(el); } },
  };
  return { reload, appended };
};

const mockDeps = ({
  retries = 0, isPortal = false, modals = null, localDescriptor,
} = {}) => {
  const renderSpy = vi.fn();
  vi.doMock('@dropins/tools/preact.js', () => ({ h: () => {}, render: renderSpy }));
  vi.doMock('htm', () => ({ default: { bind: () => () => null } }));
  vi.doMock(modalPath, () => ({ MembersModal: () => null }));

  const descriptor = localDescriptor !== undefined
    ? localDescriptor
    : {
      icon: 'alert/Error', title: 'T', description: 'D', primaryCtaLabel: 'R', primaryCtaAction: 'reload',
    };
  vi.doMock(i18nPath, () => ({
    getModalDescriptorSync: () => ({ title: 'generic', primaryCtaAction: 'reload' }),
    loadModalDescriptor: vi.fn().mockResolvedValue(descriptor),
  }));
  vi.doMock(pageTypePath, () => ({ isPortalPage: () => isPortal }));
  vi.doMock(configPath, () => ({ loadMembersConfig: vi.fn().mockResolvedValue({ modals }) }));
  vi.doMock(sanitizePath, () => ({ sanitizeHTMLAsync: vi.fn((s) => Promise.resolve(s || '')) }));
  const incRetries = vi.fn();
  vi.doMock(errorPath, () => ({ getRetries: () => retries, incRetries }));
  return { renderSpy, incRetries };
};

describe('members/members-modal-host showMembersModal', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.document;
  });

  it('r<3 → muestra el modal', async () => {
    setupDom();
    const { renderSpy } = mockDeps({ retries: 0 });
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('connection-error');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('r>=3 sin Portal → NO muestra (deja navegar)', async () => {
    setupDom();
    const { renderSpy } = mockDeps({ retries: 3, isPortal: false });
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('connection-error');
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('r>=3 en Portal → re-muestra (sin incrementar)', async () => {
    setupDom();
    const { renderSpy } = mockDeps({ retries: 3, isPortal: true });
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('connection-error', { pathname: '/pt/members/profile' });
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('session-expired con el flag off (Track 2) → NO muestra', async () => {
    setupDom();
    const { renderSpy } = mockDeps({ retries: 0 });
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('session-expired');
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('modalKey vacío → no hace nada', async () => {
    setupDom();
    const { renderSpy } = mockDeps({ retries: 0 });
    const { showMembersModal } = await import(hostPath);
    await showMembersModal();
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('CF con config.modals[key] → usa el descriptor del CF (sanitizado)', async () => {
    setupDom();
    const cfModal = {
      icon: 'alert/Error',
      title: 'CF title',
      body: { html: '<b>cf body</b>' },
      primaryCtaLabel: 'Recargar',
      primaryCtaAction: 'reload',
      maxRetries: 3,
    };
    const { renderSpy } = mockDeps({ retries: 0, modals: { http_500: cfModal } });
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('http_500');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('cfModalToProps sanitiza body.html y mapea las CTAs', async () => {
    setupDom();
    mockDeps({ retries: 0 });
    const { cfModalToProps } = await import(hostPath);
    const props = await cfModalToProps({
      icon: 'i',
      title: 't',
      body: { html: '<p>x</p>' },
      primaryCtaLabel: 'P',
      primaryCtaAction: 'home',
      secondaryCtaLabel: 'S',
      secondaryCtaAction: 'url',
      secondaryCtaUrl: '/es/algo',
      dismissible: false,
      maxRetries: 2,
    });
    expect(props).toMatchObject({
      icon: 'i',
      title: 't',
      description: 'x', // el <p> del CF se desenvuelve a contenido inline (sin márgenes del p global)
      primaryCtaLabel: 'P',
      primaryCtaAction: 'home',
      secondaryCtaLabel: 'S',
      secondaryCtaAction: 'url',
      secondaryCtaUrl: '/es/algo', // ← el CTA secundario también proyecta su URL (antes se descartaba)
      dismissible: false,
      maxRetries: 2,
    });
  });

  it('cfModalToProps desenvuelve párrafos del body.html (multi-<p> → <br>)', async () => {
    setupDom();
    mockDeps({ retries: 0 });
    const { cfModalToProps } = await import(hostPath);
    const one = await cfModalToProps({ body: { html: '<p>Hola <b>mundo</b>.</p>' } });
    expect(one.description).toBe('Hola <b>mundo</b>.'); // sin <p>, conserva el inline interno
    const two = await cfModalToProps({ body: { html: '<p>uno</p><p>dos</p>' } });
    expect(two.description).toBe('uno<br>dos'); // párrafos separados por <br>
  });

  it('cfModalToProps resuelve el icon content-reference del DAM a su _publishUrl', async () => {
    setupDom();
    mockDeps({ retries: 0 });
    const { cfModalToProps } = await import(hostPath);
    const props = await cfModalToProps({
      icon: {
        _path: '/content/dam/x/wifi-error.jpg', _publishUrl: 'https://cdn/wifi-error.jpg', width: 76, height: 80,
      },
      iconAlt: 'Sin conexión',
      title: 'Problema de conexión',
      body: { html: '<p>y</p>' },
    });
    expect(props.icon).toBe('https://cdn/wifi-error.jpg'); // string https → ModalAviancaLayout lo pinta como <img>
    expect(props.iconAlt).toBe('Sin conexión');
  });

  it('cfModalToProps retrocompatible: icon string (modelo viejo) pasa tal cual', async () => {
    setupDom();
    mockDeps({ retries: 0 });
    const { cfModalToProps } = await import(hostPath);
    const props = await cfModalToProps({ icon: 'alert/Error', title: 't', body: { html: '' } });
    expect(props.icon).toBe('alert/Error');
  });

  it('fetchMembersModals es un placeholder que lanza (frontera CF)', async () => {
    setupDom();
    mockDeps({ retries: 0 });
    const { fetchMembersModals } = await import(hostPath);
    await expect(fetchMembersModals('es')).rejects.toThrow();
  });
});

// Regresión (cazado en verificación en vivo 2026-06-16): el gating de Portal usaba el cfg del
// parámetro; cuando el call-site NO pasa cfg, quedaba undefined → portalRoutes=[] → el re-show en
// perfil nunca disparaba. Acá usamos el isPortalPage REAL (sin mock) para ejercitar que el host
// cargue la config solo y el gating funcione sin cfg explícito.
describe('members/members-modal-host gating de Portal con isPortalPage real (sin cfg explícito)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.document;
  });

  const setupReal = (retries) => {
    globalThis.window = { location: { pathname: '/es/', reload: vi.fn() } };
    globalThis.location = globalThis.window.location;
    globalThis.document = {
      createElement: () => ({ id: '', remove: vi.fn() }),
      body: { appendChild: () => {} },
    };
    const renderSpy = vi.fn();
    vi.doMock('@dropins/tools/preact.js', () => ({ h: () => {}, render: renderSpy }));
    vi.doMock('htm', () => ({ default: { bind: () => () => null } }));
    vi.doMock(modalPath, () => ({ MembersModal: () => null }));
    vi.doMock(i18nPath, () => ({
      getModalDescriptorSync: () => ({ title: 'g' }),
      loadModalDescriptor: vi.fn().mockResolvedValue({ title: 't', maxRetries: 3 }),
    }));
    // isPortalPage REAL: desmockeamos page-type (un doMock previo persiste pese a resetModules).
    vi.doUnmock(pageTypePath);
    vi.doMock(configPath, () => ({
      loadMembersConfig: vi.fn().mockResolvedValue({
        modals: null, portalRoutes: ['/members'], portalExclude: ['/members/auth'],
      }),
    }));
    vi.doMock(sanitizePath, () => ({ sanitizeHTMLAsync: vi.fn((s) => Promise.resolve(s || '')) }));
    vi.doMock(errorPath, () => ({ getRetries: () => retries, incRetries: vi.fn() }));
    return { renderSpy };
  };

  it('r>=3 SIN cfg en página de perfil → host carga config y RE-MUESTRA', async () => {
    const { renderSpy } = setupReal(3);
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('http_500', { pathname: '/es/members/profile' });
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('r>=3 SIN cfg en Home → NO muestra (deja navegar)', async () => {
    const { renderSpy } = setupReal(3);
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('http_500', { pathname: '/es/' });
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('r>=3 SIN cfg en página-puente de auth → NO muestra (excluida del Portal)', async () => {
    const { renderSpy } = setupReal(3);
    const { showMembersModal } = await import(hostPath);
    await showMembersModal('http_500', { pathname: '/es/members/auth/callback' });
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
