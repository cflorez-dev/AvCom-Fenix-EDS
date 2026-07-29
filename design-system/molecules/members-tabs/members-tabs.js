import { h } from '@dropins/tools/preact.js';
import { useState, useCallback } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SegmentedControl } from '../../atoms/segmented-control/segmented-control.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import {
  TAB_PROGRESS,
  TAB_BENEFITS,
  DEFAULT_TAB,
  paramToTab,
  tabToParam,
} from './members-tabs.logic.js';

const html = htm.bind(h);

const DEFAULT_PARAM_NAME = 'tab';

/** Lee el valor crudo del query param `paramName` de la URL actual (fail-soft). */
const readParam = (paramName) => {
  try {
    if (typeof window === 'undefined' || !window.location) return null;
    return new URLSearchParams(window.location.search).get(paramName);
  } catch (e) {
    return null;
  }
};

/**
 * Tab activa inicial derivada de la URL (`?tab=`) normalizada. La usa el
 * organism `MembersElite` para elegir la variante del skeleton ANTES de montar
 * `MembersTabs`, garantizando una sola fuente de verdad para el valor inicial.
 * @param {object} [labels]  labels elite del locale (getEliteLabelsSync/loadEliteLabels)
 * @param {string} [paramName]
 * @returns {'progress'|'benefits'}
 */
export const getInitialTab = (labels = {}, paramName = DEFAULT_PARAM_NAME) => (
  paramToTab(readParam(paramName), labels)
);

/**
 * MembersTabs — barra de tabs "Progreso | Beneficios" con deep-linking (1271689).
 *
 * Compone el átomo `SegmentedControl` (roles tablist/tab, teclado, a11y) y:
 *  - Inicializa la tab activa desde `?tab=` (cualquier idioma → key interna).
 *  - Al cambiar de tab actualiza SOLO el query param vía `history.replaceState`
 *    (sin recargar, preservando path/otros params/hash; no ensucia el historial).
 *  - Renderiza UN `role="tabpanel"` (el de la tab activa) con el contenido del
 *    slot correspondiente (`panels[activeTab]`), asociado por id al tab activo.
 *
 * El valor de `?tab=` SIEMPRE se normaliza contra la whitelist (`paramToTab`);
 * nunca se inyecta el string crudo al DOM. En el mount NO se reescribe la URL
 * (se preserva el link entrante); solo se reescribe ante interacción del usuario.
 *
 * ## Props
 * - `panels`: `{ progress: vnode, benefits: vnode }` – contenido por tab (slot).
 * - `labels`: labels elite (`getEliteLabelsSync`/`loadEliteLabels`). Default sync.
 * - `paramName`: nombre del query param (default `'tab'`).
 * - `idBase`: prefijo de ids para la asociación tab↔tabpanel (default `'members-elite-tabs'`).
 * - `onTabChange`: `(tabKey) => void` – notifica el cambio (para que el organism
 *   refleje la tab activa).
 */
export const MembersTabs = ({
  panels = {},
  labels = getEliteLabelsSync(),
  paramName = DEFAULT_PARAM_NAME,
  idBase = 'members-elite-tabs',
  benefitsEnabled = true,
  onTabChange,
} = {}) => {
  // 1271694 aún no va: el organism pasa `benefitsEnabled=false` para dejar la tab
  // "Beneficios" deshabilitada. Data-driven (flag del CF) → se prende sin deploy.
  const benefitsDisabled = !benefitsEnabled;
  const [active, setActive] = useState(() => {
    const t = paramToTab(readParam(paramName), labels);
    // Deep-link `?tab=benefits` con la tab deshabilitada → caer a Progreso.
    return (benefitsDisabled && t === TAB_BENEFITS) ? TAB_PROGRESS : t;
  });

  const syncUrl = useCallback((tabKey) => {
    try {
      if (typeof window === 'undefined' || !window.history || !window.location) return;
      const url = new URL(window.location.href);
      url.searchParams.set(paramName, tabToParam(tabKey, labels));
      window.history.replaceState(window.history.state, '', url);
    } catch (e) { /* no-op: la tab activa ya cambió en el estado */ }
  }, [labels, paramName]);

  const handleChange = useCallback((tabKey) => {
    if (benefitsDisabled && tabKey === TAB_BENEFITS) return;
    setActive(tabKey);
    syncUrl(tabKey);
    if (onTabChange) onTabChange(tabKey);
  }, [syncUrl, onTabChange, benefitsDisabled]);

  const options = [
    { key: TAB_PROGRESS, label: labels.tabProgress || 'Progreso' },
    { key: TAB_BENEFITS, label: labels.tabBenefits || 'Beneficios', disabled: benefitsDisabled },
  ];

  const activeTab = (active === TAB_BENEFITS && !benefitsDisabled) ? TAB_BENEFITS : DEFAULT_TAB;

  return html`
    <div class="members-tabs flex flex-col gap-6" data-name="members-tabs">
      ${/* Toggle centrado (Figma 765-42338/42380 y skeletons 883-*). */ ''}
      <div class="flex justify-center">
        <${SegmentedControl}
          options=${options}
          value=${activeTab}
          onChange=${handleChange}
          ariaLabel=${labels.tabsAriaLabel || ''}
          idBase=${idBase}
        />
      </div>
      <div
        role="tabpanel"
        id=${`${idBase}-panel-${activeTab}`}
        aria-labelledby=${`${idBase}-tab-${activeTab}`}
        tabindex="0"
        class="members-tabs__panel"
      >
        ${panels[activeTab] ?? null}
      </div>
    </div>
  `;
};

export default MembersTabs;
