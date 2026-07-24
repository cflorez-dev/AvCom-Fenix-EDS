import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { loadMembersConfig, getMembersConfigSync } from '../../../scripts/services/members/members-config.js';

/**
 * Hook: config de Members del app (loginMode, logout, env, etc.).
 * Render inmediato con el fallback síncrono y, cuando carga el CF, actualiza.
 * @returns {{loginMode:string, logout:{show:boolean, icon:string, redirectTo:string}, ...}}
 */
export function useMembersConfig() {
  const [config, setConfig] = useState(getMembersConfigSync);
  useEffect(() => {
    let active = true;
    loadMembersConfig().then((c) => { if (active) setConfig(c); });
    return () => { active = false; };
  }, []);
  return config;
}

export default useMembersConfig;
