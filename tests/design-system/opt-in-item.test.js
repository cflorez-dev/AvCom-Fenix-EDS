// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);
const sanitizePath = '../../scripts/utils/sanitize.js';
let OptInItem;

// Mock del saneo (mismo idiom que members-modal-host.test): stub que ELIMINA
// `<script>…</script>` — simula la whitelist DOMPurify sin la CDN en el test.
beforeAll(async () => {
  vi.doMock(sanitizePath, () => ({
    sanitizeHTMLAsync: vi.fn((s) => Promise.resolve(
      String(s || '').replace(/<script[\s\S]*?<\/script>/gi, ''),
    )),
  }));
  ({ OptInItem } = await import('../../design-system/molecules/opt-in-item/opt-in-item.js'));
});

const mount = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${OptInItem} ...${props} />`, container);
  return container;
};

describe('design-system · OptInItem (fila opt-in + Switch, sin feedback)', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renderiza título + switch', () => {
    const c = mount({
      id: 'promotions', title: 'Promociones', checked: false, onChange: () => {},
    });
    expect(c.textContent).toContain('Promociones');
    expect(c.querySelector('[data-name="switch"]')).toBeTruthy();
    expect(c.querySelector('[data-name="opt-in-item"]').getAttribute('data-optin-id')).toBe('promotions');
  });

  it('click y teclado (Space/Enter) en el switch disparan onChange(!checked)', () => {
    const onChange = vi.fn();
    const c = mount({ title: 'T', checked: false, onChange });
    const sw = c.querySelector('[data-name="switch"]');
    sw.click();
    expect(onChange).toHaveBeenLastCalledWith(true);
    sw.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(2);
    sw.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('el switch refleja aria-checked según checked', () => {
    const on = mount({ title: 'T', checked: true, onChange: () => {} });
    expect(on.querySelector('[data-name="switch"]').getAttribute('aria-checked')).toBe('true');
    const off = mount({ title: 'T', checked: false, onChange: () => {} });
    expect(off.querySelector('[data-name="switch"]').getAttribute('aria-checked')).toBe('false');
  });

  it('disabled: el switch no dispara onChange', () => {
    const onChange = vi.fn();
    const c = mount({
      title: 'T', checked: false, disabled: true, onChange,
    });
    c.querySelector('[data-name="switch"]').click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('copy con <a> se sanea: el link sobrevive y un <script> inyectado NO', async () => {
    const c = mount({
      title: 'Aliados',
      copyHtml: 'Ver <a href="/legal/privacy-policy">Política</a><script>window.__x=1</script>',
      checked: true,
      onChange: () => {},
    });
    await vi.waitFor(() => expect(c.querySelector('a')).toBeTruthy());
    expect(c.querySelector('a').getAttribute('href')).toBe('/legal/privacy-policy');
    expect(c.innerHTML).not.toContain('<script');
    expect(c.innerHTML).not.toContain('window.__x');
  });

  it('OPTIN_SANITIZE declara target/rel en ADD_ATTR (DOMPurify real los strippea si solo van en ALLOWED_ATTR)', async () => {
    // Guard de config: el mock del saneo no ejercita DOMPurify real, así que
    // este bug (links sin target=_blank en vivo) solo se previene fijando la config.
    const { OPTIN_SANITIZE } = await import('../../design-system/molecules/opt-in-item/opt-in-item.js');
    expect(OPTIN_SANITIZE.ADD_ATTR).toEqual(expect.arrayContaining(['target', 'rel']));
  });
});
