import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { loadMembersMenuItems, getMembersMenuItemsSync } from '../../../scripts/services/members/members-config.js';

/**
 * Hook: items del drawer Members (CF "Members Config" → `menuItems[]`).
 *
 * Render-immediate: primer paint usa el fallback síncrono
 * (`getMembersMenuItemsSync`, basado en `DEFAULT_MENU_ITEMS` por idioma) para
 * que el usuario VEA el listado al instante al abrir el drawer. En paralelo
 * dispara `loadMembersMenuItems()` que fetcha el CF; cuando resuelve,
 * sobreescribe el state y la UI re-renderiza con los items del autor.
 *
 * Mismo patrón que `useMembersConfig` / `useMembersLabels`.
 *
 * @returns {Array<{key:string,label:string,icon:string,link:string|null,
 *  linkType:'internal'|'external',visible:boolean,isLogout:boolean,sortOrder:number}>}
 */
export function useMembersMenuItems() {
  const [items, setItems] = useState(getMembersMenuItemsSync);
  useEffect(() => {
    let active = true;
    loadMembersMenuItems().then((next) => {
      if (active && Array.isArray(next)) setItems(next);
    });
    return () => { active = false; };
  }, []);
  return items;
}

export default useMembersMenuItems;
