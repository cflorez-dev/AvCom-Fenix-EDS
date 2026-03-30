const RTE_LAB_QUERY_PARAM = 'rte-lab';
const RTE_LAB_ALWAYS_ON_VALUES = new Set(['1', 'true', 'all', '*']);
const rteLabObservers = new WeakMap();

function isAuthorEnvironment() {
  return !!(
    window.xwalk?.isAuthorEnv
    || window.hlx?.aue
    || document.querySelector('meta[name="urn:auecon:aemconnection"]')
  );
}

function getRteLabQueryValue() {
  return new URLSearchParams(window.location.search).get(RTE_LAB_QUERY_PARAM)?.trim().toLowerCase() || '';
}

export function isRteLabEnabled(componentName = '') {
  if (!isAuthorEnvironment()) return false;

  const queryValue = getRteLabQueryValue();
  if (!queryValue) return false;
  if (RTE_LAB_ALWAYS_ON_VALUES.has(queryValue)) return true;
  if (!componentName) return true;

  return queryValue
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .includes(componentName.toLowerCase());
}

function applyFilterToRichtextTargets(root, filterId) {
  let applied = false;

  root.querySelectorAll('[data-aue-type="richtext"]').forEach((element) => {
    element.dataset.aueFilter = filterId;
    applied = true;
  });

  if (applied) return true;

  root.querySelectorAll('[data-richtext-prop]').forEach((element) => {
    element.dataset.richtextFilter = filterId;
    applied = true;
  });

  return applied;
}

export function applyRteLabFilter(root, { componentName, filterId }) {
  if (!root || !filterId || !isRteLabEnabled(componentName)) return false;

  const applyFilter = () => {
    const applied = applyFilterToRichtextTargets(root, filterId);
    if (applied) root.dataset.rteLabFilter = filterId;
    return applied;
  };

  if (applyFilter()) return true;

  if (rteLabObservers.has(root)) return false;

  const observer = new MutationObserver(() => {
    if (applyFilter()) {
      observer.disconnect();
      rteLabObservers.delete(root);
    }
  });

  rteLabObservers.set(root, observer);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-aue-type', 'data-richtext-prop'],
  });

  window.setTimeout(() => {
    if (rteLabObservers.get(root) === observer) {
      observer.disconnect();
      rteLabObservers.delete(root);
    }
  }, 5000);

  return false;
}
