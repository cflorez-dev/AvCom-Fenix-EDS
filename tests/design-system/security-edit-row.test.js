// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);
let SecurityEditRow;

beforeAll(async () => {
  ({ SecurityEditRow } = await import('../../design-system/molecules/security-edit-row/security-edit-row.js'));
});

const LABELS = {
  btnCancel: 'Cancelar',
  btnSave: 'Guardar',
  btnSaving: 'Guardando',
  editTooltip: 'Editar',
  statusIncomplete: 'Información incompleta',
};

const mount = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${SecurityEditRow} labels=${LABELS} ...${props} />`, container);
  return container;
};

const row = (c) => c.querySelector('[data-name="security-edit-row"]');
const dataButtons = (c) => Array.from(c.querySelectorAll('[data-button]'));
const pencil = (c) => c.querySelector('button[aria-label="Editar"]');

describe('design-system · SecurityEditRow (fila seguridad, card + divisores)', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('lectura: renderiza título, descripción, label+valor y lápiz', () => {
    const c = mount({
      title: 'Contraseña',
      description: 'Protege tu cuenta',
      valueLabel: 'Contraseña',
      value: '••••••••',
      status: 'complete',
    });
    expect(c.textContent).toContain('Contraseña');
    expect(c.textContent).toContain('Protege tu cuenta');
    expect(c.querySelector('[data-name="summary-text"]')).toBeTruthy();
    expect(c.textContent).toContain('••••••••');
    expect(pencil(c)).toBeTruthy();
  });

  it('status=incomplete: pinta el badge "Información incompleta" (bajo la descripción)', () => {
    const c = mount({
      title: 'PIN', description: 'desc', valueLabel: 'PIN', value: '', status: 'incomplete',
    });
    const chip = c.querySelector('[data-name="status-profile-chip"]');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('data-variant')).toBe('incomplete');
    expect(chip.textContent).toContain('Información incompleta');
    // El badge vive dentro de la zona de título (junto a la descripción), no en la zona de valor.
    const titleZone = row(c).firstElementChild;
    expect(titleZone.contains(chip)).toBe(true);
  });

  it('status=complete: NO pinta chip ni check (Figma no muestra nada)', () => {
    const c = mount({
      title: 'Contraseña', valueLabel: 'Contraseña', value: '••••••••', status: 'complete',
    });
    expect(c.querySelector('[data-name="status-profile-chip"]')).toBeNull();
  });

  it('valor vacío → SummaryText muestra el placeholder "–"', () => {
    const c = mount({
      title: 'Método', valueLabel: 'Método', value: '', status: 'incomplete',
    });
    expect(c.querySelector('[data-name="summary-text"]').textContent).toContain('–');
  });

  it('lápiz dispara onEdit', () => {
    const onEdit = vi.fn();
    const c = mount({ title: 'T', valueLabel: 'T', onEdit });
    pencil(c).click();
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('canEdit=false → sin lápiz', () => {
    const c = mount({ title: 'T', valueLabel: 'T', canEdit: false });
    expect(pencil(c)).toBeNull();
  });

  it('editing: muestra el editContent + Cancelar/Guardar y oculta el lápiz', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    const c = mount({
      title: 'T',
      editing: true,
      editContent: html`<div data-testid="form-slot">campos</div>`,
      onCancel,
      onSave,
    });
    expect(c.querySelector('[data-testid="form-slot"]')).toBeTruthy();
    expect(pencil(c)).toBeNull();
    const labelsFound = dataButtons(c).map((b) => b.textContent.trim());
    expect(labelsFound.some((t) => t.includes('Cancelar'))).toBe(true);
    expect(labelsFound.some((t) => t.includes('Guardar'))).toBe(true);
    dataButtons(c).find((b) => b.textContent.includes('Cancelar')).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    dataButtons(c).find((b) => b.textContent.includes('Guardar')).click();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('saving: oculta Cancelar y el botón primario muestra "Guardando"', () => {
    const c = mount({
      title: 'T', editing: true, saving: true, editContent: html`<div>x</div>`,
    });
    const labelsFound = dataButtons(c).map((b) => b.textContent.trim());
    expect(labelsFound.some((t) => t.includes('Cancelar'))).toBe(false);
    expect(labelsFound.some((t) => t.includes('Guardando'))).toBe(true);
  });

  it('disabled: fila atenuada + aria-disabled (bloqueo cross-módulo)', () => {
    const c = mount({
      title: 'T', valueLabel: 'T', disabled: true,
    });
    const el = row(c);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.className).toContain('opacity-50');
    expect(el.className).toContain('pointer-events-none');
  });
});
