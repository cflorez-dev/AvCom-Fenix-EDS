import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ModalAviancaLayout } from '../../molecules/modal/modal-avianca-layout.js';
import { getModalDescriptorSync, loadModalDescriptor } from '../../../scripts/services/members/members-i18n.js';
import { getStoredLanguage } from '../../../scripts/services/header/language-country-selector.js';
import { isSafeUrl } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * Modal genérico de Members (1255601), driven por `modalKey`.
 *
 * Resuelve el descriptor del modal (`getModalDescriptorSync` para el primer render +
 * `loadModalDescriptor` async para el copy autorado) y lo mapea a `ModalAviancaLayout`.
 * Generaliza el modal de conexión embrionario (1255303) a un solo sistema multi-key.
 *
 * Las acciones de las CTAs (`reload|home|dismiss|url`) se resuelven a handlers; el caller
 * puede sobreescribirlas con `onPrimary`/`onSecondary` (lo usa el host para enganchar el
 * contador de reintentos). `dismissible=false` oculta la X / click-fuera / Esc.
 *
 * ## Props
 * - `modalKey`: string — key del descriptor (connection-error, session-expired, generic-error, CF).
 * - `descriptor`: object — descriptor YA resuelto (lo inyecta el host tras leer el CF). Si viene,
 *   se usa tal cual y se omite la resolución local por `modalKey`.
 * - `isOpen`: boolean — controla la visibilidad.
 * - `onClose`: () => void — cierra el modal (X / click afuera / Esc).
 * - `onPrimary`: () => void — override de la CTA primaria (default: acción del descriptor).
 * - `onSecondary`: () => void — override de la CTA secundaria (default: acción del descriptor).
 */

/** Home del POS/locale (ej. '/pt/'). Mismo criterio que members-auth.route#homeForPos. */
const homeForPos = () => {
  const docLang = typeof document !== 'undefined' && document.documentElement.lang;
  const lang = getStoredLanguage() || docLang || 'pt';
  return `/${lang}/`;
};

/** Navega a `url` SOLO si es segura y same-origin (§5: el CF no manda a hosts externos). */
function navigateSameOrigin(url) {
  if (!isSafeUrl(url)) return;
  try {
    const resolved = new URL(url, window.location.origin);
    if (resolved.origin === window.location.origin) window.location.assign(resolved.href);
  } catch (e) { /* URL inválida → no navega */ }
}

/** Resuelve una acción del descriptor (`reload|home|dismiss|url`) a un handler de click. */
function resolveActionHandler(action, url, onClose) {
  switch (action) {
    case 'reload': return () => window.location.reload();
    case 'home': return () => window.location.assign(homeForPos());
    case 'url': return () => navigateSameOrigin(url);
    case 'dismiss':
    default: return onClose || (() => {});
  }
}

export const MembersModal = ({
  modalKey, descriptor: descriptorProp, isOpen, onClose, onPrimary, onSecondary,
}) => {
  // Descriptor des-hardcodeado: si el host lo inyecta (resuelto del CF) se usa tal cual; si no,
  // fallback síncrono por key + copy autorado (spreadsheet) — el camino standalone (anonymous.js).
  const [descriptor, setDescriptor] = useState(
    () => descriptorProp || getModalDescriptorSync(modalKey),
  );
  useEffect(() => {
    if (descriptorProp) { setDescriptor(descriptorProp); return undefined; }
    let active = true;
    setDescriptor(getModalDescriptorSync(modalKey));
    loadModalDescriptor(modalKey).then((d) => { if (active && d) setDescriptor(d); });
    return () => { active = false; };
  }, [modalKey, descriptorProp]);

  // Stacking: marcamos <html> mientras está abierto para que header.css eleve .header-user-actions
  // y el overlay tape el header. Mismo patrón que el modal de conexión (z-index, no portal).
  useEffect(() => {
    const cls = 'members-modal-open';
    document.documentElement.classList.toggle(cls, isOpen);
    return () => document.documentElement.classList.remove(cls);
  }, [isOpen]);

  if (!descriptor) return null;

  const dismissible = descriptor.dismissible !== false;
  const handlePrimary = onPrimary
    || resolveActionHandler(descriptor.primaryCtaAction, descriptor.primaryCtaUrl, onClose);
  const handleSecondary = onSecondary
    || resolveActionHandler(descriptor.secondaryCtaAction, descriptor.secondaryCtaUrl, onClose);

  return html`
    <${ModalAviancaLayout}
      isOpen=${isOpen}
      onClose=${onClose}
      role="alertdialog"
      icon=${descriptor.icon}
      imageAlt=${descriptor.iconAlt || descriptor.title}
      title=${descriptor.title}
      titleStyle="font-size: 1.5rem; line-height: 2rem"
      descriptionClassName=""
      description=${descriptor.description}
      showCloseButton=${dismissible}
      clickOutsideToClose=${dismissible}
      escapeToClose=${dismissible}
      primaryButtonLabel=${descriptor.primaryCtaLabel}
      onPrimaryClick=${handlePrimary}
      secondaryButtonLabel=${descriptor.secondaryCtaLabel}
      onSecondaryClick=${descriptor.secondaryCtaLabel ? handleSecondary : undefined}
    />
  `;
};

export default MembersModal;
