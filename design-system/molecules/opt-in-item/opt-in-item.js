import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Switch } from '../../atoms/switch/switch.js';
import { sanitizeHTMLAsync } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * Whitelist DOMPurify para el copy de opt-ins (regla del lote). El copy puede
 * traer `<a>` teal del CF (§D) + énfasis básico; nada de scripts/handlers. URIs
 * http(s)/mailto/relativas.
 */
export const OPTIN_SANITIZE = {
  ALLOWED_TAGS: ['a', 'strong', 'em', 'b', 'i', 'br', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  // DOMPurify strippea target/rel aunque estén en ALLOWED_ATTR — hay que
  // declararlos también en ADD_ATTR (verificado en vivo con 3.4.0; mismo
  // estándar que cms-rich-text-helper.js). Sin esto, forceBlankLinks es no-op.
  ADD_ATTR: ['target', 'rel'],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|\/)/i,
};

/**
 * OptInItem — fila de opt-in del bloque "Notificaciones y privacidad" (1279363,
 * §D). Título + copy (con links inline sanitizados) a la izquierda; `Switch` a la
 * derecha. **Sin feedback** (sticky `1291:49142`): el cambio es inmediato al
 * accionar el switch — no hay botón guardar ni toast; el switch es el único
 * feedback. 1 columna siempre (todos los breakpoints).
 *
 * El copy se sanea con `sanitizeHTMLAsync` (whitelist `OPTIN_SANITIZE`) en un
 * efecto y se renderiza vía `dangerouslySetInnerHTML`. Antes de que resuelva el
 * saneo (o si falla) → copy vacío (fail-closed). El consumidor ya fuerza
 * `target="_blank" rel="noopener noreferrer"` en los `<a>` (helper `forceBlankLinks`
 * del organism); acá solo saneamos.
 *
 * ## Props
 * @param {Object} props
 * @param {string} [props.id] - id estable del opt-in (data-attr, NO PII).
 * @param {string} [props.title=''] - título de la fila (i18n del consumidor).
 * @param {string} [props.copyHtml=''] - copy HTML (puede traer `<a>`); se sanea.
 * @param {boolean} [props.checked=false] - estado del switch.
 * @param {(next:boolean)=>void} [props.onChange] - cambio inmediato con el valor nuevo.
 * @param {boolean} [props.disabled=false] - deshabilitado (switch bloqueado).
 * @param {Object} [props.rest] - otras props válidas.
 */
export const OptInItem = ({
  id,
  title = '',
  copyHtml = '',
  checked = false,
  onChange,
  disabled = false,
  ...rest
}) => {
  const [safeHtml, setSafeHtml] = useState('');

  useEffect(() => {
    let active = true;
    if (!copyHtml) { setSafeHtml(''); return undefined; }
    sanitizeHTMLAsync(copyHtml, OPTIN_SANITIZE)
      .then((clean) => { if (active) setSafeHtml(clean); })
      .catch(() => { if (active) setSafeHtml(''); });
    return () => { active = false; };
  }, [copyHtml]);

  return html`
    <div
      class="flex items-start justify-between gap-4 w-full rounded-2xl bg-[var(--bg-card-lighter)] border border-[var(--border-stroke-default)] p-4 md:p-5"
      data-name="opt-in-item"
      data-optin-id=${id || null}
      ...${rest}
    >
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-base font-bold text-[var(--text-normal-primary)]">${title}</span>
        ${safeHtml && html`
          <span
            class="text-sm leading-normal text-[var(--text-normal-secondary)] [&_a]:text-[var(--text-link-default)] [&_a]:underline"
            dangerouslySetInnerHTML=${{ __html: safeHtml }}
          ></span>
        `}
      </div>
      <div class="shrink-0 pt-0.5">
        <${Switch} checked=${checked} onChange=${onChange} disabled=${disabled} ariaLabel=${title} />
      </div>
    </div>
  `;
};

export default OptInItem;
