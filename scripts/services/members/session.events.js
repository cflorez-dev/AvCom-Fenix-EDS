/**
 * Contrato de eventos del sistema Members (FROZEN — lo consumen 1255354/1255338/1255576).
 * @typedef {'members/login-success'
 *  |'members/logout'
 *  |'members/session-expired'
 *  |'members/session-changed'} MembersEvent
 */
export const MEMBERS_EVENTS = {
  LOGIN_SUCCESS: 'members/login-success',
  LOGOUT: 'members/logout',
  SESSION_EXPIRED: 'members/session-expired',
  SESSION_CHANGED: 'members/session-changed',
};

// cross-tab: BroadcastChannel DEDICADO (1255576 — desvío registrado del plan).
// Antes usábamos `@dropins/tools/event-bus.js`, pero ese bus filtra por un `_identifier`
// ALEATORIO POR PESTAÑA y descarta los mensajes de otras tabs → NO entrega cross-tab
// (verificado en runtime: el emit de tab A nunca llegaba a tab B). Usamos un canal propio
// que sí cruza pestañas. Nota del estándar: BroadcastChannel NO entrega al objeto que EMITE,
// así que la propia tab no reacciona a su evento (correcto: ya actualizó su estado local
// o navega por la página-puente; las OTRAS tabs sí reciben y re-hidratan/limpian).
const CHANNEL_NAME = 'avianca/members';
const lastPayload = {};
let channel = null;
/** Canal único y perezoso. null si el browser no soporta BroadcastChannel (degrada a rehydrate). */
const getChannel = () => {
  if (channel) return channel;
  if (typeof BroadcastChannel === 'undefined') return null;
  channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
};

export const emitCrossTab = (event, payload = {}) => {
  lastPayload[event] = payload;
  const ch = getChannel();
  if (ch) ch.postMessage({ event, payload });
};

export const onCrossTab = (event, cb, opts) => {
  if (opts?.eager && event in lastPayload) cb(lastPayload[event]);
  const ch = getChannel();
  if (!ch) return { off() { /* no-op: sin BroadcastChannel */ } };
  const listener = ({ data }) => { if (data && data.event === event) cb(data.payload); };
  ch.addEventListener('message', listener);
  return { off() { ch.removeEventListener('message', listener); } };
};

// same-tab (CustomEvent on window) — late subscribers: patrón window-last-value (1255354)
export const emit = (event, detail = {}) => window.dispatchEvent(
  new CustomEvent(event, { detail, bubbles: true, composed: true }),
);
export const on = (event, cb) => window.addEventListener(event, cb);
