import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { loadMembersLabels, getMembersLabelsSync } from '../../../scripts/services/members/members-i18n.js';

/**
 * Hook: labels i18n de Members del idioma actual. Render inmediato con el fallback
 * síncrono y, cuando carga el spreadsheet, actualiza al texto autorado.
 * @returns {{signIn:string, logout:string, account:string, profileTooltip:string}}
 */
export function useMembersLabels() {
  const [labels, setLabels] = useState(getMembersLabelsSync);
  useEffect(() => {
    let active = true;
    loadMembersLabels().then((l) => { if (active) setLabels(l); });
    return () => { active = false; };
  }, []);
  return labels;
}

export default useMembersLabels;
