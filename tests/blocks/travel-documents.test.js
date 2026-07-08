// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const aemPath = '../../scripts/aem.js';
const targetPath = '../../scripts/utils/target-filter.js';
const localePath = '../../scripts/utils/locale.js';
const smartvelPath = '../../scripts/utils/smartvel.js';

function mockDeps({ show, language = 'es', apiKey = 'key-123' }) {
  vi.doMock(aemPath, () => ({ readBlockConfig: () => ({ 'target-countries': '', 'target-languages': '' }) }));
  vi.doMock(targetPath, () => ({
    shouldShowByTargeting: vi.fn().mockReturnValue(show),
    hideBlockWithSection: vi.fn(),
  }));
  vi.doMock(localePath, () => ({ resolveLocale: vi.fn().mockResolvedValue({ language }) }));
  vi.doMock(smartvelPath, () => ({ getSmartvelApiKey: vi.fn().mockResolvedValue(apiKey) }));
}

describe('travel-documents decorate', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('hides the block and does not render the widget when POS does not match', async () => {
    mockDeps({ show: false });
    const { hideBlockWithSection } = await import('../../scripts/utils/target-filter.js');
    const decorate = (await import('../../blocks/travel-documents/travel-documents.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);

    await decorate(block);

    expect(hideBlockWithSection).toHaveBeenCalledWith(block);
    expect(block.querySelector('smt-gcovwidget')).toBeNull();
  });

  it('renders smt-gcovwidget with apikey and resolved lang when POS matches', async () => {
    mockDeps({ show: true, language: 'en', apiKey: 'key-123' });
    const decorate = (await import('../../blocks/travel-documents/travel-documents.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);

    await decorate(block);

    const widget = block.querySelector('smt-gcovwidget');
    expect(widget).not.toBeNull();
    expect(widget.getAttribute('apikey')).toBe('key-123');
    expect(widget.getAttribute('lang')).toBe('en');
  });

  it('hides the block when the API key is missing', async () => {
    mockDeps({ show: true, apiKey: '' });
    const { hideBlockWithSection } = await import('../../scripts/utils/target-filter.js');
    const decorate = (await import('../../blocks/travel-documents/travel-documents.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await decorate(block);

    expect(hideBlockWithSection).toHaveBeenCalledWith(block);
    expect(block.querySelector('smt-gcovwidget')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('appends the gcovwidget boot script after the widget element exists', async () => {
    mockDeps({ show: true });
    const decorate = (await import('../../blocks/travel-documents/travel-documents.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);

    await decorate(block);

    const scripts = document.querySelectorAll('script[src="https://cdn.smartvel.com/scripts/gcovwidget/boot.min.js"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    expect(block.querySelector('smt-gcovwidget')).not.toBeNull();
  });

  it('reloads the boot script for each instance so multiple widgets initialize', async () => {
    mockDeps({ show: true });
    const decorate = (await import('../../blocks/travel-documents/travel-documents.js')).default;

    const block1 = document.createElement('div');
    const block2 = document.createElement('div');
    document.body.appendChild(block1);
    document.body.appendChild(block2);

    await decorate(block1);
    await decorate(block2);

    expect(block1.querySelector('smt-gcovwidget')).not.toBeNull();
    expect(block2.querySelector('smt-gcovwidget')).not.toBeNull();

    const bootScripts = document.querySelectorAll('script[src="https://cdn.smartvel.com/scripts/gcovwidget/boot.min.js"]');
    expect(bootScripts.length).toBe(2);
  });

  it('appends the boot script only after <smt-gcovwidget> is already in the DOM', async () => {
    mockDeps({ show: true });
    const decorate = (await import('../../blocks/travel-documents/travel-documents.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);

    let widgetExistedWhenScriptWasAppended = null;
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node.nodeName === 'SCRIPT' && node.src && node.src.includes('boot.min.js')) {
        widgetExistedWhenScriptWasAppended = !!block.querySelector('smt-gcovwidget');
      }
      return originalAppendChild(node);
    });

    await decorate(block);

    expect(widgetExistedWhenScriptWasAppended).toBe(true);
    appendSpy.mockRestore();
  });
});
