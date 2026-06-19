/**
 * Geo Conflict Modal Service
 *
 * PBI 1216373 — "Cookies - Modal de Conflicto POS". Invoked post-render
 * (from loadLazy). Reads the `geo-conflict` tag left by `resolvePOS()`
 * when the cookie POS doesn't match the geo-resolved POS, then prompts
 * the user to decide.
 *
 * Shown ONCE per user (not per session). Decision persists in
 * `localStorage.geo-conflict-dismissed`.
 *
 * Copy: loaded from AEM i18n sheets (/es.json, /en.json, /pt.json, /fr.json).
 * Expected keys:
 *   - geoConflictModal.title              "Estás en el sitio de {country}"
 *   - geoConflictModal.description        "Cambia a {country} para ver…"
 *   - geoConflictModal.primaryButton      "Ir a {country}"
 *   - geoConflictModal.secondaryButton    "Continuar en {country}"
 *   - geoConflictModal.imageUrl           (optional — asset path)
 *   - geoConflictModal.imageAlt           (optional)
 *
 * The `{country}` placeholder is interpolated with the localized country
 * name resolved from the AEM `countrieslist` spreadsheet (same data used
 * by the header).
 */

import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { fetchAEMData } from '../../utils/aem-data.js';
import {
  getStoredCountry,
  getStoredLanguage,
  setStoredCountry,
} from '../header/language-country-selector.js';
import { ensurePOSDataLoaded } from '../header/get-pos-data.js';
import { GeoConflictModal } from '../../../design-system/molecules/geo-conflict-modal/geo-conflict-modal.js';

const html = htm.bind(h);

const CONFLICT_SESSION_KEY = 'geo-conflict';
/**
 * Per-POS dismissal list (PBI 8.4 — LATAM-style behavior).
 * Stores an array of cookie-POS codes the user has explicitly decided to
 * "continue on" this session. When the user changes to a different POS, the
 * modal reappears because that POS isn't in the list yet.
 *
 * Storage: `sessionStorage` (not localStorage) — same approach as
 * latamairlines.com (`_xp_user_country_suggestion_{from}_to_{to}`). The
 * list auto-clears when the browser tab closes, so the site never "remembers"
 * a dismissal from days/weeks ago.
 */
const DISMISSED_SS_KEY = 'geo-conflict-dismissed-poses';
const NEAREST_AIRPORT_KEY = 'geo-nearest-airport';
const INITIAL_DETECTED_POS_KEY = 'initial-detected-pos';
const POS_CHANGE_EVENT = 'pos-storage-change';
const MODAL_CONTAINER_ID = 'geo-conflict-modal-root';

/**
 * Static image URL for the modal illustration.
 * Kept as a constant (not in i18n) because the asset is the same across
 * all languages — only the `imageAlt` text changes per language.
 * To move this to AEM config in the future, swap for a key like
 * `AV_GEO_CONFLICT_IMAGE` in `environment.json`.
 */
const MODAL_IMAGE_URL = '/assets/samples/take_off_icon.png';

const I18N_KEYS = {
  title: 'geoConflictModal.title',
  description: 'geoConflictModal.description',
  primaryButton: 'geoConflictModal.primaryButton',
  secondaryButton: 'geoConflictModal.secondaryButton',
  imageAlt: 'geoConflictModal.imageAlt',
};

function interpolate(template, values) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, k) => (
    values[k] !== undefined ? String(values[k]) : `{${k}}`
  ));
}

/**
 * Load modal copy from the AEM i18n sheet for the current language.
 * Source of truth: `/{language}.json` sheets with keys `geoConflictModal.*`.
 * If a key is missing in AEM, the corresponding field returns '' (empty
 * string) — the modal will render blank for that field, which is a visible
 * signal to the content author that the translation is missing.
 */
async function loadI18nCopy(language) {
  const lang = (language || 'es').toLowerCase();
  let rows = [];
  try {
    const payload = await fetchAEMData(lang);
    rows = payload?.data || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`[geo-conflict-modal.service] i18n sheet /${lang}.json load failed:`, error);
  }
  const getRow = (key) => rows.find((r) => r?.Key === key)?.Text?.trim() || '';

  return {
    title: getRow(I18N_KEYS.title),
    description: getRow(I18N_KEYS.description),
    primaryButton: getRow(I18N_KEYS.primaryButton),
    secondaryButton: getRow(I18N_KEYS.secondaryButton),
    imageAlt: getRow(I18N_KEYS.imageAlt),
  };
}

async function resolveCountryLabel(isoCode) {
  if (!isoCode) return '';
  try {
    const posData = await ensurePOSDataLoaded();
    const match = Object.values(posData || {})
      .find((entry) => entry?.keyIso === isoCode.toLowerCase());
    return match?.label || isoCode.toUpperCase();
  } catch (error) {
    return isoCode.toUpperCase();
  }
}

function readConflictState() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CONFLICT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geo-conflict-modal.service] conflict read failed:', error);
    return null;
  }
}

function clearConflictState() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(CONFLICT_SESSION_KEY);
  } catch (_) { /* ignore */ }
}

function getDismissedPoses() {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(DISMISSED_SS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function isPosDismissed(pos) {
  if (!pos) return false;
  return getDismissedPoses().includes(String(pos).toLowerCase());
}

function persistDismissalForPos(pos) {
  if (!pos) return;
  if (typeof sessionStorage === 'undefined') return;
  try {
    const current = getDismissedPoses();
    const normalized = String(pos).toLowerCase();
    if (!current.includes(normalized)) {
      sessionStorage.setItem(DISMISSED_SS_KEY, JSON.stringify([...current, normalized]));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geo-conflict-modal.service] per-POS dismissal persist failed:', error);
  }
}

function getModalContainer() {
  let container = document.getElementById(MODAL_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = MODAL_CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

function unmountModal(container) {
  if (container) render(null, container);
}

/**
 * Show the geo conflict modal if there is a pending conflict and the user
 * hasn't dismissed it. Idempotent and safe to call multiple times.
 *
 * @returns {Promise<boolean>} true if the modal was rendered, false otherwise
 */
export async function maybeShowGeoConflictModal() {
  const state = readConflictState();
  if (!state || !state.cookiePos || !state.geoPos) return false;
  if (state.cookiePos === state.geoPos) return false;

  // PBI 8.4 (LATAM-style): if the user already clicked "Continue on X" for
  // the current POS in this tab, don't show the modal again until they
  // switch to a different POS or open a new tab.
  if (isPosDismissed(state.cookiePos)) return false;

  // Safety: only show when cookie actually matches the tagged cookiePos. If the
  // user changed POS manually in the header between pages, the tag is stale.
  const currentCookie = (getStoredCountry() || '').toLowerCase();
  if (currentCookie !== state.cookiePos) {
    clearConflictState();
    return false;
  }

  const language = (getStoredLanguage() || 'es').toLowerCase();

  const [copy, cookieLabel, geoLabel] = await Promise.all([
    loadI18nCopy(language),
    resolveCountryLabel(state.cookiePos),
    resolveCountryLabel(state.geoPos),
  ]);

  const container = getModalContainer();

  const handlePrimary = () => {
    // User chose the geo POS → switch cookie and reload so all components
    // re-render. No need to persist dismissal: after the reload the user is
    // IN the geo POS, so there's no conflict anymore.
    setStoredCountry(state.geoPos);
    clearConflictState();
    unmountModal(container);
    window.location.reload();
  };

  const handleSecondary = () => {
    // PBI 8.4 (LATAM-style): user chose to stay on their current POS →
    // remember this POS as dismissed so the modal doesn't reappear while
    // the user navigates within this tab. If they switch to a different
    // POS later, the modal will reappear (new entry in the list).
    persistDismissalForPos(state.cookiePos);
    clearConflictState();
    unmountModal(container);
  };

  const modalVNode = html`
    <${GeoConflictModal}
      isOpen=${true}
      title=${interpolate(copy.title, { country: cookieLabel })}
      description=${interpolate(copy.description, { country: geoLabel })}
      primaryButtonLabel=${interpolate(copy.primaryButton, { country: geoLabel })}
      secondaryButtonLabel=${interpolate(copy.secondaryButton, { country: cookieLabel })}
      imageUrl=${MODAL_IMAGE_URL}
      imageAlt=${copy.imageAlt}
      onPrimary=${handlePrimary}
      onSecondary=${handleSecondary}
    />
  `;
  render(modalVNode, container);
  return true;
}

/**
 * Read the nearest-airport hint left by a previous successful
 * triangulation (only populated when Level 2 resolved without conflict).
 */
function readNearestAirport() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(NEAREST_AIRPORT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

/**
 * Read the system-detected POS fallback (Accept-Language based when
 * W3C wasn't granted). Used by the manual-POS-change listener so that
 * the modal can fire even for users who never accepted the geo prompt.
 * @returns {string|null} ISO 2-letter country code, e.g. 'co'
 */
function readInitialDetectedPos() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(INITIAL_DETECTED_POS_KEY);
    return value ? String(value).toLowerCase() : null;
  } catch (_) { return null; }
}

let posChangeListenerAttached = false;

/**
 * Wire up the "manual POS change dispatches a new modal" behavior.
 *
 * PBI rule (Comportamiento por Componente — Header):
 *   "Al cambiar POS: dispara nuevo ciclo completo de resolución"
 *
 * Reference UX: latamairlines.com — every time the user picks a different
 * country in the header, a confirmation modal offers to switch to their
 * detected location.
 *
 * Implementation notes:
 * - We DO NOT re-request W3C geolocation here (would be intrusive UX).
 * - We reuse the `geo-nearest-airport` snapshot from the initial
 *   triangulation. If the user never granted geo permission, this listener
 *   is a no-op (no geo data to compare against).
 * - Idempotent: safe to call multiple times; only attaches once.
 */
export function registerManualPosChangeListener() {
  if (posChangeListenerAttached) return;
  if (typeof window === 'undefined') return;
  posChangeListenerAttached = true;

  window.addEventListener(POS_CHANGE_EVENT, async () => {
    // Prefer the precise W3C snapshot when available; fall back to the
    // Accept-Language POS so the modal still fires for users who never
    // granted geo permission.
    //
    // IMPORTANT: read `pos` (cookie-format POS code, e.g. 'EU' for Spain)
    // not `iataCountryCode` (ISO 3166, e.g. 'ES'). The cookie and the
    // newCookie comparison below use the POS-code vocabulary. Reading
    // iataCountryCode would always mismatch for umbrella POSes — every
    // country in the EU bucket (ES, IT, DE, NL, PT, …) has its own ISO
    // code but shares POS='EU', and that mismatch was writing a phantom
    // conflict {cookiePos:'eu', geoPos:'es'} on every cookie change in
    // those markets, causing the modal to reappear after the user
    // accepted "Ir a Europa". See `docs/pbi-1216373-geo-conflict-modal-loop.md`.
    const nearest = readNearestAirport();
    const geoCountry = nearest?.pos?.toLowerCase()
      || readInitialDetectedPos();
    if (!geoCountry) return; // No detection signal at all

    const newCookie = (getStoredCountry() || '').toLowerCase();
    // Normalize catalog quirk: 'uk' maps to ISO 'gb' for cookie parity
    const normalizedGeo = geoCountry === 'uk' ? 'gb' : geoCountry;
    const normalizedCookie = newCookie === 'gb' ? 'gb' : newCookie;

    // No conflict if the user just picked the same POS as their detected location
    if (!newCookie || normalizedGeo === normalizedCookie) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(CONFLICT_SESSION_KEY);
      }
      return;
    }

    // Tag the new conflict so `maybeShowGeoConflictModal` picks it up on the
    // next page load. We intentionally do NOT render the modal here: a manual
    // POS change always triggers a redirect/reload (see `navigateToPOS` in
    // language-country-selector.js), and rendering the modal synchronously
    // against the old page causes a visible flash of the wrong POS context
    // before the redirect completes. Letting `loadLazy` on the next page
    // surface the modal ensures it appears over the already-switched page.
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(CONFLICT_SESSION_KEY, JSON.stringify({
          cookiePos: newCookie,
          geoPos: geoCountry,
          geoAto: nearest?.iataCityCode || '',
        }));
      } catch (_) { /* ignore */ }
    }
  });
}

export default maybeShowGeoConflictModal;
