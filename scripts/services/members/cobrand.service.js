import { fetchAEMData } from '../../utils/aem-data.js';
import { isSafeUrl } from '../../utils/sanitize.js';

/**
 * Cobrand service — catálogo editorial de tarjetas cobrand + matching con las
 * tarjetas del socio (1271694, AC bloque 10.2; decisiones A6/T9).
 *
 * Fuente EDITORIAL: spreadsheet `/cobrand-cards.json` (RAÍZ — sin subcarpeta
 * para no requerir mapper del TL, igual que /es.json, /environment.json) — UNA
 * planilla multi-POS con columna `pos` (modelo de columnas: espec-cf-lote §9 +
 * AC; Juan la autora). Hasta que exista, el fetch cae al `{data: []}` de
 * `fetchAEMData` → catálogo vacío SIN error (gate tolerante).
 *
 * Tarjetas DEL SOCIO: `memberProfile → memberProfileDetails.cobrandInfo[]`
 * (shape doc v1.0: `{partnerCode, type, typeDesc}`; en las 5 cuentas UAT
 * reales viene null/[] → empty state). Matching cascada (T9):
 *  ① `partnerCode` exacto → ② nombre normalizado (`typeDesc` vs
 *  `nombre_tarjeta`) → ③ card GENÉRICA con el `typeDesc` del wrapper e imagen
 *  placeholder.
 *
 * GATE v1: `milesPeriod: null` en todas las cards — no hay fuente por-tarjeta
 * confirmada (`AVLMCOBQM` de eliteProgram.summary es AGREGADO y
 * `lmTransactionByMonth.cobrandTrx` no discrimina tarjeta). La card OCULTA la
 * línea "Total acumulado…" si null.
 * // TODO(LM): fuente de millas del periodo POR TARJETA — consulta §2 de
 * // verificacion-wrappers.md (canalizada vía Avianca).
 *
 * Seguridad: URLs del sheet (ver-más / acciones) validadas con `isSafeUrl`
 * (https/same-origin; sin `javascript:`) → inválidas quedan ''. Colores del
 * chip: strings hex que la card aplica SOLO como estilo inline.
 */

const SHEET_ENDPOINT = 'cobrand-cards';

const safeUrl = (url) => (url && isSafeUrl(String(url)) ? String(url) : '');

const toBool = (v, fallback = true) => {
  if (v === undefined || v === null || v === '') return fallback;
  return !['false', '0', 'no'].includes(String(v).trim().toLowerCase());
};

/** Normaliza nombres para el matching ② (lowercase, sin acentos ni espacios). */
const normalizeName = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]/g, '');

/**
 * Parsea una celda de códigos a lista normalizada: acepta **CSV** ("CO,PE" /
 * "es,en") → una fila puede aplicar a varios POS/idiomas. `lower` → códigos de
 * idioma (lowercase, 2 letras); si no, POS (UPPER). Vacío → `[]`.
 */
const parseCodes = (raw, lower = false) => String(raw ?? '')
  .split(',')
  .map((s) => {
    const t = s.trim();
    return lower ? t.toLowerCase().slice(0, 2) : t.toUpperCase();
  })
  .filter(Boolean);

/** Proyecta una fila del sheet a card editorial normalizada. */
const rowToCard = (row) => {
  const benefits = [];
  // Pares beneficio_N_texto / beneficio_N_valor (N abierto, espec §9).
  for (let i = 1; i <= 20; i += 1) {
    const text = row[`beneficio_${i}_texto`];
    if (!text) break;
    benefits.push({ text: String(text), value: String(row[`beneficio_${i}_valor`] || '') });
  }
  const chipText = row.texto_chip ? String(row.texto_chip) : '';
  return {
    // POS(es) a los que aplica la fila. Acepta CSV ("CO,PE") → lista. Vacío → [].
    pos: parseCodes(row.pos ?? row.pais_pos),
    // idioma(s) del contenido (AC "por POS e idioma"; columna `idioma`). Acepta
    // CSV ("es,en") → lista de códigos de 2 letras. VACÍO = universal: aplica a
    // todos los idiomas de ese POS (compat con la planilla legacy sin columna).
    lang: parseCodes(row.idioma ?? row.lang, true),
    partnerCode: String(row.partnerCode ?? row.id_tarjeta ?? '').trim().toUpperCase(),
    name: String(row.nombre_tarjeta || ''),
    bank: String(row.banco_emisor || ''),
    imageUrl: safeUrl(row.imagen_url),
    // Orientación del arte de la tarjeta (2026-07-24, sheet flag): las cards
    // pueden ser horizontal (default, aspect 219:144 landscape) o vertical
    // (aspect-square 150 desktop / 200 mobile con la imagen portrait centrada).
    // Columna `imagen_vertical` → bool con default FALSE (a diferencia del resto
    // de bools del sheet que defaultan a true) para no romper las filas legacy.
    isVerticalImage: toBool(row.imagen_vertical, false),
    chip: chipText ? {
      text: chipText,
      bg: String(row.color_fondo_chip || ''),
      color: String(row.color_texto_chip || ''),
    } : null,
    benefits,
    seeMoreUrl: safeUrl(row.url_ver_mas),
    order: Number(row.orden_aparicion) || 0,
    actions: {
      add: toBool(row.accion_agregar),
      request: toBool(row.accion_solicitar),
      addLabel: String(row.accion_agregar_texto || ''),
      addUrl: safeUrl(row.accion_agregar_url),
      addIcon: String(row.accion_agregar_icono || ''),
      requestLabel: String(row.accion_solicitar_texto || ''),
      requestUrl: safeUrl(row.accion_solicitar_url),
      requestIcon: String(row.accion_solicitar_icono || ''),
    },
  };
};

/**
 * Carga el catálogo cobrand del POS activo desde el spreadsheet. Fail-soft:
 * sheet inexistente (404 → `{data: []}` del helper), vacío o malformado →
 * `[]` sin throw. Filtra por `pos` y ordena por `orden_aparicion`.
 *
 * Filtra por POS **e idioma** (AC "por POS e idioma"): incluye las filas del
 * idioma activo + las universales (columna `idioma` vacía = aplican a todos los
 * idiomas; compat con la planilla legacy sin esa columna). Si una tarjeta tiene
 * fila específica del idioma Y universal, gana la específica (dedupe por
 * partnerCode/nombre). Sin `lang` → no filtra por idioma (comportamiento previo).
 *
 * Las columnas `pos` e `idioma` aceptan **CSV** ("CO,PE" / "es,en"): una misma
 * fila puede aplicar a varios POS/idiomas (match por pertenencia) — útil para no
 * duplicar una tarjeta idéntica en varios países.
 *
 * Validación por fila (CU-352.CA4): las filas del POS actual se validan y las
 * inválidas se SALTAN con un `console.warn` que indica el número de fila y el
 * motivo (la notificación en la UI de AEM es limitación de plataforma). Filas
 * de OTRO país se filtran en silencio (una planilla multi-POS es lo normal).
 * @param {string} pos código del POS activo (ej. 'CO').
 * @param {string} [lang] código de idioma activo (ej. 'es'); vacío = sin filtro.
 * @returns {Promise<object[]>} cards editoriales normalizadas y válidas.
 */
export async function loadCobrandCatalog(pos, lang = '') {
  try {
    const sheet = await fetchAEMData(SHEET_ENDPOINT);
    const rows = Array.isArray(sheet?.data) ? sheet.data : [];
    const posUp = String(pos || '').trim().toUpperCase();
    const langLc = String(lang || '').trim().toLowerCase().slice(0, 2);
    const valid = [];
    rows.forEach((row, i) => {
      const card = rowToCard(row);
      // Fila sin POS → malformada: no se puede asignar a ningún país.
      if (!card.pos.length) {
        // eslint-disable-next-line no-console
        console.warn(`[cobrand] fila ${i + 1} ignorada: falta la columna "pos".`);
        return;
      }
      // No aplica a este POS (la fila puede ser multi-POS, ej. "CO,PE").
      if (!card.pos.includes(posUp)) return;
      // Idioma: pasa si es universal (idioma vacío) o incluye el idioma activo
      // (la fila puede ser multi-idioma, ej. "es,en").
      if (langLc && card.lang.length && !card.lang.includes(langLc)) return;
      // Fila del POS actual pero sin identificador ni nombre → no renderizable
      // ni matcheable con las tarjetas del socio.
      if (!card.name && !card.partnerCode) {
        // eslint-disable-next-line no-console
        console.warn(`[cobrand] fila ${i + 1} (POS ${card.pos.join(',')}) ignorada: falta "nombre_tarjeta" y "partnerCode".`);
        return;
      }
      valid.push(card);
    });
    // Dedupe por identidad de tarjeta: si conviven fila del idioma exacto y
    // universal, gana la del idioma exacto.
    const byKey = new Map();
    valid.forEach((c) => {
      const key = c.partnerCode || c.name.toLowerCase();
      const existing = byKey.get(key);
      if (!existing) { byKey.set(key, c); return; }
      // Reemplazar solo si la nueva es específica del idioma y la previa era universal.
      if (!existing.lang.length && c.lang.length && c.lang.includes(langLc)) byKey.set(key, c);
    });
    return [...byKey.values()].sort((a, b) => a.order - b.order);
  } catch (e) {
    return [];
  }
}

/** `cobrandInfo[]` del crudo de memberProfile (path REAL de las capturas:
 * `memberProfileDetails.cobrandInfo`; fallbacks a los paths del doc v1.0). */
const extractCobrandInfo = (profileRaw) => {
  const details = profileRaw?.memberProfileDetails || profileRaw || {};
  return details.cobrandInfo
    ?? details.memberAccount?.memberProfile?.cobrandInfo
    ?? profileRaw?.cobrandInfo
    ?? null;
};

/**
 * Construye el VM del módulo cobrand: matching cascada T9 entre las tarjetas
 * del socio (`cobrandInfo[]`) y el catálogo editorial del POS.
 * @param {{profileRaw?: object|null, catalog?: object[]}} args
 * @returns {{empty: boolean, cards: object[], actions: object|null}}
 *  - `empty: true` → CobrandEmptyState (socio sin tarjetas).
 *  - `cards[]`: card editorial matcheada (+ `milesPeriod: null` — gate v1;
 *    `generic: true` para la cascada ③).
 *  - `actions`: acciones del catálogo del POS (primera fila) o null si no hay
 *    sheet (el caller cae a labels default de i18n).
 */
export function buildCobrandVM({ profileRaw = null, catalog = [] } = {}) {
  const list = Array.isArray(catalog) ? catalog : [];
  const actions = list.length ? list[0].actions : null;
  const info = extractCobrandInfo(profileRaw);
  if (!Array.isArray(info) || info.length === 0) {
    return { empty: true, cards: [], actions };
  }

  const cards = info.map((raw) => {
    const code = String(raw?.partnerCode || '').trim().toUpperCase();
    // ① partnerCode exacto.
    let match = code ? list.find((c) => c.partnerCode === code) : null;
    // ② nombre normalizado (typeDesc vs nombre_tarjeta).
    if (!match && raw?.typeDesc) {
      const target = normalizeName(raw.typeDesc);
      match = target ? list.find((c) => normalizeName(c.name) === target) : null;
    }
    // ③ genérica: typeDesc del wrapper + imagen placeholder (del empty state).
    if (!match) {
      return {
        partnerCode: code,
        name: String(raw?.typeDesc || code || ''),
        bank: '',
        imageUrl: '',
        isVerticalImage: false,
        chip: null,
        benefits: [],
        seeMoreUrl: '',
        order: Number.MAX_SAFE_INTEGER,
        generic: true,
        milesPeriod: null, // TODO(LM): millas del periodo por tarjeta (gate v1)
      };
    }
    return {
      ...match,
      generic: false,
      milesPeriod: null, // TODO(LM): millas del periodo por tarjeta (gate v1)
    };
  });

  cards.sort((a, b) => a.order - b.order);
  return { empty: false, cards, actions };
}
