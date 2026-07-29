// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Switch } from '../../design-system/atoms/switch/switch.js';

const html = htm.bind(h);

const mount = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${Switch} ...${props} />`, container);
  return container.querySelector('[data-name="switch"]');
};

describe('design-system · Switch (átomo role=switch)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza un button role=switch con aria-checked según checked', () => {
    const on = mount({ checked: true, onChange: () => {} });
    expect(on.tagName).toBe('BUTTON');
    expect(on.getAttribute('role')).toBe('switch');
    expect(on.getAttribute('aria-checked')).toBe('true');

    const off = mount({ checked: false, onChange: () => {} });
    expect(off.getAttribute('aria-checked')).toBe('false');
  });

  it('togglea por click llamando onChange con el valor invertido', () => {
    const onChange = vi.fn();
    const el = mount({ checked: false, onChange });
    el.click();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('togglea por teclado (Space y Enter) e ignora otras teclas', () => {
    const onChange = vi.fn();
    const el = mount({ checked: true, onChange });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(false);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(2);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('disabled: no dispara onChange por click ni teclado y refleja aria', () => {
    const onChange = vi.fn();
    const el = mount({ checked: false, disabled: true, onChange });
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('expone aria-label cuando se pasa', () => {
    const el = mount({ checked: false, ariaLabel: 'Notificaciones', onChange: () => {} });
    expect(el.getAttribute('aria-label')).toBe('Notificaciones');
  });
});
