import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { readFileSync } from 'node:fs';

const sheetFixture = JSON.parse(
  readFileSync(new URL('../../fixtures/members/elite/cobrand-sheet.json', import.meta.url), 'utf8'),
);

/**
 * PBI 1271694 — capa de datos de la tab Beneficios + FAB.
 *
 * Cubre (paso 1): defaults de código del FAB Gamification (`DEFAULT_FAB_CONFIG`,
 * resolución por POS+barra con default obligatorio) y flags de Beneficios,
 * con override desde el CF (`fabConfig[]`/`benefitsFlags`).
 * Cubre (paso 6): servicio cobrand (spreadsheet por POS + matching cascada T9
 * + gates tolerantes).
 */

const configPath = '../../../scripts/services/members/members-config.js';
const cfPath = '../../../scripts/services/members/members-cf.service.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';

describe('members-config · FAB Gamification + flags Beneficios (1271694 paso 1)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('sin CF → defaults de código: las 3 barras multiply (Reservar vuelo, "default obligatorio" AC L56) + flags on', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue(null),
      normalizeMembersCF: vi.fn().mockReturnValue(null),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');

    expect(cfg.fabConfig).toHaveLength(3);
    expect(cfg.fabConfig.map((e) => e.bar)).toEqual(['total', 'avianca', 'cenit']);
    // AC L56: default obligatorio = multiplicación → las 3 barras "Reservar un
    // vuelo". "Comprar millas" (buy) en Totales se activa autorando el CF por POS.
    cfg.fabConfig.forEach((e) => {
      expect(e.pos).toBe('all');
      expect(e.titleKey).toBe('fabTitle');
    });
    expect(cfg.fabConfig[0]).toMatchObject({ bar: 'total', action: 'multiply', ctaLabelKey: 'fabCtaFly' });
    expect(cfg.fabConfig[1]).toMatchObject({ bar: 'avianca', action: 'multiply', ctaLabelKey: 'fabCtaFly' });
    expect(cfg.fabConfig[2]).toMatchObject({ bar: 'cenit', action: 'multiply', ctaLabelKey: 'fabCtaFly' });
    expect(cfg.fabConfig[0].bodyKey).toBe('fabBodyMultiply');
    expect(cfg.fabConfig[1].bodyKey).toBe('fabBodyAvianca');
    expect(cfg.benefitsFlags).toEqual({ cobrandEnabled: true, lmPlusEnabled: true });
  });

  it('con CF → override de fabConfig y benefitsFlags', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        fabConfig: [{
          pos: ['CO'], bar: 'total', action: 'buy', title: 'Compra millas CO', ctaLabel: 'Comprar millas', ctaUrl: '/es/millas',
        }],
        benefitsFlags: { lmPlusEnabled: false },
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');

    expect(cfg.fabConfig).toHaveLength(1);
    expect(cfg.fabConfig[0]).toMatchObject({ pos: ['CO'], bar: 'total', action: 'buy' });
    expect(cfg.benefitsFlags).toEqual({ cobrandEnabled: true, lmPlusEnabled: false });
  });

  it('resolveFabEntry: POS específico > all > default de código por barra (AC)', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    const { resolveFabEntry, DEFAULT_FAB_CONFIG } = await import(configPath);
    const list = [
      {
        pos: ['CO', 'PE'], bar: 'total', action: 'buy', title: 'CO/PE',
      },
      {
        pos: 'all', bar: 'total', action: 'multiply', title: 'todos',
      },
    ];
    // ① POS específico (case-insensitive).
    expect(resolveFabEntry(list, { pos: 'co', bar: 'total' }).title).toBe('CO/PE');
    // ② sin entrada del POS → la de 'all'.
    expect(resolveFabEntry(list, { pos: 'AR', bar: 'total' }).title).toBe('todos');
    // ③ barra sin entrada en el CF → default de código (multiplicación).
    const cenit = resolveFabEntry(list, { pos: 'CO', bar: 'cenit' });
    expect(cenit).toBe(DEFAULT_FAB_CONFIG.find((e) => e.bar === 'cenit'));
    // Lista vacía/null → default de código.
    expect(resolveFabEntry(null, { pos: 'CO', bar: 'avianca' }).bodyKey).toBe('fabBodyAvianca');
  });
});

describe('members-cf.service · proyección fabConfig[] + benefitsFlags (1271694 paso 1)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  const loadNormalizer = async () => {
    vi.doUnmock(cfPath);
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    const { normalizeMembersCF } = await import(cfPath);
    return normalizeMembersCF;
  };

  it('proyecta fabConfig[]: pos CSV/array/all normalizado, action saneada, barras válidas', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const out = normalizeMembersCF({
      fabConfig: [
        {
          pos: 'co, pe', bar: 'Total', action: 'BUY', title: 'T', body: 'B', ctaLabel: 'C', ctaUrl: '/u',
        },
        { pos: ['ec'], bar: 'avianca', action: 'otra-cosa' },
        { pos: 'all', bar: 'cenit' },
        { bar: 'inexistente' }, // barra inválida → se ignora
        { pos: 'CO' }, // sin barra → se ignora
      ],
    });
    expect(out.fabConfig).toHaveLength(3);
    expect(out.fabConfig[0]).toEqual({
      pos: ['CO', 'PE'], bar: 'total', action: 'buy', title: 'T', body: 'B', ctaLabel: 'C', ctaUrl: '/u',
    });
    expect(out.fabConfig[1]).toEqual({ pos: ['EC'], bar: 'avianca', action: 'multiply' });
    expect(out.fabConfig[2]).toEqual({ pos: 'all', bar: 'cenit', action: 'multiply' });
  });

  it('proyecta benefitsFlags (anidado o plano) y omite claves ausentes', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const nested = normalizeMembersCF({ benefitsFlags: { cobrandEnabled: false } });
    expect(nested.benefitsFlags).toEqual({ cobrandEnabled: false });
    const flat = normalizeMembersCF({ lmPlusEnabled: false });
    expect(flat.benefitsFlags).toEqual({ lmPlusEnabled: false });
    const none = normalizeMembersCF({ authConfig: {} });
    expect(none.fabConfig).toBeUndefined();
    expect(none.benefitsFlags).toBeUndefined();
  });

  it('proyecta íconos de barra (CU-346): DAM ref → _publishUrl, string tal cual', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const out = normalizeMembersCF({
      eliteProgress: {
        // eslint-disable-next-line no-underscore-dangle
        progressBarIconTotal: { _publishUrl: 'https://dam.example/lm.svg' },
        progressBarIconAvianca: 'action/plane2',
      },
    });
    expect(out.eliteProgress.progressBarIconTotal).toBe('https://dam.example/lm.svg');
    expect(out.eliteProgress.progressBarIconAvianca).toBe('action/plane2');
    // sin los campos → no aparecen (el caller cae a los defaults de código).
    const none = normalizeMembersCF({ authConfig: {} });
    expect(none.eliteProgress).toBeUndefined();
  });

  it('proyecta íconos desde el sub-CF `eliteIcons` (5 campos, imagen-referencia DAM)', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const out = normalizeMembersCF({
      eliteIcons: {
        // eslint-disable-next-line no-underscore-dangle
        progressBarIconTotal: { _publishUrl: 'https://dam.example/lm.svg' },
        // eslint-disable-next-line no-underscore-dangle
        howToEarnIconS3: { _publishUrl: 'https://dam.example/gift.svg' },
        howToEarnIconS1: 'action/plane',
      },
    });
    // el sub-CF alimenta eliteProgress (shape interno estable para el organism)
    expect(out.eliteProgress.progressBarIconTotal).toBe('https://dam.example/lm.svg');
    expect(out.eliteProgress.howToEarnIconS3).toBe('https://dam.example/gift.svg');
    expect(out.eliteProgress.howToEarnIconS1).toBe('action/plane');
  });

  it('proyecta newYearModal (A3): enabled + tertiaryUrl, anidado o plano', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const nested = normalizeMembersCF({ newYearModal: { enabled: true, tertiaryUrl: '/es/elite' } });
    expect(nested.newYearModal).toEqual({ enabled: true, tertiaryUrl: '/es/elite' });
    const flat = normalizeMembersCF({ newYearModalEnabled: true });
    expect(flat.newYearModal).toEqual({ enabled: true });
    const none = normalizeMembersCF({ authConfig: {} });
    expect(none.newYearModal).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cobrand.service (paso 6): spreadsheet por POS + matching cascada T9 + gates.
// ---------------------------------------------------------------------------
describe('cobrand.service · catálogo del spreadsheet (1271694 paso 6)', () => {
  const servicePath = '../../../scripts/services/members/cobrand.service.js';
  const aemPath = '../../../scripts/aem.js';

  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  const loadService = async (sheetResponse) => {
    // sanitize.js (isSafeUrl REAL) importa loadScript de aem.js, que toca
    // window en top-level → se mockea aem.js, NO el validador de URLs.
    vi.doMock(aemPath, () => ({ loadScript: vi.fn() }));
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue(sheetResponse),
    }));
    return import(servicePath);
  };

  it('filtra por POS activo y ordena por orden_aparicion', async () => {
    const { loadCobrandCatalog } = await loadService(sheetFixture);
    const co = await loadCobrandCatalog('co');
    expect(co).toHaveLength(2);
    // orden_aparicion: VISA_BANCOL_CO (1) antes que CLRSV (2).
    expect(co.map((c) => c.partnerCode)).toEqual(['VISA_BANCOL_CO', 'CLRSV']);
    const pe = await loadCobrandCatalog('PE');
    expect(pe).toHaveLength(1);
    expect(pe[0].partnerCode).toBe('VISA_BCP_PE');
    // POS sin filas → como sheet vacío (§7.3).
    expect(await loadCobrandCatalog('AR')).toEqual([]);
  });

  it('sheet aún no autorado (404 → {data:[]}) o malformado → [] sin throw', async () => {
    const svc1 = await loadService({ data: [] });
    expect(await svc1.loadCobrandCatalog('CO')).toEqual([]);
    vi.resetModules();
    const svc2 = await loadService(null);
    expect(await svc2.loadCobrandCatalog('CO')).toEqual([]);
  });

  it('valida por fila: salta filas sin pos o sin nombre/partnerCode y avisa (CU-352.CA4)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sheet = {
      data: [
        {
          pos: 'CO', nombre_tarjeta: 'Válida', partnerCode: 'OK_CO', orden_aparicion: 1,
        },
        { nombre_tarjeta: 'Sin POS', partnerCode: 'X' }, // fila 2: sin pos
        { pos: 'CO', orden_aparicion: 3 }, // fila 3: pos ok pero sin nombre ni code
        { pos: 'PE', nombre_tarjeta: 'Otro país' }, // fila 4: otro POS → filtrada en silencio
      ],
    };
    const { loadCobrandCatalog } = await loadService(sheet);
    const co = await loadCobrandCatalog('CO');
    // solo la fila 1 sobrevive
    expect(co).toHaveLength(1);
    expect(co[0].partnerCode).toBe('OK_CO');
    // avisó por la fila 2 (sin pos) y la fila 3 (sin identificador), NO por la 4.
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toMatch(/fila 2/);
    expect(warn.mock.calls[1][0]).toMatch(/fila 3/);
  });

  it('filtra por idioma (AC "por POS e idioma") + fila universal + dedupe (A5)', async () => {
    const sheet = {
      data: [
        {
          pos: 'CO', idioma: 'es', partnerCode: 'CLRSV', nombre_tarjeta: 'Clásica ES', orden_aparicion: 1,
        },
        {
          pos: 'CO', idioma: 'EN', partnerCode: 'CLRSV', nombre_tarjeta: 'Classic EN', orden_aparicion: 1,
        },
        {
          pos: 'CO', partnerCode: 'UNIV', nombre_tarjeta: 'Universal', orden_aparicion: 2,
        }, // sin idioma → aplica a todos
        {
          pos: 'CO', partnerCode: 'DUP', nombre_tarjeta: 'DUP universal', orden_aparicion: 3,
        },
        {
          pos: 'CO', idioma: 'es', partnerCode: 'DUP', nombre_tarjeta: 'DUP es', orden_aparicion: 3,
        },
      ],
    };
    const { loadCobrandCatalog } = await loadService(sheet);

    // ES: CLRSV(es) + UNIV + DUP(es gana a universal) = 3
    const es = await loadCobrandCatalog('CO', 'es');
    expect(es.map((c) => c.partnerCode)).toEqual(['CLRSV', 'UNIV', 'DUP']);
    expect(es.find((c) => c.partnerCode === 'CLRSV').name).toBe('Clásica ES');
    expect(es.find((c) => c.partnerCode === 'DUP').name).toBe('DUP es');

    // EN (case-insensitive): CLRSV(en) + UNIV + DUP(universal, no hay en) = 3
    const en = await loadCobrandCatalog('CO', 'en');
    expect(en.find((c) => c.partnerCode === 'CLRSV').name).toBe('Classic EN');
    expect(en.find((c) => c.partnerCode === 'DUP').name).toBe('DUP universal');

    // FR sin traducción: solo las universales (CLRSV es/en quedan fuera)
    const fr = await loadCobrandCatalog('CO', 'fr');
    expect(fr.map((c) => c.partnerCode)).toEqual(['UNIV', 'DUP']);
  });

  it('compat legacy: planilla sin columna idioma → pasar lang no rompe (filas universales)', async () => {
    const { loadCobrandCatalog } = await loadService(sheetFixture);
    // el fixture no tiene `idioma` → todas universales → mismas 2 cards CO con cualquier lang
    const co = await loadCobrandCatalog('co', 'es');
    expect(co.map((c) => c.partnerCode)).toEqual(['VISA_BANCOL_CO', 'CLRSV']);
  });

  it('soporta CSV multi-valor en pos e idioma (una fila para varios POS/idiomas)', async () => {
    const sheet = {
      data: [
        {
          pos: 'CO, PE', idioma: 'es', partnerCode: 'MULTI', nombre_tarjeta: 'Multi POS', orden_aparicion: 1,
        },
        {
          pos: 'EC', idioma: 'es,EN', partnerCode: 'MULTILANG', nombre_tarjeta: 'Multi idioma', orden_aparicion: 1,
        },
      ],
    };
    const { loadCobrandCatalog } = await loadService(sheet);
    // multi-POS: la misma fila aparece en CO y en PE, no en un POS fuera de la lista.
    expect((await loadCobrandCatalog('CO', 'es')).map((c) => c.partnerCode)).toEqual(['MULTI']);
    expect((await loadCobrandCatalog('PE', 'es')).map((c) => c.partnerCode)).toEqual(['MULTI']);
    expect(await loadCobrandCatalog('AR', 'es')).toEqual([]);
    // multi-idioma (case-insensitive): aparece en es y en en, no en fr.
    expect((await loadCobrandCatalog('EC', 'es')).map((c) => c.partnerCode)).toEqual(['MULTILANG']);
    expect((await loadCobrandCatalog('EC', 'en')).map((c) => c.partnerCode)).toEqual(['MULTILANG']);
    expect(await loadCobrandCatalog('EC', 'fr')).toEqual([]);
  });

  it('normaliza la fila: beneficios en pares, chip, y URLs inseguras → vacías', async () => {
    const { loadCobrandCatalog } = await loadService(sheetFixture);
    const co = await loadCobrandCatalog('CO');
    const clrsv = co.find((c) => c.partnerCode === 'CLRSV');
    expect(clrsv.benefits).toHaveLength(3);
    expect(clrsv.benefits[0]).toEqual({ text: 'Tiquetes en canales de Avianca', value: '2 millas por cada USD' });
    expect(clrsv.chip).toEqual({ text: '3,230 millas', bg: '#7B2D8B', color: '#FFFFFF' });
    expect(clrsv.seeMoreUrl).toBe('/es/tarjetas/beneficios');
    // `javascript:` del sheet → '' (seguridad §7.2).
    const visa = co.find((c) => c.partnerCode === 'VISA_BANCOL_CO');
    expect(visa.seeMoreUrl).toBe('');
    expect(visa.chip).toBeNull();
    expect(visa.actions.request).toBe(false);
  });

  it('buildCobrandVM: matching ① por partnerCode exacto (case-insensitive)', async () => {
    const { loadCobrandCatalog, buildCobrandVM } = await loadService(sheetFixture);
    const catalog = await loadCobrandCatalog('CO');
    const vm = buildCobrandVM({
      profileRaw: {
        memberProfileDetails: {
          cobrandInfo: [{ partnerCode: 'clrsv', type: 'I', typeDesc: 'INFINIT SILVER' }],
        },
      },
      catalog,
    });
    expect(vm.empty).toBe(false);
    expect(vm.cards).toHaveLength(1);
    expect(vm.cards[0].name).toBe('Avianca Lifemiles Visa Infinite Silver');
    expect(vm.cards[0].generic).toBe(false);
    // Gate v1: sin fuente por-tarjeta → milesPeriod null (la card oculta la línea).
    expect(vm.cards[0].milesPeriod).toBeNull();
  });

  it('matching ② por nombre normalizado y ③ genérica cuando no hay match', async () => {
    const { loadCobrandCatalog, buildCobrandVM } = await loadService(sheetFixture);
    const catalog = await loadCobrandCatalog('CO');
    const vm = buildCobrandVM({
      profileRaw: {
        memberProfileDetails: {
          cobrandInfo: [
            // ② typeDesc matchea nombre_tarjeta normalizado (sin partnerCode).
            { partnerCode: 'OTRA', typeDesc: 'avianca lifemiles VISA' },
            // ③ sin match → genérica con typeDesc + placeholder.
            { partnerCode: 'XXXX', typeDesc: 'GOLD MASTERCARD' },
          ],
        },
      },
      catalog,
    });
    expect(vm.cards).toHaveLength(2);
    expect(vm.cards[0].partnerCode).toBe('VISA_BANCOL_CO'); // ② por nombre
    expect(vm.cards[0].generic).toBe(false);
    const generic = vm.cards[1];
    expect(generic.generic).toBe(true);
    expect(generic.name).toBe('GOLD MASTERCARD');
    expect(generic.imageUrl).toBe('');
    expect(generic.milesPeriod).toBeNull();
  });

  it('cobrandInfo null o [] → empty state (caso real de TODAS las cuentas UAT)', async () => {
    const { buildCobrandVM } = await loadService(sheetFixture);
    // Path real de las capturas: memberProfileDetails.cobrandInfo.
    expect(buildCobrandVM({
      profileRaw: { memberProfileDetails: { cobrandInfo: null } }, catalog: [],
    })).toEqual({ empty: true, cards: [], actions: null });
    const vmEmptyArr = buildCobrandVM({
      profileRaw: { memberProfileDetails: { cobrandInfo: [] } }, catalog: [],
    });
    expect(vmEmptyArr.empty).toBe(true);
    // Sin profileRaw (wrapper caído) → empty sin crash.
    expect(buildCobrandVM({ profileRaw: null, catalog: [] }).empty).toBe(true);
  });

  it('catálogo vacío + cobrandInfo poblado → cards genéricas de la cascada ③ (§7.3)', async () => {
    const { buildCobrandVM } = await loadService({ data: [] });
    const vm = buildCobrandVM({
      profileRaw: {
        memberProfileDetails: { cobrandInfo: [{ partnerCode: 'CLRSV', typeDesc: 'INFINIT SILVER' }] },
      },
      catalog: [],
    });
    expect(vm.empty).toBe(false);
    expect(vm.cards[0].generic).toBe(true);
    expect(vm.cards[0].name).toBe('INFINIT SILVER');
  });
});
