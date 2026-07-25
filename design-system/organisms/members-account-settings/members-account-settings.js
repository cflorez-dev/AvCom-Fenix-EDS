import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Accordion } from '../../molecules/accordion/accordion.js';
import { Input } from '../../atoms/inputs/input/input.js';
import { Select } from '../../atoms/inputs/select/select.js';
import { SecurityEditRow } from '../../molecules/security-edit-row/security-edit-row.js';
import { OptInItem } from '../../molecules/opt-in-item/opt-in-item.js';
import { validateField } from '../../helpers/form-validation.js';
import { loadAccountProfile } from '../../../scripts/services/members/account-profile.service.js';
import {
  savePassword, savePin, saveVerificationMethod,
} from '../../../scripts/services/members/account-security.service.js';
import {
  resolveOptIns, readOptIns, writeOptIn, verificationMethodOptions, methodLabel,
} from './members-account-settings.logic.js';

const html = htm.bind(h);

// Mínima longitud de contraseña para la validación de fortaleza (mock; el wrapper
// real de LM impondrá su propia política — D24).
const PASSWORD_MIN_LEN = 8;

// Mock no-op del envío del opt-in a CDP (D3/D26). Resuelve siempre en qa; cuando
// LM/CDP entregue el contrato, acá va el fetch real y el `.catch` del toggle
// revierte el switch (D14, fail-soft silencioso).
const sendOptInToCdp = () => Promise.resolve();

const PanelTitle = (text) => html`
  <span class="text-lg font-semibold leading-normal text-[var(--text-normal-primary)]">${text}</span>
`;

const SettingsSkeleton = () => html`
  <div class="flex flex-col gap-6" data-name="account-settings-skeleton" aria-hidden="true">
    <div class="h-60 w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
    <div class="h-40 w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
  </div>
`;

// =========================================================================
// Fila Contraseña (decisión 7): sin dato → valor enmascarado neutro, status
// complete. Edición = 2 Input password con ojo + validación de fortaleza. Mock.
// =========================================================================
const PasswordSection = ({
  labels, editing, saving, disabled, canEdit, onEdit, onCancel, onCommit,
}) => {
  const [form, setForm] = useState({ current: '', next: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { if (editing) { setForm({ current: '', next: '' }); setErrors({}); } }, [editing]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const next = {};
    if (!validateField(form.current, { required: true }).valid) next.current = labels.errorGeneric;
    if (!validateField(form.next, { required: true, minLength: PASSWORD_MIN_LEN }).valid) {
      next.next = labels.errorPasswordWeak;
    }
    setErrors(next);
    if (Object.keys(next).length === 0) onCommit({ current: form.current, next: form.next });
  };

  const editForm = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <${Input}
        label=${labels.securityPasswordCurrent} type="password" showPasswordToggle=${true} required=${true}
        value=${form.current} onChange=${set('current')}
        state=${errors.current ? 'error' : 'normal'} helperText=${errors.current || ''}
      />
      <${Input}
        label=${labels.securityPasswordNew} type="password" showPasswordToggle=${true} required=${true}
        value=${form.next} onChange=${set('next')}
        state=${errors.next ? 'error' : 'normal'} helperText=${errors.next || ''}
      />
    </div>
  `;

  return html`
    <${SecurityEditRow}
      title=${labels.securityPasswordTitle}
      description=${labels.securityPasswordDesc}
      valueLabel=${labels.securityPasswordTitle}
      value="••••••••"
      status="complete"
      editing=${editing} saving=${saving} disabled=${disabled} canEdit=${canEdit}
      editContent=${editForm}
      onEdit=${onEdit} onCancel=${onCancel} onSave=${submit}
      labels=${labels}
      data-section="password"
    />
  `;
};

// =========================================================================
// Fila PIN (decisión 8): único dato real = boolean hasPin. Lectura = ••••• o –
// + badge. Edición = 1 Input password con ojo (desenmascara en claro, §D). Mock.
// =========================================================================
const PinSection = ({
  labels, hasPin, editing, saving, disabled, canEdit, onEdit, onCancel, onCommit,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (editing) { setPin(''); setError(''); } }, [editing]);

  const submit = () => {
    if (!validateField(pin, { required: true }).valid) { setError(labels.errorGeneric); return; }
    onCommit({ pin });
  };

  const editForm = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <${Input}
        label=${labels.securityPinField} type="password" showPasswordToggle=${true} required=${true}
        value=${pin} onChange=${setPin}
        state=${error ? 'error' : 'normal'} helperText=${error || ''}
      />
    </div>
  `;

  return html`
    <${SecurityEditRow}
      title=${labels.securityPinTitle}
      description=${labels.securityPinDesc}
      valueLabel=${labels.securityPinField}
      value=${hasPin ? '•••••' : ''}
      status=${hasPin ? 'complete' : 'incomplete'}
      editing=${editing} saving=${saving} disabled=${disabled} canEdit=${canEdit}
      editContent=${editForm}
      onEdit=${onEdit} onCancel=${onCancel} onSave=${submit}
      labels=${labels}
      data-section="pin"
    />
  `;
};

// =========================================================================
// Fila Método de verificación (decisión 6): sin dato → – + badge. Edición =
// dropdown SMS / Correo / MS Authenticator. Guarda MOCK (se pierde al reload).
// =========================================================================
const MethodSection = ({
  labels, method, methodOptions, editing, saving, disabled, canEdit, onEdit, onCancel, onCommit,
}) => {
  const [sel, setSel] = useState(method || '');
  const [error, setError] = useState('');

  useEffect(() => { if (editing) { setSel(method || ''); setError(''); } }, [editing]);

  const submit = () => {
    if (!validateField(sel, { required: true }).valid) { setError(labels.errorGeneric); return; }
    onCommit({ method: sel });
  };

  const editForm = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <${Select}
        label=${labels.securityMethodField} required=${true} options=${methodOptions}
        value=${sel} onChange=${setSel}
        state=${error ? 'error' : 'normal'} helperText=${error || ''}
      />
    </div>
  `;

  return html`
    <${SecurityEditRow}
      title=${labels.securityMethodTitle}
      description=${labels.securityMethodDesc}
      valueLabel=${labels.securityMethodField}
      value=${method ? methodLabel(method, labels) : ''}
      status=${method ? 'complete' : 'incomplete'}
      editing=${editing} saving=${saving} disabled=${disabled} canEdit=${canEdit}
      editContent=${editForm}
      onEdit=${onEdit} onCancel=${onCancel} onSave=${submit}
      labels=${labels}
      data-section="method"
    />
  `;
};

/**
 * MembersAccountSettings — organism de la tab "Ajustes y privacidad" (1279363).
 * Espejo SIMPLIFICADO de `MembersAccountData`. Dos bloques:
 *  - **Configuraciones de seguridad**: Contraseña / PIN / Método de verificación,
 *    edición inline MOCK (D24/D29) con bloqueo cross-módulo (un solo `editingSection`).
 *  - **Notificaciones y privacidad**: opt-ins con `Switch`, cambio inmediato SIN
 *    feedback (sticky `1291:49142`); persistencia INTERINA en localStorage
 *    (`members.account.optins.<membershipNumber>`, SOLO ids+boolean, D12); envío a
 *    CDP mock no-op (D26/D3).
 *
 * PII (regla dura del lote): password/PIN/método viven SOLO en el estado en
 * memoria; NUNCA a storage/console/logs. Única key de storage = la de opt-ins.
 * El perfil se carga best-effort SOLO para leer `security.hasPin` (boolean).
 *
 * ## Props
 * @param {object} cfg config de Members (usa `cfg.account.settings`).
 * @param {object} labels copies de account (getAccountLabelsSync/loadAccountLabels).
 * @param {object} [overrides] samples/tests: `{ vm }` inyecta el VM (con `security.hasPin`)
 *   sin fetch.
 * @param {object} [editOpts] samples/tests: opts del mock de seguridad ({ latencyMs }).
 */
export const MembersAccountSettings = ({
  cfg = {},
  labels = {},
  overrides = null,
  editOpts = null,
  ...rest
}) => {
  const account = cfg.account || {};
  const settings = account.settings || {};
  const securityMockEnabled = settings.securityMockEnabled !== false;
  const privacyPolicyUrl = String(settings.privacyPolicyUrl || '');
  const methodOptions = verificationMethodOptions(settings.verificationMethods, labels);

  const [vm, setVm] = useState(() => (overrides?.vm || null));
  const [loading, setLoading] = useState(() => !overrides);
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasPin, setHasPin] = useState(() => !!(overrides?.vm?.security?.hasPin));
  // Método de verificación (mock en memoria: se pierde al reload — QA).
  const [method, setMethod] = useState('');
  // Estado de los toggles de opt-in: mapa `{ [id]: boolean }` (optimista).
  const [checkedMap, setCheckedMap] = useState({});

  const membershipNumber = vm?.profileParams?.membershipNumber || 'anon';

  // Carga best-effort del perfil SOLO para `security.hasPin` (fail-soft: sin
  // perfil → hasPin:false). Cap de 8s (patrón elite) para que el skeleton no cuelgue.
  useEffect(() => {
    if (overrides) return undefined;
    let mounted = true;
    const timers = [];
    const withCap = (promise, fallback) => Promise.race([
      promise,
      new Promise((resolve) => { timers.push(setTimeout(() => resolve(fallback), 8000)); }),
    ]);
    // Reintento automático (QA interno 2026-07-22, mismo patrón que Datos): en frío
    // el primer intento puede fallar/capear → hasPin quedaba en false y los opt-ins
    // persistían bajo la key `anon` hasta re-montar. Hasta 3 intentos con skeleton.
    const attempt = (n) => {
      Promise.allSettled([withCap(loadAccountProfile(), { ok: false })]).then(([prof]) => {
        if (!mounted) return;
        const profVal = prof.status === 'fulfilled' ? prof.value : null;
        const v = profVal && profVal.ok ? profVal : null;
        if (!v && n < 2) {
          timers.push(setTimeout(() => attempt(n + 1), 4000));
          return; // skeleton sigue durante el reintento
        }
        setVm(v);
        setHasPin(!!(v?.security?.hasPin));
        setLoading(false);
      });
    };
    attempt(0);
    return () => { mounted = false; timers.forEach(clearTimeout); };
  }, []);

  // Inicializa el estado de los toggles: default del config + override de storage
  // (INTERINO, D12). Re-corre si cambia el membershipNumber (anon → real al cargar).
  useEffect(() => {
    const stored = readOptIns(membershipNumber);
    const init = {};
    (settings.optIns || []).forEach((o) => {
      if (!o || !o.id) return;
      init[o.id] = Object.prototype.hasOwnProperty.call(stored, o.id)
        ? stored[o.id] === true
        : o.defaultOn === true;
    });
    setCheckedMap(init);
  }, [membershipNumber]);

  if (loading) {
    return html`
      <div class="members-account-settings" data-name="members-account-settings" data-state="loading" role="status" aria-busy="true">
        <${SettingsSkeleton} />
      </div>
    `;
  }

  const isBlocked = (key) => editingSection !== null && editingSection !== key;

  // Commit MOCK optimistic de una fila de seguridad. PII: NO se persiste el valor
  // (ni storage ni logs); solo el retorno del mock actualiza el estado en memoria.
  const commitSecurity = (fn, payload, onSuccess) => {
    setSaving(true);
    fn(payload, { enabled: securityMockEnabled, ...(editOpts || {}) }).then((res) => {
      setSaving(false);
      if (res.ok) {
        onSuccess(res);
        setEditingSection(null);
      }
    }).catch(() => {
      // Fail-soft (D14): un rechazo del wrapper real (TODO-LM) no puede dejar el
      // botón pegado en "Guardando"; el form queda abierto para reintentar/cancelar.
      setSaving(false);
    });
  };

  // Toggle de opt-in: cambio INMEDIATO sin feedback (sticky 1291:49142).
  const onToggleOptIn = (id, nextVal) => {
    setCheckedMap((m) => ({ ...m, [id]: nextVal })); // (a) update optimista
    writeOptIn(membershipNumber, id, nextVal); // (b) persistencia interina (D12)
    // (c) envío a CDP: mock no-op (D3/D26). La estructura de revert (D14, fail-soft
    // silencioso) queda lista para cuando se cablee el CDP real.
    sendOptInToCdp(id, nextVal).catch(() => {
      setCheckedMap((m) => ({ ...m, [id]: !nextVal })); // revertir
      // eslint-disable-next-line no-console
      console.warn('[account-settings] opt-in CDP send failed; reverting', id);
    });
  };

  const optInList = resolveOptIns(settings.optIns, checkedMap, labels);

  return html`
    <div
      class="members-account-settings flex flex-col gap-6"
      data-name="members-account-settings"
      data-state="ready"
      ...${rest}
    >
      <${Accordion} title=${PanelTitle(labels.settingsSecurityTitle)} titleLevel="h2" defaultOpen=${true} chevronColor="var(--icon-normal-primary)">
        ${/* Figma §D (1056:120211): las 3 filas de seguridad viven en UNA sola card
             con divisores (divide-y) — NO cards apiladas. La card usa el patrón del
             lote (bg-card-lighter + border-stroke-default + radius). */ ''}
        <div class="w-full rounded-2xl bg-[var(--bg-card-lighter)] border border-[var(--border-stroke-default)] px-4 md:px-6 divide-y divide-[var(--border-stroke-default)]">
          <${PasswordSection}
            labels=${labels}
            editing=${editingSection === 'password'} saving=${saving && editingSection === 'password'}
            disabled=${isBlocked('password')} canEdit=${securityMockEnabled}
            onEdit=${() => setEditingSection('password')} onCancel=${() => setEditingSection(null)}
            onCommit=${(payload) => commitSecurity(savePassword, payload, () => {})}
          />
          <${PinSection}
            labels=${labels} hasPin=${hasPin}
            editing=${editingSection === 'pin'} saving=${saving && editingSection === 'pin'}
            disabled=${isBlocked('pin')} canEdit=${securityMockEnabled}
            onEdit=${() => setEditingSection('pin')} onCancel=${() => setEditingSection(null)}
            onCommit=${(payload) => commitSecurity(savePin, payload, () => setHasPin(true))}
          />
          <${MethodSection}
            labels=${labels} method=${method} methodOptions=${methodOptions}
            editing=${editingSection === 'method'} saving=${saving && editingSection === 'method'}
            disabled=${isBlocked('method')} canEdit=${securityMockEnabled}
            onEdit=${() => setEditingSection('method')} onCancel=${() => setEditingSection(null)}
            onCommit=${(payload) => commitSecurity(saveVerificationMethod, payload, (res) => setMethod(res.method))}
          />
        </div>
      </${Accordion}>

      <${Accordion} title=${PanelTitle(labels.settingsPrivacyTitle)} titleLevel="h2" defaultOpen=${true} chevronColor="var(--icon-normal-primary)">
        ${/* Figma §D: cada opt-in va encapsulado en su propia card (OptInItem ya la
             pinta); el contenedor solo separa las cards. */ ''}
        <div class="flex flex-col gap-4 w-full">
          ${optInList.map((o) => html`
            <${OptInItem}
              key=${o.id} id=${o.id} title=${o.title} copyHtml=${o.copyHtml}
              checked=${o.checked}
              onChange=${(next) => onToggleOptIn(o.id, next)}
            />
          `)}
          ${privacyPolicyUrl && html`
            <a
              href=${privacyPolicyUrl} target="_blank" rel="noopener noreferrer"
              class="mt-2 self-start text-sm text-[var(--text-link-default)] underline"
            >
              ${labels.privacyPolicyLinkLabel}
            </a>
          `}
        </div>
      </${Accordion}>
    </div>
  `;
};

export default MembersAccountSettings;
