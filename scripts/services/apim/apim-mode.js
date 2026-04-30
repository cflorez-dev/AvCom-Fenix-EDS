import { fetchAEMData } from '../../utils/aem-data.js';

const FLAG_KEY = 'AV_APIM_DIRECT_MODE';
let modeCache = null;

export const isApimDirectMode = async () => {
  if (modeCache !== null) return modeCache;
  const config = await fetchAEMData('environment');
  const rows = Array.isArray(config?.data) ? config.data : [];
  const value = rows.find((r) => r?.Key?.trim?.() === FLAG_KEY)?.Text?.trim?.();
  modeCache = value === 'true';
  return modeCache;
};

export const resetApimModeCache = () => {
  modeCache = null;
};
