import { h } from '@dropins/tools/preact.js';
import { useState, useCallback } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SegmentedControl } from '../../atoms/segmented-control/segmented-control.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import {
  TAB_DATA,
  TAB_PAYMENTS,
  TAB_SETTINGS,
  DEFAULT_TAB,
  paramToTab,
  tabToParam,
} from './members-account-tabs.logic.js';

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
 * Tab activa inicial derivada de la URL (`?tab=`) normalizada. La usa el organism
 * `MembersAccount` para elegir el estado inicial ANTES de montar
 * `MembersAccountTabs` (una sola fuente de verdad).
 * @param {object} [labels]  labels account del locale (getAccountLabelsSync/loadAccountLabels)
 * @param {string} [paramName]
 * @returns {'data'|'payments'|'settings'}
 */
export const getInitialTab = (labels = {}, paramName = DEFAULT_PARAM_NAME) => (
  paramToTab(readParam(paramName), labels)
);

/**
 * MembersAccountTabs — barra de tabs "Datos | Pagos | Ajustes" con deep-linking
 * (1279360). Espejo de `MembersTabs` (elite) para 3 tabs.
 *
 * Compone el átomo `SegmentedControl` (roles tablist/tab, teclado, a11y) en size
 * `md` (Compact 44, como los mocks 1056:32312) + `fluidMinW` + `scrollable`
 * (overflow mobile con labels FR largos sin truncar):
 *  - Inicializa la tab activa desde `?tab=` (cualquier idioma → key interna).
 *  - Al cambiar de tab actualiza SOLO el query param vía `history.replaceState`
 *    (sin recargar, preservando path/otros params/hash; no ensucia el historial).
 *  - Renderiza UN `role="tabpanel"` (el de la tab activa) con `panels[activeTab]`.
 *
 * El valor de `?tab=` SIEMPRE se normaliza contra la whitelist (`paramToTab`);
 * nunca se inyecta el string crudo al DOM. En el mount NO se reescribe la URL
 * (se preserva el link entrante); solo ante interacción del usuario.
 *
 * ## Props
 * - `panels`: `{ data, payments, settings }` – contenido por tab (slot).
 * - `labels`: labels account (`getAccountLabelsSync`/`loadAccountLabels`). Default sync.
 * - `paramName`: nombre del query param (default `'tab'`).
 * - `idBase`: prefijo de ids tab↔tabpanel (default `'members-account-tabs'`).
 * - `onTabChange`: `(tabKey) => void` – notifica el cambio al organism.
 */
export const MembersAccountTabs = ({
  panels = {},
  labels = getAccountLabelsSync(),
  paramName = DEFAULT_PARAM_NAME,
  idBase = 'members-account-tabs',
  onTabChange,
} = {}) => {
  const [active, setActive] = useState(() => paramToTab(readParam(paramName), labels));

  const syncUrl = useCallback((tabKey) => {
    try {
      if (typeof window === 'undefined' || !window.history || !window.location) return;
      const url = new URL(window.location.href);
      url.searchParams.set(paramName, tabToParam(tabKey, labels));
      window.history.replaceState(window.history.state, '', url);
    } catch (e) { /* no-op: la tab activa ya cambió en el estado */ }
  }, [labels, paramName]);

  const handleChange = useCallback((tabKey) => {
    setActive(tabKey);
    syncUrl(tabKey);
    if (onTabChange) onTabChange(tabKey);
  }, [syncUrl, onTabChange]);

  const options = [
    { key: TAB_DATA, label: labels.tabData || 'Datos' },
    { key: TAB_PAYMENTS, label: labels.tabPayments || 'Pagos' },
    { key: TAB_SETTINGS, label: labels.tabSettings || 'Ajustes' },
  ];

  const activeTab = options.some((o) => o.key === active) ? active : DEFAULT_TAB;

  return html`
    <div class="members-account-tabs flex flex-col gap-8" data-name="members-account-tabs">
      ${/* Toggle centrado (mocks 1056:32312). */ ''}
      <div class="flex justify-center">
        <${SegmentedControl}
          options=${options}
          value=${activeTab}
          onChange=${handleChange}
          ariaLabel=${labels.tabsAriaLabel || ''}
          idBase=${idBase}
          fluidMinW=${true}
          scrollable=${true}
        />
      </div>
      <div
        role="tabpanel"
        id=${`${idBase}-panel-${activeTab}`}
        aria-labelledby=${`${idBase}-tab-${activeTab}`}
        tabindex="0"
        class="members-account-tabs__panel"
      >
        ${panels[activeTab] ?? null}
      </div>
    </div>
  `;
};

export default MembersAccountTabs;
