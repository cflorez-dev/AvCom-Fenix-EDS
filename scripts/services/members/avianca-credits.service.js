/**
 * Avianca Credits service — módulo INFORMATIVO del tab Wallet (1279362).
 *
 * ⚠️ CONTRATO MOCK PARA AVIANCA IT (D2/D15/D27). Hoy NO existe wrapper de LM
 * para AV Credits: la llave técnica del socio será su correo (D2). Mientras el
 * servicio real no exista, este módulo se maqueta con una fixture local (visible
 * en qa, D27) y todo dato queda marcado `mock: true` para que nunca se confunda
 * con producción. El kill-switch `wallet.mockFallback` (CF `walletMockFallback`)
 * apaga el fixture sin deploy → el módulo se OCULTA.
 *
 * ── Contrato esperado del futuro servicio real (para IT) ──────────────────────
 * Request:  llave técnica = correo del socio (LM). Params de POS/locale opcionales.
 * Response (shape que este servicio proyecta, `raw.credits[]`):
 *   {
 *     credits: [{
 *       maskedNumber: string,   // número enmascarado, p.ej. "••••••••8901"
 *       type: string,           // "Reembolsable" | "No reembolsable" | …
 *       state: 'active'|'no-balance'|'cancelled',
 *       currency: string,       // ISO, p.ej. "COP" (condicional en el render)
 *       initialBalance: number, // saldo inicial (unidades de `currency`)
 *       balance: number,        // saldo actual
 *       holderName: string,     // titular (puede exceder 1 línea → clamp 2 líneas)
 *       issueDate: string,      // fecha de expedición (ISO o pre-formateada)
 *       expiryDate: string      // fecha de vencimiento
 *     }]
 *   }
 * El VM devuelto NO agrega PII nueva: solo re-expone lo que ya trae el contrato.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FIXTURE_PATH = '/tests/fixtures/members/account/avianca-credits.json';

/** Estados válidos + orden de presentación (activos primero, cancelados al final). */
export const AVC_STATES = ['active', 'no-balance', 'cancelled'];
const STATE_ORDER = { active: 0, 'no-balance': 1, cancelled: 2 };

const UNAVAILABLE_VM = { state: 'unavailable', credits: [], mock: false };

/** Normaliza el string de estado del contrato a las 3 claves canónicas. */
const normalizeState = (raw) => {
  const s = String(raw || '').toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'active' || s === 'activo') return 'active';
  if (s === 'no-balance' || s === 'nobalance' || s === 'sin-saldo') return 'no-balance';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelado') return 'cancelled';
  return 'active'; // desconocido → visible como activo (fail-soft, no se pierde el crédito)
};

/**
 * Proyecta la respuesta cruda del contrato al VM de la sección AV Credits.
 * Ordena por estado (active → no-balance → cancelled). Shape malformado → [].
 * @param {object|null} raw respuesta del contrato (`{credits:[...]}`)
 * @returns {{maskedNumber:string,type:string,state:string,currency:string|null,
 *   initialBalance:number|null,balance:number|null,holderName:string,
 *   issueDate:string,expiryDate:string}[]}
 */
export const toAviancaCreditsVM = (raw) => {
  let list = [];
  if (Array.isArray(raw?.credits)) list = raw.credits;
  else if (Array.isArray(raw)) list = raw;
  return list
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
      return {
        maskedNumber: String(c.maskedNumber || ''),
        type: String(c.type || ''),
        state: normalizeState(c.state),
        currency: c.currency ? String(c.currency) : null,
        initialBalance: num(c.initialBalance),
        balance: num(c.balance),
        holderName: String(c.holderName || ''),
        issueDate: String(c.issueDate || ''),
        expiryDate: String(c.expiryDate || ''),
      };
    })
    .sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9));
};

/**
 * Carga los AV Credits del socio. Fail-soft total: cualquier fallo → `unavailable`
 * (el módulo se oculta, nunca muestra credits inventados sin marca).
 *
 * @param {object} [opts]
 * @param {boolean} [opts.mockFallback=true] kill-switch (CF `walletMockFallback`).
 *   `false` → `unavailable` sin tocar la red (no hay wrapper real todavía).
 * @param {Function} [opts.fetchImpl] override de `fetch` (tests/samples).
 * @returns {Promise<{state:('ready'|'unavailable'), credits:object[], mock:boolean}>}
 */
export async function loadAviancaCredits({
  mockFallback = true,
  // arrow para no desanclar fetch de window (llamarlo suelto lanza Illegal invocation)
  fetchImpl = (typeof fetch === 'function' ? ((...a) => fetch(...a)) : null),
} = {}) {
  // Kill-switch (o navegador sin fetch) → no hay servicio real → unavailable.
  if (mockFallback === false || typeof fetchImpl !== 'function') {
    return { ...UNAVAILABLE_VM };
  }
  try {
    const codeBasePath = (typeof window !== 'undefined' && window.hlx?.codeBasePath) || '';
    // Concatenación directa (patrón del fallback del catálogo): buildAssetPath
    // colapsaba el // del protocolo → "https:/host/..." → 404 (visto en qa).
    const url = `${codeBasePath}${FIXTURE_PATH}`;
    const res = await fetchImpl(url);
    if (!(res instanceof Response) || !res.ok) return { ...UNAVAILABLE_VM };
    const json = await res.json();
    const credits = toAviancaCreditsVM(json);
    if (!credits.length) return { ...UNAVAILABLE_VM };
    return { state: 'ready', credits, mock: true };
  } catch (e) {
    return { ...UNAVAILABLE_VM }; // fail-soft
  }
}

export default { loadAviancaCredits, toAviancaCreditsVM };
