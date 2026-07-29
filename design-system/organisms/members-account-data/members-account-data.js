import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Accordion } from '../../molecules/accordion/accordion.js';
import { Button } from '../../atoms/button/button.js';
import { Input } from '../../atoms/inputs/input/input.js';
import { Select } from '../../atoms/inputs/select/select.js';
import { SummaryText } from '../../atoms/summary-text/summary-text.js';
import { InlineDateField } from '../../molecules/inline-date-field/inline-date-field.js';
import { ToastAlert } from '../../molecules/toast-alert/toast-alert.js';
import { EditableAccordionSection } from '../../molecules/editable-accordion-section/editable-accordion-section.js';
import { ProfileCompletionAlert } from '../../molecules/profile-completion-alert/profile-completion-alert.js';
import { InformativeModal } from '../../molecules/informative-modal/informative-modal.js';
import { Alert } from '../../molecules/alert/alert.js';
import { StatusProfileChip } from '../../atoms/status-profile-chip/status-profile-chip.js';
import { Icon } from '../../atoms/icon/icon.js';
import { Tooltip } from '../../atoms/tooltip/tooltip.js';
import { validateField, fieldProps } from '../../helpers/form-validation.js';
import {
  loadAccountProfile,
} from '../../../scripts/services/members/account-profile.service.js';
import {
  updatePersonal, updateContact, updateEmergency, saveDocument,
} from '../../../scripts/services/members/account-edit.service.js';
import {
  getCompanions, addCompanion, editCompanion, removeCompanion, computeAge,
} from '../../../scripts/services/members/frequent-flyer.service.js';
import {
  getCountries, getCountryLabel, getStoredCountry, getStoredLanguage,
} from '../../../scripts/services/header/language-country-selector.js';
import {
  formatDob, genderLabel, genderOptions, sectionComplete, incompleteSections, isDocComplete,
  donutCompleteness, geoFirst, dismissKey,
} from './members-account-data.logic.js';

const html = htm.bind(h);

// Sección (chip del banner) → id del panel Accordion que la contiene. Se usa para
// reabrir el panel destino si el usuario lo colapsó manualmente antes de navegar.
const SECTION_ACCORDION = {
  personal: 'profile',
  contact: 'profile',
  emergency: 'profile',
  documents: 'documents',
  companions: 'companions',
};

const resolveLang = () => String(
  getStoredLanguage() || (typeof document !== 'undefined' && document.documentElement.lang) || 'es',
).toLowerCase().slice(0, 2);

const PHONE_PATTERN = '^\\d{6,15}$';

// Etiqueta de país: intenta el catálogo ISO; si el código es LM (ej. '7710') no
// resuelve → muestra el código crudo. // TODO(LM): mapear códigos de país LM→ISO.
const countryText = (code) => {
  const label = code ? getCountryLabel(code, false) : '';
  return label || code || '';
};

const phonePrefixDisplay = (prefix, phone) => {
  if (!prefix && !phone) return '';
  return [prefix ? `+${prefix}` : '', phone].filter(Boolean).join(' ');
};

// --- Reading grid ---------------------------------------------------------
const ReadGrid = ({ children }) => html`
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4" data-name="read-grid">${children}</div>
`;

// Empty state (patrón CobrandEmptyState) con CTA que ABRE el form local (no
// redirect) → átomo Button DS (no `<button>` crudo).
const EmptyState = ({
  title, body, ctaLabel, onAdd,
}) => html`
  <div class="w-full rounded-2xl border-2 border-dashed border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] p-4 md:p-6 flex flex-col items-center gap-4 text-center md:flex-row md:text-left" data-name="account-empty-state">
    <span class="block w-[72px] h-[48px] rounded-md bg-[var(--bg-page-light)] border border-[var(--border-stroke-default)] shrink-0" aria-hidden="true"></span>
    <div class="flex flex-col gap-1 md:flex-1 min-w-0">
      <h3 class="m-0! text-sm! leading-[19px]! md:text-lg! md:leading-6! font-semibold! text-[var(--text-normal-primary)]!">${title}</h3>
      ${body && html`<span class="text-sm text-[var(--text-normal-secondary)]">${body}</span>`}
    </div>
    <${Button} variant="secondary" size="sm" onClick=${onAdd} customClassName="shrink-0 whitespace-nowrap">
      ${ctaLabel}
    </${Button}>
  </div>
`;

// =========================================================================
// Sección Personal (nombre/apellido/fecha READONLY; género/país/ciudad/dirección)
// =========================================================================
const PersonalSection = ({
  vm, labels, lang, editing, saving, disabled, canEdit, countryOpts, monthLabels,
  onEdit, onCancel, onCommit,
}) => {
  const p = vm.personal || {};
  const [form, setForm] = useState(p);
  const [errors, setErrors] = useState({});

  // Cálculo puro de errores por campo obligatorio. Se usa tanto al entrar en
  // modo edición (para pre-mostrar en rojo los campos incompletos, per AC) como
  // al presionar Guardar (para bloquear el commit si algo falla).
  const computeErrors = (f) => {
    const next = {};
    if (!validateField(f.gender, { required: true }).valid) next.gender = true;
    if (!validateField(f.country, { required: true }).valid) next.country = true;
    if (!validateField(f.city, { required: true }).valid) next.city = true;
    if (!validateField(f.addressLine, { required: true }).valid) next.addressLine = true;
    return next;
  };

  useEffect(() => { if (editing) { setForm(p); setErrors(computeErrors(p)); } }, [editing]);

  const read = html`
    <${ReadGrid}>
      <${SummaryText} label=${labels.fieldGender} value=${genderLabel(p.gender, labels)} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldFullName} value=${p.fullName} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldDateOfBirth} value=${formatDob(p.dateOfBirthParts, lang)} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldCountry} value=${countryText(p.country)} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldCity} value=${p.city} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldAddress} value=${p.addressLine} disabled=${disabled} />
    </${ReadGrid}>
  `;

  const set = (k) => (v) => setForm((f) => {
    const next = { ...f, [k]: v };
    setErrors(computeErrors(next));
    return next;
  });
  const err = (k, rules) => fieldProps(validateField(form[k], rules), {
    default: labels.errorGeneric,
  });

  const validate = () => {
    const next = computeErrors(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    onCommit({
      gender: form.gender, country: form.country, city: form.city, addressLine: form.addressLine,
    });
  };

  const editForm = html`
    ${/* Layout Figma 1056:33653:
        row-1: [Género(160) + Nombre readonly (flex-1)] flex-1 | Apellido readonly (flex-1)
        row-2: FechaNacimiento readonly (flex-1) | País (flex-1)
        row-3: Ciudad (flex-1) | Dirección (flex-1)
        Mobile: todo se apila en 1 columna (flex-col). */ ''}
    <div class="flex flex-col gap-[var(--spacing-medium,16px)] w-full">
      <div class="flex flex-col md:flex-row gap-[var(--spacing-medium,16px)] items-stretch w-full">
        <div class="flex-1 min-w-0 flex flex-col sm:flex-row gap-[var(--spacing-medium,16px)] items-stretch">
          <div class="w-full sm:w-[160px] sm:shrink-0">
            <${Select}
              label=${labels.fieldGender} required=${true} options=${genderOptions(labels)}
              value=${form.gender} onChange=${set('gender')}
              state=${errors.gender ? 'error' : 'normal'} helperText=${errors.gender ? labels.errorGeneric : ''}
            />
          </div>
          <div class="flex-1 min-w-0">
            <${Input} label=${labels.fieldFirstName} value=${p.givenName} readonly=${true} />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <${Input} label=${labels.fieldLastName} value=${p.familyName} readonly=${true} />
        </div>
      </div>
      <div class="flex flex-col md:flex-row gap-[var(--spacing-medium,16px)] items-stretch w-full">
        <div class="flex-1 min-w-0">
          <${InlineDateField} label=${labels.fieldDateOfBirth} value=${p.dateOfBirthParts} readonly=${true} monthLabels=${monthLabels} />
        </div>
        <div class="flex-1 min-w-0">
          <${Select}
            label=${labels.fieldCountry} required=${true} options=${countryOpts}
            value=${form.country} onChange=${set('country')}
            state=${errors.country ? 'error' : 'normal'} helperText=${errors.country ? labels.errorGeneric : ''}
          />
        </div>
      </div>
      <div class="flex flex-col md:flex-row gap-[var(--spacing-medium,16px)] items-start w-full">
        <div class="flex-1 min-w-0 w-full">
          <${Input}
            label=${labels.fieldCity} required=${true} value=${form.city} onChange=${set('city')}
            ...${err('city', { required: true })}
          />
        </div>
        <div class="flex-1 min-w-0 w-full">
          <${Input}
            label=${labels.fieldAddress} required=${true} value=${form.addressLine} onChange=${set('addressLine')}
            ...${err('addressLine', { required: true })}
          />
        </div>
      </div>
    </div>
  `;

  return html`
    <${EditableAccordionSection}
      title=${labels.sectionPersonal}
      status=${sectionComplete('personal', vm) ? 'complete' : 'incomplete'}
      editing=${editing} saving=${saving} disabled=${disabled} canEdit=${canEdit}
      readContent=${read} editContent=${editForm}
      onEdit=${onEdit} onCancel=${onCancel} onSave=${onSave}
      labels=${labels}
      data-section="personal"
    />
  `;
};

// =========================================================================
// Sección Contacto (Email | Prefijo | Teléfono — orden Figma; obligatoriedad dinámica)
// =========================================================================
const ContactSection = ({
  vm, labels, editing, saving, disabled, canEdit, prefixOpts, onEdit, onCancel, onCommit,
}) => {
  const c = vm.contact || {};
  const had = c.hadValue || {};
  const [form, setForm] = useState(c);
  const [errors, setErrors] = useState({});

  const computeErrors = (f) => {
    const next = {};
    const emailRules = { required: !!had.email, email: true };
    const phoneRules = { required: !!had.phone, pattern: PHONE_PATTERN };
    const er = validateField(f.email, emailRules);
    const pr = validateField(f.phone, phoneRules);
    if (!er.valid) next.email = er.error === 'email' ? labels.errorEmail : labels.errorGeneric;
    if (!pr.valid) next.phone = pr.error === 'pattern' ? labels.errorPhone : labels.errorGeneric;
    if (had.prefix && !validateField(f.prefix, { required: true }).valid) {
      next.prefix = labels.errorGeneric;
    }
    return next;
  };

  useEffect(() => { if (editing) { setForm(c); setErrors(computeErrors(c)); } }, [editing]);

  const read = html`
    <${ReadGrid}>
      <${SummaryText} label=${labels.fieldEmail} value=${c.email} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldPhone} value=${phonePrefixDisplay(c.prefix, c.phone)} disabled=${disabled} />
    </${ReadGrid}>
  `;

  const set = (k) => (v) => setForm((f) => {
    const next = { ...f, [k]: v };
    setErrors(computeErrors(next));
    return next;
  });

  const validate = () => {
    const next = computeErrors(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    onCommit({ email: form.email, prefix: form.prefix, phone: form.phone });
  };

  const editForm = html`
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <${Input}
        label=${labels.fieldEmail} type="email" required=${!!had.email}
        value=${form.email} onChange=${set('email')}
        state=${errors.email ? 'error' : 'normal'} helperText=${errors.email || ''}
      />
      <${Select}
        label=${labels.fieldPrefix} required=${!!had.prefix} options=${prefixOpts}
        value=${form.prefix} onChange=${set('prefix')}
        state=${errors.prefix ? 'error' : 'normal'} helperText=${errors.prefix || ''}
      />
      <${Input}
        label=${labels.fieldPhone} type="tel" required=${!!had.phone}
        value=${form.phone} onChange=${set('phone')}
        state=${errors.phone ? 'error' : 'normal'} helperText=${errors.phone || ''}
      />
    </div>
  `;

  return html`
    <${EditableAccordionSection}
      title=${labels.sectionContact}
      status=${sectionComplete('contact', vm) ? 'complete' : 'incomplete'}
      editing=${editing} saving=${saving} disabled=${disabled} canEdit=${canEdit}
      readContent=${read} editContent=${editForm}
      onEdit=${onEdit} onCancel=${onCancel} onSave=${onSave}
      labels=${labels}
      data-section="contact"
    />
  `;
};

// =========================================================================
// Sección Emergencia (UN campo Nombre — D33 — + Prefijo + Teléfono, todos required)
// =========================================================================
const EmergencySection = ({
  vm, labels, editing, saving, disabled, canEdit, prefixOpts, onEdit, onCancel, onCommit,
}) => {
  const e = vm.emergency || {};
  const [form, setForm] = useState(e);
  const [errors, setErrors] = useState({});

  const computeErrors = (f) => {
    const next = {};
    if (!validateField(f.name, { required: true }).valid) next.name = labels.errorGeneric;
    if (!validateField(f.prefix, { required: true }).valid) next.prefix = labels.errorGeneric;
    const pr = validateField(f.phone, { required: true, pattern: PHONE_PATTERN });
    if (!pr.valid) next.phone = pr.error === 'pattern' ? labels.errorPhone : labels.errorGeneric;
    return next;
  };

  useEffect(() => { if (editing) { setForm(e); setErrors(computeErrors(e)); } }, [editing]);

  const read = html`
    <${ReadGrid}>
      <${SummaryText} label=${labels.fieldEmergencyName} value=${e.name} disabled=${disabled} />
      <${SummaryText} label=${labels.fieldPhone} value=${phonePrefixDisplay(e.prefix, e.phone)} disabled=${disabled} />
    </${ReadGrid}>
  `;

  const set = (k) => (v) => setForm((f) => {
    const next = { ...f, [k]: v };
    setErrors(computeErrors(next));
    return next;
  });

  const validate = () => {
    const next = computeErrors(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    onCommit({ name: form.name, prefix: form.prefix, phone: form.phone });
  };

  const editForm = html`
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <${Input}
        label=${labels.fieldEmergencyName} required=${true} value=${form.name} onChange=${set('name')}
        state=${errors.name ? 'error' : 'normal'} helperText=${errors.name || ''}
      />
      <${Select}
        label=${labels.fieldPrefix} required=${true} options=${prefixOpts}
        value=${form.prefix} onChange=${set('prefix')}
        state=${errors.prefix ? 'error' : 'normal'} helperText=${errors.prefix || ''}
      />
      <${Input}
        label=${labels.fieldPhone} type="tel" required=${true} value=${form.phone} onChange=${set('phone')}
        state=${errors.phone ? 'error' : 'normal'} helperText=${errors.phone || ''}
      />
    </div>
  `;

  return html`
    <${EditableAccordionSection}
      title=${labels.sectionEmergency}
      status=${sectionComplete('emergency', vm) ? 'complete' : 'incomplete'}
      editing=${editing} saving=${saving} disabled=${disabled} canEdit=${canEdit}
      readContent=${read} editContent=${editForm}
      onEdit=${onEdit} onCancel=${onCancel} onSave=${onSave}
      labels=${labels}
      data-section="emergency"
    />
  `;
};

// =========================================================================
// Módulo Documentos de viaje (mock edit, expiración condicional)
// =========================================================================
const DOC_TYPES = ['P', 'I'];
const docTypeLabel = (t, labels) => (t === 'P' ? labels.docTypePassport : labels.docTypeId);
const docMaxLen = (t) => (t === 'P' ? 14 : 12);

// Header "bordered pill" (34×34px, rounded-32px, border 1px stroke default,
// ícono 16px centrado) del spec Figma 1223:13455 (edit) y 1223:13456 (delete).
// Todos los botones de icono edit/delete de la página comparten esta forma.
// Se maqueta a mano con las mismas variables de color del átomo `HeaderButton`
// porque `Button size="sm"` da 36×36 con border 2px (no coincide pixel a pixel
// con el spec).
const HeaderPillButton = ({
  icon, ariaLabel, tooltipLabel = '', onClick, disabled = false,
}) => html`
  <${Tooltip}
    content=${tooltipLabel || ariaLabel || ''}
    variant="hint"
    position="bottom"
    disabled=${disabled || !(tooltipLabel || ariaLabel)}
  >
    <button
      type="button"
      class="group relative inline-flex shrink-0 items-center justify-center w-[34px] h-[34px] rounded-[32px] border border-solid border-[var(--border-stroke-default)] bg-transparent cursor-pointer select-none outline-none transition-colors duration-150 ease-in-out hover:bg-[var(--color-background-brand-secondary-hover)] active:bg-[var(--color-background-brand-secondary-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-stroke-focus)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
      onClick=${onClick}
      disabled=${disabled}
      aria-label=${ariaLabel}
    >
      <${Icon} icon=${icon} customSize=${16} color="var(--icon-normal-primary)" />
    </button>
  </${Tooltip}>
`;

const isPastDate = (parts) => {
  if (!parts) return false;
  const d = new Date(parts.year, (parts.month || 1) - 1, parts.day || 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

// Formato Figma "Mes DD, YYYY" para expiración de pasaporte (1056:32574).
const formatDocExpiryLong = (parts, raw, lang = 'es') => {
  if (parts && Number.isFinite(parts.year)) return formatDob(parts, lang);
  return raw || '';
};

const DocumentReadCard = ({
  doc, labels, lang, canEdit, onEdit,
}) => {
  const expiryValue = doc.expiry
    ? formatDocExpiryLong(doc.expiryParts, doc.expiry, lang)
    : labels.docExpiryUnavailable;
  // Chip dinámico por doc. Un doc guardado no es siempre completo: si le falta
  // nacionalidad (o expiración en pasaporte) se muestra "Información incompleta"
  // en naranja (Figma 1056:32744 - passport incompleto).
  const docComplete = isDocComplete(doc);
  return html`
    <div class="flex flex-col gap-6 rounded-xl border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] p-4" data-name="document-card">
      <div class="flex items-start gap-4">
        <div class="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <h3 class="m-0! text-sm! leading-[19px]! md:text-lg! md:leading-6! font-semibold! text-[var(--text-normal-primary)]! break-words">${docTypeLabel(doc.type, labels)}</h3>
          <${StatusProfileChip}
            variant=${docComplete ? 'complete' : 'incomplete'}
            label=${docComplete ? '' : (labels.statusIncomplete || '')}
            customClassName="shrink-0"
          />
        </div>
        ${canEdit && html`
          <${HeaderPillButton} icon="action/edit" ariaLabel=${labels.btnEdit} tooltipLabel=${labels.editTooltip || labels.btnEdit} onClick=${onEdit} />
        `}
      </div>
      <${ReadGrid}>
        <${SummaryText} label=${labels.fieldDocNumber} value=${doc.number} />
        <${SummaryText} label=${labels.fieldDocNationality} value=${countryText(doc.nationality)} />
        ${doc.type === 'P' && html`
          <${SummaryText} label=${labels.fieldDocExpiry} value=${expiryValue} />
        `}
      </${ReadGrid}>
    </div>
  `;
};

const DocumentForm = ({
  labels, mode, initial, existingTypes, countryOpts, monthLabels, busy, onCancel, onSave,
}) => {
  const [form, setForm] = useState(() => initial);
  const [errors, setErrors] = useState({});
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const typeOptions = DOC_TYPES.map((t) => ({
    value: t,
    label: docTypeLabel(t, labels),
    // En 'add' se deshabilita el tipo ya presente (máx 1 por tipo, R2).
    disabled: mode === 'add' && existingTypes.includes(t),
  }));

  const validate = () => {
    const next = {};
    if (!validateField(form.type, { required: true }).valid) next.type = labels.errorGeneric;
    if (!validateField(form.nationality, { required: true }).valid) {
      next.nationality = labels.errorGeneric;
    }
    const numRes = validateField(form.number, {
      required: true, maxLength: docMaxLen(form.type), pattern: '^[A-Za-z0-9]+$',
    });
    if (!numRes.valid) next.number = labels.errorGeneric;
    if (form.type === 'P') {
      if (!form.expiryParts || !form.expiryParts.year) next.expiry = labels.errorGeneric;
      else if (isPastDate(form.expiryParts)) next.expiry = labels.errorDatePast;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => { if (validate()) onSave(form); };

  return html`
    <div class="flex flex-col gap-4 rounded-xl border border-[var(--border-stroke-default)] p-4" data-name="document-form">
      ${mode === 'edit'
    ? html`<h3 class="m-0! text-sm! leading-[19px]! md:text-lg! md:leading-6! font-semibold! text-[var(--text-normal-primary)]!">${docTypeLabel(form.type, labels)}</h3>`
    : html`
        <${Select}
          label=${labels.fieldDocType} required=${true} options=${typeOptions}
          value=${form.type} onChange=${set('type')}
          state=${errors.type ? 'error' : 'normal'} helperText=${errors.type || ''}
        />`}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <${Select}
          label=${labels.fieldDocNationality} required=${true} options=${countryOpts}
          value=${form.nationality} onChange=${set('nationality')}
          state=${errors.nationality ? 'error' : 'normal'} helperText=${errors.nationality || ''}
        />
        <${Input}
          label=${labels.fieldDocNumber} required=${true} value=${form.number} onChange=${set('number')}
          state=${errors.number ? 'error' : 'normal'} helperText=${errors.number || ''}
        />
      </div>
      ${form.type === 'P' && html`
        <${InlineDateField}
          label=${labels.fieldDocExpiry} required=${true} value=${form.expiryParts}
          monthLabels=${monthLabels} minYear=${new Date().getFullYear()}
          maxYear=${new Date().getFullYear() + 30}
          onChange=${(parts) => setForm((f) => ({ ...f, expiryParts: parts }))}
          error=${!!errors.expiry} helperText=${errors.expiry || ''}
        />
      `}
      ${/* Nota "El tipo de documento no se puede cambiar" — YA NO va inline en el
          form: el spec Figma (1056:32349/32508 perfil completo) la promueve a un
          `Alert variant="neutral"` al pie del DocumentsModule (afuera del form),
          visible siempre que exista al menos un doc o el usuario esté añadiendo.
          Se evita duplicar el copy. */ ''}
      <div class="flex items-center gap-3 justify-end">
        ${!busy && html`<${Button} variant="secondary" size="sm" onClick=${onCancel}>${labels.btnCancel}</${Button}>`}
        <${Button} variant="primary" size="sm" onClick=${submit} loading=${busy} disabled=${busy}>
          ${busy ? labels.btnSaving : labels.btnSave}
        </${Button}>
      </div>
    </div>
  `;
};

const DocumentsModule = ({
  vm, labels, lang, disabled, canEdit, countryOpts, monthLabels, busy, form,
  onBegin, onCancel, onSave,
}) => {
  const docs = Array.isArray(vm.documents) ? vm.documents : [];
  const existingTypes = docs.map((d) => d.type);
  const missingTypes = DOC_TYPES.filter((t) => !existingTypes.includes(t));
  const editingDoc = form && form.mode === 'edit' ? form.type : null;

  return html`
    <div class=${`flex flex-col gap-4 w-full transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`} data-section="documents">
      ${docs.length === 0 && !form && canEdit && html`
        <${EmptyState}
          title=${labels.docEmptyTitle} body=${labels.docEmptyBody}
          ctaLabel=${labels.docAdd} onAdd=${() => onBegin({ mode: 'add' })}
        />
      `}
      ${docs.map((doc) => (editingDoc === doc.type
    ? html`<${DocumentForm}
            key=${`edit-${doc.type}`}
            labels=${labels} mode="edit" initial=${{ ...doc }} existingTypes=${existingTypes}
            countryOpts=${countryOpts} monthLabels=${monthLabels} busy=${busy}
            onCancel=${onCancel} onSave=${onSave}
          />`
    : html`<${DocumentReadCard}
            key=${`read-${doc.type}`}
            doc=${doc} labels=${labels} lang=${lang}
            canEdit=${canEdit && !form}
            onEdit=${() => onBegin({ mode: 'edit', type: doc.type })}
          />`))}
      ${form && form.mode === 'add' && html`
        <${DocumentForm}
          labels=${labels} mode="add"
          initial=${{
    type: missingTypes[0] || 'P', number: '', nationality: '', expiryParts: null,
  }}
          existingTypes=${existingTypes} countryOpts=${countryOpts} monthLabels=${monthLabels}
          busy=${busy} onCancel=${onCancel} onSave=${onSave}
        />
      `}
      ${docs.length > 0 && missingTypes.length > 0 && !form && canEdit && html`
        <${Button} variant="secondary" size="sm" onClick=${() => onBegin({ mode: 'add' })} customClassName="self-start">
          ${labels.docAdd}
        </${Button}>
      `}
      ${/* Alert neutral "tipo de documento no se puede cambiar" — spec Figma
          `1056:32349` (desktop) / `1056:32508` (mobile): notificationAlert neutral
          al pie de la sección. Se muestra siempre que haya al menos un documento
          o el usuario esté añadiendo uno (contexto útil antes de commit).
          `dismissible=false` porque es una nota permanente del sistema (no una
          notificación transitoria). */ ''}
      ${(docs.length > 0 || (form && form.mode === 'add')) && html`
        <${Alert}
          variant="neutral"
          contentHTML=${`<p>${labels.docTypeNotEditable}</p>`}
          dismissible=${false}
          marqueeMode=${false}
          heightMode="wrap"
          customClassName="w-full"
        />
      `}
    </div>
  `;
};

// =========================================================================
// Módulo Acompañantes frecuentes (CRUD REAL lmFrequentFlyer)
// =========================================================================
const ageLabel = (band, labels) => {
  switch (band) {
    case 'infant': return labels.ageInfant;
    case 'child': return labels.ageChild;
    case 'young': return labels.ageYoung;
    case 'adult': return labels.ageAdult;
    default: return '';
  }
};

const CompanionForm = ({
  labels, mode, initial, countryOpts, monthLabels, busy, onCancel, onSave,
}) => {
  const [form, setForm] = useState(() => initial);
  const [errors, setErrors] = useState({});
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // Edad calculada del DOB del form → nº LM oculto si < 3 años (sticky 1056:40746).
  const age = computeAge(form.dobParts);
  const hideLm = age != null && age < 3;
  const lmReadonly = mode === 'edit' && !!initial.lmNumber;

  const validate = () => {
    const next = {};
    const req = (k) => {
      if (!validateField(form[k], { required: true }).valid) next[k] = labels.errorGeneric;
    };
    req('gender');
    req('givenName');
    req('familyName');
    req('country');
    if (!form.dobParts || !form.dobParts.year) next.dob = labels.errorGeneric;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => { if (validate()) onSave(form); };

  return html`
    <div class="flex flex-col gap-4 rounded-xl border border-[var(--border-stroke-default)] p-4" data-name="companion-form">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <${Select}
          label=${labels.fieldGender} required=${true} options=${genderOptions(labels)}
          value=${form.gender} onChange=${set('gender')}
          state=${errors.gender ? 'error' : 'normal'} helperText=${errors.gender || ''}
        />
        <${Select}
          label=${labels.fieldCountry} required=${true} options=${countryOpts}
          value=${form.country} onChange=${set('country')} readonly=${mode === 'edit'}
          state=${errors.country ? 'error' : 'normal'} helperText=${errors.country || ''}
        />
        <${Input}
          label=${labels.fieldFirstName} required=${true} value=${form.givenName} onChange=${set('givenName')}
          state=${errors.givenName ? 'error' : 'normal'} helperText=${errors.givenName || ''}
        />
        <${Input}
          label=${labels.fieldLastName} required=${true} value=${form.familyName} onChange=${set('familyName')}
          state=${errors.familyName ? 'error' : 'normal'} helperText=${errors.familyName || ''}
        />
      </div>
      <${InlineDateField}
        label=${labels.fieldDateOfBirth} required=${true} value=${form.dobParts}
        monthLabels=${monthLabels}
        onChange=${(parts) => setForm((f) => ({ ...f, dobParts: parts }))}
        error=${!!errors.dob} helperText=${errors.dob || ''}
      />
      ${!hideLm && html`
        <${Input}
          label=${labels.fieldCompanionLmNumber} value=${form.lmNumber} readonly=${lmReadonly}
          onChange=${set('lmNumber')}
        />
      `}
      <div class="flex items-center gap-3 justify-end">
        ${!busy && html`<${Button} variant="secondary" size="sm" onClick=${onCancel}>${labels.btnCancel}</${Button}>`}
        <${Button} variant="primary" size="sm" onClick=${submit} loading=${busy} disabled=${busy}>
          ${busy ? labels.btnSaving : labels.btnSave}
        </${Button}>
      </div>
    </div>
  `;
};

const CompanionCard = ({
  companion, labels, lang, disabled, canEdit, onEdit, onRemove,
}) => html`
  ${/* Sub-card interno de un acompañante. Spec Figma 1056:32435 (desktop) /
      1223:13383 (mobile): bg white, border stroke-default, rounded-12px, p-24px
      desktop / p-16px mobile, gap-24px entre header y grid, w-full para llenar
      el ancho del panel exterior. */ ''}
  <div class="flex flex-col gap-6 rounded-xl border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] p-4 md:p-6 w-full" data-name="companion-card">
    <div class="flex items-start justify-between gap-6">
      <div class="flex-1 min-w-0 flex flex-col gap-[2px]">
        ${/* Nombre 18px bold + check verde 20px inline. Debajo "Adulto" (age band)
            en 16px regular primary. Spec Figma `1223:13387`/`1223:13390`. */ ''}
        <div class="flex items-center gap-2 min-w-0">
          <h3 class="m-0! text-sm! leading-[19px]! md:text-lg! md:leading-6! font-semibold! text-[var(--text-normal-primary)]! truncate">${companion.givenName} ${companion.familyName}</h3>
          <${StatusProfileChip} variant="complete" customClassName="shrink-0" />
        </div>
        <span class="text-base font-normal text-[var(--text-normal-primary)]">${ageLabel(companion.ageBand, labels)}</span>
      </div>
      ${canEdit && !disabled && html`
        <div class="flex items-center gap-4 shrink-0">
          <${HeaderPillButton} icon="action/edit" ariaLabel=${labels.btnEdit} tooltipLabel=${labels.editTooltip || labels.btnEdit} onClick=${onEdit} />
          <${HeaderPillButton} icon="action/delete" ariaLabel=${labels.companionRemoveConfirm} tooltipLabel=${labels.deleteTooltip || ''} onClick=${onRemove} />
        </div>
      `}
    </div>
    <${ReadGrid}>
      <${SummaryText} label=${labels.fieldGender} value=${genderLabel(companion.gender, labels)} />
      <${SummaryText} label=${labels.fieldFullName} value=${`${companion.givenName || ''} ${companion.familyName || ''}`.trim()} />
      <${SummaryText} label=${labels.fieldDateOfBirth} value=${formatDob(companion.dateOfBirthParts, lang)} />
      <${SummaryText} label=${labels.fieldCountry} value=${countryText(companion.countryOfResidence)} />
      ${companion.lmNumber && html`<${SummaryText} label=${labels.fieldCompanionLmNumber} value=${companion.lmNumber} />`}
    </${ReadGrid}>
  </div>
`;

const CompanionsModule = ({
  companions, labels, lang, disabled, maxCompanions, countryOpts, monthLabels, busy, form,
  onBegin, onCancel, onSubmit, onRemove,
}) => {
  const list = Array.isArray(companions?.companions) ? companions.companions : [];
  const failed = companions && companions.ok === false;
  const atMax = list.length >= maxCompanions;

  if (failed) {
    return html`
      <div class="flex flex-col gap-2" data-section="companions">
        <p class="text-sm text-[var(--text-normal-secondary)]">${labels.companionsLoadError || ''}</p>
      </div>
    `;
  }

  return html`
    <div class=${`flex flex-col gap-4 w-full transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`} data-section="companions">
      ${list.length === 0 && !form && html`
        <${EmptyState}
          title=${labels.companionsEmptyTitle} body=${labels.companionsEmptyBody}
          ctaLabel=${labels.companionsAdd} onAdd=${() => onBegin({ mode: 'add' })}
        />
      `}
      ${list.map((c) => (form && form.mode === 'edit' && form.id === c.nomineeReferenceNumber
    ? html`<${CompanionForm}
            key=${`edit-${c.nomineeReferenceNumber}`}
            labels=${labels} mode="edit"
            initial=${{
      gender: c.gender,
      givenName: c.givenName,
      familyName: c.familyName,
      country: c.countryOfResidence,
      dobParts: c.dateOfBirthParts,
      lmNumber: c.lmNumber,
    }}
            countryOpts=${countryOpts} monthLabels=${monthLabels} busy=${busy}
            onCancel=${onCancel} onSave=${(data) => onSubmit(data, 'edit', c)}
          />`
    : html`<${CompanionCard}
            key=${`card-${c.nomineeReferenceNumber}`}
            companion=${c} labels=${labels} lang=${lang} disabled=${!!form} canEdit=${true}
            onEdit=${() => onBegin({ mode: 'edit', id: c.nomineeReferenceNumber })}
            onRemove=${() => onRemove(c)}
          />`))}
      ${form && form.mode === 'add' && html`
        <${CompanionForm}
          labels=${labels} mode="add"
          initial=${{
    gender: '', givenName: '', familyName: '', country: '', dobParts: null, lmNumber: '',
  }}
          countryOpts=${countryOpts} monthLabels=${monthLabels} busy=${busy}
          onCancel=${onCancel} onSave=${(data) => onSubmit(data, 'add')}
        />
      `}
      ${list.length > 0 && !form && html`
        <div class="flex flex-col gap-2 w-full">
          ${/* Shortcut button "Añadir compañero frecuente" — Figma:
              · Mobile 1223:13413 → full-width, h-44 (h-11), rounded-32, bg white + drop-shadow.
              · Desktop 1056:32464 → auto-width alineado a la izquierda, h-32 (h-8),
                mismo rounded/shadow.
              Se construye directo en HTML porque el atom Button no expone la
              variante "shortcut" (bg white con shadow y sin border). El label
              ya trae "+" del i18n → se strippea para poner el Icon 16px propio. */ ''}
          ${/* Nota Tailwind v4: la regla global 'button { font: inherit }' del
              styles.css gana sobre las utilities si no llevan '!'. Ver
              memories/repo/tailwind-v4-gotchas.md. Por eso 'text-sm!' y
              'font-bold!' aca. */ ''}
          <button
            type="button"
            onClick=${() => onBegin({ mode: 'add' })}
            disabled=${atMax}
            class=${`flex items-center justify-center gap-2 w-full md:w-auto md:self-start h-11 md:h-8 rounded-[32px] bg-[var(--bg-card-lighter)] shadow-[0_0_3px_rgba(90,90,90,0.2)] px-4 text-sm! font-bold! text-[var(--text-brand-secondary,var(--text-normal-primary))]! whitespace-nowrap transition-opacity ${atMax ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            aria-label=${labels.companionsAdd}
          >
            <${Icon} icon="action/add2" customSize=${16} color="var(--icon-normal-primary)" />
            <span>${String(labels.companionsAdd || '').replace(/^\+\s*/, '')}</span>
          </button>
          ${atMax && html`<span class="text-xs text-[var(--text-normal-secondary)]">${labels.companionMaxReached}</span>`}
        </div>
      `}
    </div>
  `;
};

const AccountSkeleton = () => html`
  <div class="flex flex-col gap-6" data-name="account-data-skeleton" aria-hidden="true">
    <div class="h-[110px] w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
    <div class="h-60 w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
    <div class="h-40 w-full rounded-2xl bg-[var(--bg-page-light)] animate-pulse"></div>
  </div>
`;

const PanelTitle = (text) => html`
  <span class="!text-base !leading-[21px] lg:!text-xl lg:!leading-[26px] font-semibold text-[var(--text-normal-primary)]">${text}</span>
`;

// Card look de los 3 paneles exteriores (Datos personales / Documentos / Acompañantes)
// según Figma 1056:32360 (desktop) / 1056:32519 (mobile detail): rounded-16px, border
// stroke default, bg white, full-width, padding lateral+bottom (el top ya lo aporta
// el header interno del Accordion via `py-4`). Aplicado como `customClassName` sobre
// el molecule Accordion para NO tocar el componente compartido.
const PANEL_CARD_CLASSES = 'rounded-2xl border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] px-4 md:px-6 pb-4 md:pb-6';

/**
 * MembersAccountData — organism de la tab Datos (1279361). Orquesta el banner de
 * completitud + 3 paneles (Mi perfil / Documentos / Acompañantes) con:
 *  - Carga best-effort (`loadAccountProfile` + `getCompanions`, allSettled).
 *  - PII LOCAL: el perfil vive SOLO en el estado de este organism (nunca a store/
 *    localStorage/logs). Única key de localStorage = el dismiss del banner 100%.
 *  - Bloqueo cross-módulo: un solo `editingSection` a la vez → los demás disabled.
 *  - Edición de perfil MOCK optimistic (P3/D24) · Acompañantes CRUD REAL.
 *  - Toast (`ToastAlert` isFloating 6s) reusado para guardar/eliminar/error.
 *  - Completitud viva: recalculada tras cada guardado.
 *
 * ## Props
 * @param {object} cfg config de Members (usa `cfg.account`).
 * @param {object} labels copies de account (getAccountLabelsSync/loadAccountLabels).
 * @param {object} [overrides] samples/tests: `{ vm, companions, wrapperFn }` inyecta
 *   VMs sin fetch. `wrapperFn` reemplaza el global para el CRUD real de acompañantes.
 * @param {object} [editOpts] samples/tests: opts para el mock de edición ({ latencyMs }).
 */
export const MembersAccountData = ({
  cfg = {},
  labels = {},
  overrides = null,
  editOpts = null,
  ...rest
}) => {
  const account = cfg.account || {};
  const lang = resolveLang();
  const monthLabels = String(labels.monthsList || '').split('|');
  const editMockEnabled = account.editMockEnabled !== false;
  const maxCompanions = Number.isFinite(Number(account.maxCompanions))
    ? Number(account.maxCompanions) : 4;
  const thresholds = {
    warning: account.completenessThresholdWarning,
    positive: account.completenessThresholdPositive,
  };

  const rootRef = useRef(null);
  const [vm, setVm] = useState(() => (overrides?.vm || null));
  const [companions, setCompanions] = useState(() => (overrides?.companions || null));
  const [loading, setLoading] = useState(() => !overrides);
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [docForm, setDocForm] = useState(null);
  const [companionForm, setCompanionForm] = useState(null);
  const [companionBusy, setCompanionBusy] = useState(false);
  const [modal, setModal] = useState(null); // { kind:'confirm'|'error', companion? }
  const [toast, setToast] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  // Tokens de force-open por panel (accordion id → timestamp). Un chip del banner
  // de completitud que navega a una sección dentro de un panel COLAPSADO
  // manualmente lo reabre antes de scrollear/enfocar.
  const [forceOpen, setForceOpen] = useState({});

  const wrapperFn = overrides?.wrapperFn || null;

  // Opciones de país geo-first (el POS guardado primero).
  const countryOpts = geoFirst(
    getCountries().map((c) => ({ value: c.value, label: c.label, flagPath: c.flagPath })),
    getStoredCountry(),
  );

  // Carga inicial (best-effort). PII: el vm vive SOLO acá.
  useEffect(() => {
    if (overrides) return undefined;
    let mounted = true;
    const timers = [];
    // Cap de 8s (patrón elite, T13): en el PRIMER mount la cadena LM puede no
    // estar lista y una invocación colgarse (visto en qa 2026-07-20) → sin cap,
    // el skeleton quedaba eterno. Con cap: fail-soft y la UI degrada.
    const withCap = (promise, fallback) => Promise.race([
      promise,
      new Promise((resolve) => { timers.push(setTimeout(() => resolve(fallback), 8000)); }),
    ]);
    // Reintento automático (QA interno 2026-07-22): en frío el primer intento
    // falla/capea aunque el servicio responda ~1s en caliente; sin retry, el tab
    // quedaba en la rama de error hasta re-montar (ir a Wallet y volver). Hasta 3
    // intentos manteniendo el skeleton; el error queda para fallas genuinas.
    const attempt = (n) => {
      Promise.allSettled([
        withCap(loadAccountProfile(), { ok: false }),
        withCap(getCompanions({}), { ok: false, error: 'unavailable' }),
      ]).then(([prof, comp]) => {
        if (!mounted) return;
        const profVal = prof.status === 'fulfilled' ? prof.value : null;
        const profOk = !!(profVal && profVal.ok);
        if (!profOk && n < 2) {
          timers.push(setTimeout(() => attempt(n + 1), 4000));
          return; // el skeleton sigue en pantalla durante el reintento
        }
        setVm(profOk ? profVal : null);
        setCompanions(comp.status === 'fulfilled' ? comp.value : { ok: false });
        setLoading(false);
      });
    };
    attempt(0);
    return () => { mounted = false; timers.forEach(clearTimeout); };
  }, []);

  // Dismiss del banner 100% (D25, INTERINO): localStorage con membershipNumber (SIN PII).
  useEffect(() => {
    if (!vm) return;
    try {
      const key = dismissKey(vm.profileParams?.membershipNumber);
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1') setDismissed(true);
    } catch (e) { /* storage no disponible */ }
  }, [vm]);

  if (loading) {
    return html`
      <div class="members-account-data" data-name="members-account-data" data-state="loading" role="status" aria-busy="true">
        <${AccountSkeleton} />
      </div>
    `;
  }

  const showToast = (variant, title) => setToast({ variant, title, id: Date.now() });

  const isBlocked = (key) => editingSection !== null && editingSection !== key;

  // --- Commit de secciones de perfil (mock optimistic) ---
  const commitProfile = (changes, fn) => {
    setSaving(true);
    fn(vm, changes, { enabled: editMockEnabled, ...(editOpts || {}) }).then((res) => {
      setSaving(false);
      if (res.ok) {
        setVm(res.vm);
        setEditingSection(null);
        showToast('success', labels.toastSaved);
      }
    });
  };

  // --- Documentos (mock) ---
  const commitDocument = (doc) => {
    setSaving(true);
    saveDocument(vm, doc, { enabled: editMockEnabled, ...(editOpts || {}) }).then((res) => {
      setSaving(false);
      if (res.ok) {
        setVm(res.vm);
        setDocForm(null);
        setEditingSection(null);
        showToast('success', labels.toastSaved);
      }
    });
  };

  // --- Acompañantes (REAL) ---
  const refetchCompanions = async () => {
    const res = await getCompanions(vm?.profileParams || {}, wrapperFn);
    setCompanions(res);
  };

  const submitCompanion = async (data, mode, companion) => {
    setCompanionBusy(true);
    const payload = {
      givenName: data.givenName,
      familyName: data.familyName,
      gender: data.gender,
      countryOfResidence: data.country,
      dateOfBirth: data.dobParts
        ? `${String(data.dobParts.year)}-${String(data.dobParts.month).padStart(2, '0')}-${String(data.dobParts.day).padStart(2, '0')}`
        : '',
      partnerMembershipNumber: data.lmNumber,
    };
    const params = vm?.profileParams || {};
    const currentCount = (companions?.companions || []).length;
    let res;
    if (mode === 'edit') res = await editCompanion(params, companion, payload, wrapperFn);
    else res = await addCompanion(params, payload, currentCount, wrapperFn);
    setCompanionBusy(false);
    if (res.ok) {
      setCompanionForm(null);
      setEditingSection(null);
      await refetchCompanions();
      showToast('success', labels.toastSaved);
    } else if (res.error === 'max') {
      showToast('caution', labels.companionMaxReached);
    } else {
      setModal({ kind: 'error' });
    }
  };

  const confirmRemove = async () => {
    const companion = modal?.companion;
    if (!companion) return;
    setCompanionBusy(true);
    const res = await removeCompanion(vm?.profileParams || {}, companion, wrapperFn);
    setCompanionBusy(false);
    setModal(null);
    if (res.ok) {
      await refetchCompanions();
      showToast('success', labels.toastDeleted);
    } else {
      showToast('error', labels.toastDeleteError);
    }
  };

  // --- Completitud (donut) ---
  const donut = donutCompleteness(vm?.presence, {});
  const bannerSections = vm ? incompleteSections(vm, labels) : [];
  const showBanner = vm && !(donut.complete && dismissed);
  // Título del panel de perfil: cuando las 3 sub-secciones (personal, contacto,
  // emergencia) están completas, mostrar "Datos personales"; si alguna está
  // incompleta, mostrar "Mi perfil" (más accionable, en línea con Figma).
  const profilePanelComplete = vm
    && sectionComplete('personal', vm)
    && sectionComplete('contact', vm)
    && sectionComplete('emergency', vm);
  const profilePanelTitle = profilePanelComplete
    ? (labels.panelPersonalData || labels.panelMyProfile)
    : labels.panelMyProfile;

  const onNavigate = (key) => {
    if (!rootRef.current) return;
    // Si la sección vive dentro de un panel colapsable, forzar su apertura antes
    // de scrollear/enfocar (si estaba cerrado, el contenido está `hidden` y el
    // scroll/foco no tendrían efecto).
    const acc = SECTION_ACCORDION[key];
    if (acc) setForceOpen((prev) => ({ ...prev, [acc]: Date.now() }));
    const revealSection = () => {
      if (!rootRef.current) return;
      const el = rootRef.current.querySelector(`[data-section="${key}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = el.querySelector('button, [role="button"], input');
      if (focusable) focusable.focus();
    };
    // Doble rAF: deja que el force-open re-renderice y el panel deje de estar
    // `hidden` antes de medir/scrollear. Si ya estaba abierto, el costo es un
    // frame imperceptible.
    requestAnimationFrame(() => requestAnimationFrame(revealSection));
  };

  const onDismissBanner = () => {
    setDismissed(true);
    // TODO(HU-1279361 / Figma D35 "Persistencia definitiva"): el spec pide
    // persistir el dismiss en BASE DE DATOS asociado al ID del usuario (no
    // localStorage/sessionStorage) para que sobreviva a logout y cross-device.
    // Mientras el endpoint no exista, fallback a localStorage por
    // membershipNumber (funciona en un mismo dispositivo/mismo perfil).
    try {
      const key = dismissKey(vm?.profileParams?.membershipNumber);
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, '1');
    } catch (e) { /* storage no disponible */ }
  };

  const beginDoc = (f) => { setDocForm(f); setEditingSection('documents'); };
  const cancelDoc = () => { setDocForm(null); setEditingSection(null); };
  const beginCompanion = (f) => { setCompanionForm(f); setEditingSection('companions'); };
  const cancelCompanion = () => { setCompanionForm(null); setEditingSection(null); };

  return html`
    <div
      ref=${rootRef}
      class="members-account-data flex flex-col gap-6"
      data-name="members-account-data"
      data-state="ready"
      ...${rest}
    >
      ${showBanner && html`
        <${ProfileCompletionAlert}
          percent=${donut.percent} pending=${bannerSections.length}
          sections=${bannerSections} thresholds=${thresholds} labels=${labels}
          onNavigate=${onNavigate} onDismiss=${onDismissBanner}
        />
      `}

      ${vm ? html`
        <${Accordion} title=${PanelTitle(profilePanelTitle)} titleLevel="h2" defaultOpen=${true} forceOpen=${forceOpen.profile || 0} chevronColor="var(--icon-normal-primary)" customClassName=${PANEL_CARD_CLASSES}>
          <div class="flex flex-col gap-6 w-full">
            <${PersonalSection}
              vm=${vm} labels=${labels} lang=${lang}
              editing=${editingSection === 'personal'} saving=${saving && editingSection === 'personal'}
              disabled=${isBlocked('personal')} canEdit=${editMockEnabled}
              countryOpts=${countryOpts} monthLabels=${monthLabels}
              onEdit=${() => setEditingSection('personal')} onCancel=${() => setEditingSection(null)}
              onCommit=${(ch) => commitProfile(ch, updatePersonal)}
            />
            <${ContactSection}
              vm=${vm} labels=${labels}
              editing=${editingSection === 'contact'} saving=${saving && editingSection === 'contact'}
              disabled=${isBlocked('contact')} canEdit=${editMockEnabled} prefixOpts=${countryOpts}
              onEdit=${() => setEditingSection('contact')} onCancel=${() => setEditingSection(null)}
              onCommit=${(ch) => commitProfile(ch, updateContact)}
            />
            <${EmergencySection}
              vm=${vm} labels=${labels}
              editing=${editingSection === 'emergency'} saving=${saving && editingSection === 'emergency'}
              disabled=${isBlocked('emergency')} canEdit=${editMockEnabled} prefixOpts=${countryOpts}
              onEdit=${() => setEditingSection('emergency')} onCancel=${() => setEditingSection(null)}
              onCommit=${(ch) => commitProfile(ch, updateEmergency)}
            />
          </div>
        </${Accordion}>

        <${Accordion} title=${PanelTitle(labels.panelDocuments)} titleLevel="h2" defaultOpen=${true} forceOpen=${forceOpen.documents || 0} chevronColor="var(--icon-normal-primary)" customClassName=${PANEL_CARD_CLASSES}>
          <${DocumentsModule}
            vm=${vm} labels=${labels} lang=${lang} disabled=${isBlocked('documents')} canEdit=${editMockEnabled}
            countryOpts=${countryOpts} monthLabels=${monthLabels} busy=${saving} form=${docForm}
            onBegin=${beginDoc} onCancel=${cancelDoc} onSave=${commitDocument}
          />
        </${Accordion}>

        <${Accordion} title=${PanelTitle(labels.panelCompanions)} titleLevel="h2" defaultOpen=${true} forceOpen=${forceOpen.companions || 0} chevronColor="var(--icon-normal-primary)" customClassName=${PANEL_CARD_CLASSES}>
          <${CompanionsModule}
            companions=${companions} labels=${labels} lang=${lang} disabled=${isBlocked('companions')}
            maxCompanions=${maxCompanions} countryOpts=${countryOpts} monthLabels=${monthLabels}
            busy=${companionBusy} form=${companionForm}
            onBegin=${beginCompanion} onCancel=${cancelCompanion}
            onSubmit=${submitCompanion}
            onRemove=${(c) => setModal({ kind: 'confirm', companion: c })}
          />
        </${Accordion}>
      ` : html`
        <p class="text-sm text-[var(--text-normal-secondary)]">${labels.errorGeneric || ''}</p>
      `}

      ${modal && modal.kind === 'confirm' && html`
        <${InformativeModal}
          isOpen=${true} onClose=${() => setModal(null)} variant="confirm"
          title=${labels.companionRemoveTitle} body=${labels.companionRemoveBody}
          primaryLabel=${companionBusy ? labels.btnDeleting : labels.companionRemoveConfirm}
          primaryLoading=${companionBusy}
          onPrimary=${confirmRemove}
          secondaryLabel=${labels.companionRemoveCancel} onSecondary=${() => setModal(null)}
        />
      `}
      ${modal && modal.kind === 'error' && html`
        <${InformativeModal}
          isOpen=${true} onClose=${() => setModal(null)} variant="error"
          title=${labels.companionErrorTitle} body=${labels.companionErrorBody}
          primaryLabel=${labels.companionErrorRetry}
          onPrimary=${() => setModal(null)}
        />
      `}

      ${toast && html`
        <${ToastAlert}
          key=${toast.id}
          variant=${toast.variant} title=${toast.title}
          isFloating=${true} duration=${6000}
          onDismiss=${() => setToast(null)}
        />
      `}
    </div>
  `;
};

export default MembersAccountData;
