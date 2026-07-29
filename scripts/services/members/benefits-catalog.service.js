import { whenLmReady } from './lm-script.loader.js';

/**
 * Benefits catalog service — catálogo de beneficios por estatus del socio
 * (1271693, bloque 9). Slot ① de la tab Beneficios.
 *
 * MODELO DE VALOR (rework plan A, 2026-07-17 — sigue el componente BenefitsCards
 * de Figma, NO el "chip + descripción" de la 1ª maqueta). Cada categoría es una
 * card con FILAS de sub-beneficio (label → valor). El valor es TIPADO para pintar
 * los 3 estados del board "Estados contadores":
 *   `{ kind: 'count'|'unlimited'|'na'|'discount', amount?, percent? }`
 *   - count     → "N veces"      (Active — color del tier)
 *   - unlimited → "Ilimitado"    (Static — texto oscuro)
 *   - na        → "No aplica"    (Disable/0 — gris)
 *   - discount  → "X% descuento" (Active — color del tier)
 * El wording lo arma la UI con los templates i18n (`members.elite.benefits.value.*`).
 *
 * ⚠️ ORIGEN DE LOS DATOS (contradicción abierta, ver preguntas-catalogo-beneficios.md):
 * la doc del wrapper (Login Script v1.2.0 pág. 22) da UN `amount` por grupo
 * (`summarization[].detail[]`), pero el diseño muestra VARIOS sub-beneficios
 * tipados por categoría. Por eso, siguiendo la asunción del Bloque 2 (labels +
 * estructura = CONFIG de AEM; LM aporta los conteos), la ESTRUCTURA sale de
 * `cfg.benefitsCatalog.categories[].subBenefits[]` y los VALORES `count` que
 * declaren un `lmGroup` se pisan con el `amount` real de LM (merge marcado
 * `// TODO(LM)`). Cuando LM confirme el contrato de sub-beneficios, solo cambia
 * ese merge — el resto del VM/UI queda igual.
 *
 * FAIL-SOFT (igual que club-subscription.service): string `E.EON.*` / no-Response
 * / error / shape malformado ⇒ `state:'unavailable'` y la sección NO se renderiza
 * (no afirmar "sin beneficios" sin dato). El endpoint devuelve VACÍO en UAT
 * (reclamado a Fernando Pizano 2026-07-16) → todo el desarrollo consume el
 * fixture `tests/fixtures/members/elite/lm-benefits.json` (fixture-first).
 */

const UNAVAILABLE_VM = { state: 'unavailable', categories: [] };

const DEFAULT_UNLIMITED_THRESHOLD = 50;

const VALID_KINDS = new Set(['count', 'unlimited', 'na', 'discount', 'text', 'none']);

/**
 * Deriva el VALOR tipado de un contador de LM (entradas del grupo, `detail[].amount`):
 * `≥threshold` → Ilimitado · `1..threshold-1` → "N veces" · `0`/null/negativo/NaN
 * → No aplica (estado disable/gris). Solo aplica a valores tipo contador; los
 * `discount`/`unlimited` estáticos vienen de config, no de acá.
 * @param {number} amount entradas disponibles del grupo
 * @param {number} [threshold] umbral "Ilimitado" (config, default 50)
 * @returns {{kind:('count'|'unlimited'|'na'), amount?:number}}
 */
export const deriveLmValue = (amount, threshold = DEFAULT_UNLIMITED_THRESHOLD) => {
  const n = Number(amount);
  const th = Number.isFinite(Number(threshold)) ? Number(threshold) : DEFAULT_UNLIMITED_THRESHOLD;
  if (!Number.isFinite(n) || n <= 0) return { kind: 'na' };
  if (n >= th) return { kind: 'unlimited' };
  return { kind: 'count', amount: n };
};

/**
 * Normaliza el `value` declarado en config a un shape tipado seguro. Kind
 * desconocido o payload inválido → `na` (nunca rompe el render). `count` exige
 * `amount>0` y admite `suffix` string opcional (Figma Silver 765:39295, card
 * Equipaje: "1 piezas adicionales" sustituye el sufijo " de N"); `discount`
 * exige `percent>0`; `text` exige `text` string no vacío (Figma card Abordaje:
 * "Grupo B"); `unlimited`/`na` no llevan payload.
 * @param {object} v value crudo de config (`{kind, amount?, percent?, text?, suffix?}`)
 * @returns {{kind:string, amount?:number, total?:number, percent?:number,
 *   text?:string, suffix?:string}}
 */
const normalizeValue = (v) => {
  if (!v || typeof v !== 'object' || !VALID_KINDS.has(v.kind)) return { kind: 'na' };
  if (v.kind === 'count') {
    const amount = Number(v.amount);
    if (!(Number.isFinite(amount) && amount > 0)) return { kind: 'na' };
    // `total` = máximo del beneficio (Figma "12 de 12"). Cae a `amount` si falta o
    // es menor → "N de N".
    const total = Number(v.total);
    const out = { kind: 'count', amount, total: Number.isFinite(total) && total >= amount ? total : amount };
    if (typeof v.suffix === 'string' && v.suffix) out.suffix = v.suffix;
    return out;
  }
  if (v.kind === 'discount') {
    const percent = Number(v.percent);
    return Number.isFinite(percent) && percent > 0 ? { kind: 'discount', percent } : { kind: 'na' };
  }
  if (v.kind === 'text') {
    return typeof v.text === 'string' && v.text ? { kind: 'text', text: v.text } : { kind: 'na' };
  }
  return { kind: v.kind }; // unlimited | na | none
};

/** Aplana todos los `detail[]` de `summarization[]` en una sola lista de grupos. */
const collectGroups = (raw) => {
  const summ = Array.isArray(raw?.summarization) ? raw.summarization : null;
  if (!summ) return null; // shape malformado → el caller devuelve unavailable
  return summ.reduce((acc, s) => {
    const detail = Array.isArray(s?.detail) ? s.detail : [];
    return acc.concat(detail);
  }, []);
};

/**
 * Proyecta la respuesta cruda de `lmBenefits` al VM del catálogo (nuevo shape
 * BenefitsCards): la estructura de categorías + sub-beneficios sale de la config
 * (`cfg.benefitsCatalog`), y los valores `count` con `lmGroup` se pisan con el
 * `amount` real de LM (merge `// TODO(LM)`).
 *
 * @param {object|null} raw respuesta del wrapper (`{summarization:[{detail:[...]}]}`)
 * @param {object} [cfg] config del catálogo (`cfg.benefitsCatalog`):
 *   `{ unlimitedThreshold?, seeAllUrl?, termsUrl?, categories:[{ key, titleKey?,
 *   title?, eyebrow?, icon?, sortOrder?, ctaLabel?, ctaUrl?, subBenefits:[{ label,
 *   value:{kind,amount?,percent?}, lmGroup? }] }] }`.
 * @returns {{state:('ready'|'unavailable'), seeAllUrl?:string, termsUrl?:string,
 *   categories: object[]}}
 */
export const toBenefitsCatalogVM = (raw, cfg = {}, tier = '') => {
  if (!raw || typeof raw !== 'object') return { ...UNAVAILABLE_VM };
  const groups = collectGroups(raw);
  if (!groups) return { ...UNAVAILABLE_VM };

  const catalogCfg = cfg?.benefitsCatalog || {};
  const threshold = Number.isFinite(Number(catalogCfg.unlimitedThreshold))
    ? Number(catalogCfg.unlimitedThreshold)
    : DEFAULT_UNLIMITED_THRESHOLD;
  const cats = Array.isArray(catalogCfg.categories) ? catalogCfg.categories : [];

  // Índice grpId → amount DISPONIBLE de LM (el "N" del contador). LM confirmó
  // (2026-07-24) que `totalAccrual` es el acumulado HISTÓRICO de vida (NO el
  // otorgado del periodo) → NO se usa como el "de M". El máximo (M) sale de config
  // por tier (`maxByTier`, Plan B) — ver plan-contador-maximo-benefits.md. La
  // ESTRUCTURA (categorías + sub-beneficios) y el máximo salen de config; los
  // `count` con `lmGroup` toman SOLO el disponible del wrapper.
  const lmByGrp = new Map();
  groups.forEach((g) => {
    if (g && typeof g === 'object' && g.grpId != null) {
      lmByGrp.set(String(g.grpId), Number(g.amount));
    }
  });

  const categories = cats
    .map((cat) => {
      const declared = Array.isArray(cat?.subBenefits) ? cat.subBenefits : [];
      const subBenefits = declared
        .map((sb) => {
          let value = normalizeValue(sb?.value);
          // Plan B (Fase 2 — valor per-tier): si el sub-beneficio declara
          // `valuesByTier` y NO mapea a un grupo LM, el valor sale de la fila del
          // TIER del socio (`{tier, kind, amount?, percent?}`); si ese tier no está
          // listado → `na` (no aplica a ese tier). Los `lmGroup` (contadores)
          // IGNORAN valuesByTier — manda el conteo de LM. Retro-compatible: sin
          // valuesByTier, se usa el `value` único de config.
          if (!sb?.lmGroup && Array.isArray(sb?.valuesByTier) && sb.valuesByTier.length) {
            const t = String(tier || '').trim().toLowerCase();
            const row = t
              ? sb.valuesByTier.find((r) => String(r?.tier || '').trim().toLowerCase() === t)
              : null;
            value = row ? normalizeValue(row) : { kind: 'na' };
          }
          // Merge LM (Plan B): el sub-beneficio `count` con `lmGroup` toma de LM
          // SOLO el `amount` (DISPONIBLE = N). El máximo (M = "de M") sale de CONFIG
          // por tier (`maxByTier`), NO de LM — `totalAccrual` es histórico de vida,
          // no el otorgado (LM 2026-07-24). Sin `maxByTier` para el tier del socio →
          // el contador queda SIN denominador (la card muestra solo el disponible).
          if (sb?.lmGroup && lmByGrp.has(String(sb.lmGroup))) {
            const lmVal = deriveLmValue(lmByGrp.get(String(sb.lmGroup)), threshold);
            if (lmVal.kind === 'count') {
              const t = String(tier || '').trim().toLowerCase();
              const maxRow = Array.isArray(sb.maxByTier) && t
                ? sb.maxByTier.find((r) => String(r?.tier || '').trim().toLowerCase() === t)
                : null;
              const tierMax = maxRow && Number.isFinite(Number(maxRow.max))
                ? Number(maxRow.max) : undefined;
              // Solo pinta "de M" si el máximo del tier es válido y >= disponible
              // (nunca "N de M" con N > M). Sin config → `total` queda undefined → la
              // card muestra solo N.
              if (tierMax !== undefined && tierMax >= lmVal.amount) lmVal.total = tierMax;
              // Preserva el `suffix` custom declarado en config (Figma Silver
              // 765:39295 card Equipaje: "piezas adicionales" reemplaza el default).
              if (value.suffix) lmVal.suffix = value.suffix;
            }
            value = lmVal;
          }
          return {
            label: String(sb?.label || ''),
            // Campos opcionales de presentación (Figma Silver 765:39295):
            //  · `labelBold`  → tramo bold que se ancla al final del label
            //    (card "Bono Elite": "Acumulables **en tus vuelos con Avianca**").
            //  · `labelIcon`  → icono pequeño antes del label (card "Equipaje":
            //    "🧳 Equipaje de bodega (23 kg)").
            //  Todo string vacío → no se pinta (fail-soft).
            labelBold: typeof sb?.labelBold === 'string' ? sb.labelBold : '',
            labelIcon: typeof sb?.labelIcon === 'string' ? sb.labelIcon : '',
            value,
          };
        })
        .filter((sb) => sb.label);
      return {
        key: cat?.key || '',
        titleKey: cat?.titleKey || '',
        title: cat?.title || '',
        eyebrow: cat?.eyebrow || '',
        icon: cat?.icon || '',
        sortOrder: Number.isFinite(Number(cat?.sortOrder)) ? Number(cat.sortOrder) : 0,
        ctaLabel: cat?.ctaLabel || '',
        ctaUrl: cat?.ctaUrl || '',
        // Notas opcionales al pie de la card (Figma Silver 765:39295):
        //  · `footnote`     → banner subtle con ícono (card "Equipaje": "10% de
        //    descuento en la compra de equipaje de mano …").
        //  · `footnoteIcon` → icon key del banner (default `alert/info`).
        //  · `disclaimer`   → nota plana con asterisco, sin caja (card
        //    "Asientos": "*No aplica para tarifas Basic y Light").
        //  Todo string vacío → no se pinta (fail-soft).
        footnote: typeof cat?.footnote === 'string' ? cat.footnote : '',
        footnoteIcon: typeof cat?.footnoteIcon === 'string' ? cat.footnoteIcon : '',
        disclaimer: typeof cat?.disclaimer === 'string' ? cat.disclaimer : '',
        subBenefits,
      };
    })
    .filter((c) => c.subBenefits.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    state: 'ready',
    seeAllUrl: catalogCfg.seeAllUrl || '',
    termsUrl: catalogCfg.termsUrl || '',
    // Íconos de los CTAs (1271693 AC): URL del DAM o key; vacío → el organism cae
    // al default 'navigation/open-in-new'.
    seeAllIcon: catalogCfg.seeAllIcon || '',
    termsIcon: catalogCfg.termsIcon || '',
    categories,
  };
};

/**
 * Carga el catálogo de beneficios vía `lmBenefits` (patrón fail-soft del
 * club-subscription service): wrapper ausente/no deployado/error/vacío →
 * `state: 'unavailable'` (la sección catálogo no se renderiza). **NUNCA cae a
 * data mock**: con `lmBenefits` ya vivo (2026-07-21), mostrar mock sería mentirle
 * al socio con datos que no son suyos (decisión Juan). El estado de CARGA (skeleton)
 * mientras la petición está en vuelo lo maneja el organism; acá solo hay
 * `ready` (con datos reales) o `unavailable` (sin datos).
 *
 * @param {Function|null} wrapperFn SOLO samples/tests: reemplaza al global
 *   `lmFetchWrapper` para inyectar fixtures sin depender del loader real de LM.
 * @param {object} [cfg] config con `benefitsCatalog` (categorías + umbral).
 * @param {string} [tier] tier base del socio (purificado, ej. 'gold'/'diamond'/
 *   'magno') para resolver los valores `valuesByTier` (Plan B, Fase 2).
 * @returns {Promise<{state:('ready'|'unavailable'), categories: object[]}>}
 */
export async function loadBenefitsCatalog(wrapperFn = null, cfg = {}, tier = '') {
  try {
    if (!wrapperFn) await whenLmReady('lmFetchWrapper');
    const fn = wrapperFn
      || (typeof window !== 'undefined' ? window.lmFetchWrapper : null);
    if (typeof fn !== 'function') return { ...UNAVAILABLE_VM };
    // TODO(LM): confirmar params de `lmBenefits` cuando el endpoint responda en
    // UAT (paso 9). Hoy el endpoint está roto → sin contrato de params; usamos
    // `{}` como eliteProgram/memberProfile (members-elite.js:184-187).
    const res = await fn('lmBenefits', {}, false);
    // Wrapper NO deployado → string `E.EON.*` (no Response) → sin datos.
    if (!(res instanceof Response) || !res.ok) return { ...UNAVAILABLE_VM };
    const json = await res.json();
    const vm = toBenefitsCatalogVM(json, cfg, tier);
    // Sin categorías con sub-beneficios → tratar como unavailable (no renderizar
    // sección vacía).
    if (vm.state === 'ready' && vm.categories.length === 0) return { ...UNAVAILABLE_VM };
    return vm;
  } catch (e) {
    return { ...UNAVAILABLE_VM }; // fail-soft
  }
}

export default { loadBenefitsCatalog, toBenefitsCatalogVM, deriveLmValue };
