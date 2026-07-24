/* global globalThis */
import {
  describe, it, expect, beforeAll, beforeEach, afterEach, vi,
} from 'vitest';

import { readFileSync } from 'node:fs';

// Contratos REALES por tier (captura UAT 2026-07-03, sin PII).
const loadFixture = (name) => JSON.parse(
  readFileSync(new URL(`../../fixtures/members/elite/${name}.json`, import.meta.url), 'utf8'),
);
const goldFx = loadFixture('gold');
const lifemilesFx = loadFixture('lifemiles-base');
const diamondCenitFx = loadFixture('diamond-cenit-1m');
const magnoFx = loadFixture('magno');
const magnoAvstarAltoFx = loadFixture('magno-avstar-alto');

/**
 * Tab Progreso elite (1271699) — capa de datos.
 *
 * Cubre (paso 3): defaults de código de la config del panel (metas por tier+
 * región, umbrales Cenit, mapeo de métricas, flags) y su override desde el CF
 * (`eliteGoalsV2[]`/`cenitConfig`/`eliteMetrics`/`countryRegionMap[]`).
 * Cubre (paso 5): `buildEliteDetailVM` contra los CONTRATOS REALES capturados
 * en UAT (tests/fixtures/members/elite/*.json, sesión 2026-07-03).
 */

const configPath = '../../../scripts/services/members/members-config.js';
const cfPath = '../../../scripts/services/members/members-cf.service.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';

describe('members-config · defaults del tab Progreso elite (1271699 paso 3)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('sin CF → defaults de código (tabla AC): metas, cenit, métricas y flags', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue(null),
      normalizeMembersCF: vi.fn().mockReturnValue(null),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');

    // Tabla del AC (bloque 4) por tier destino y región.
    expect(cfg.eliteGoalsV2['red-plus']).toEqual({
      totales: { col: 4000, row: 6000 }, avianca: { col: 1000, row: 1000 },
    });
    expect(cfg.eliteGoalsV2.silver).toEqual({
      totales: { col: 8000, row: 12000 }, avianca: { col: 2000, row: 3000 },
    });
    expect(cfg.eliteGoalsV2.gold).toEqual({
      totales: { col: 20000, row: 24000 }, avianca: { col: 8000, row: 12000 },
    });
    expect(cfg.eliteGoalsV2.diamond).toEqual({
      totales: { col: 45000, row: 45000 }, avianca: { col: 15000, row: 22500 },
    });
    // Magno: la fila de totales NO existe (AC bloque 5).
    expect(cfg.eliteGoalsV2.magno).toEqual({
      totales: null, avianca: { col: 110000, row: 110000 },
    });
    expect(cfg.cenitConfig).toEqual({ visibleFrom: 500000, oneGoal: 1000000, twoGoal: 2000000 });
    expect(cfg.eliteMetrics).toEqual({ total: 'historic', avianca: 'av-miles', lifetime: 'avstar' });
    expect(cfg.countryRegionMap).toEqual({});
    expect(cfg.eliteProgress).toEqual({
      alertsPersistDismiss: true,
      progressDescriptionVisible: true,
      fabEnabled: false,
      howToEarnSections23MaxTier: 'gold-cenit',
      progressBarIconTotal: 'members/lm',
      progressBarIconAvianca: 'action/plane',
      howToEarnIconS1: 'action/plane',
      howToEarnIconS2: 'members/lm',
      howToEarnIconS3: 'members/gift',
    });
  });

  it('con CF → override por clave, y merge campo-a-campo en metas parciales', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        // CF parcial: solo pisa `totales.col` de gold — el resto hereda default.
        eliteGoalsV2: { gold: { totales: { col: 21000 } } },
        cenitConfig: { visibleFrom: 600000 },
        eliteMetrics: { avianca: 'avstar' },
        countryRegionMap: { 7710: 'EXCOL', 1234: 'COL' },
        eliteProgress: { alertsPersistDismiss: false },
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');

    expect(cfg.eliteGoalsV2.gold).toEqual({
      totales: { col: 21000, row: 24000 }, // col del CF, row del default
      avianca: { col: 8000, row: 12000 }, // sin CF → default completo
    });
    // Tiers no tocados por el CF → defaults intactos.
    expect(cfg.eliteGoalsV2.magno).toEqual({
      totales: null, avianca: { col: 110000, row: 110000 },
    });
    expect(cfg.cenitConfig).toEqual({ visibleFrom: 600000, oneGoal: 1000000, twoGoal: 2000000 });
    expect(cfg.eliteMetrics).toEqual({ total: 'historic', avianca: 'avstar', lifetime: 'avstar' });
    expect(cfg.countryRegionMap).toEqual({ 7710: 'EXCOL', 1234: 'COL' });
    expect(cfg.eliteProgress.alertsPersistDismiss).toBe(false);
    expect(cfg.eliteProgress.progressDescriptionVisible).toBe(true);
  });
});

describe('members-cf.service · proyección CF del tab Progreso (1271699 paso 3)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  const loadNormalizer = async () => {
    // El describe de arriba mockea el CF service (vi.doMock persiste entre
    // resets de módulos): acá se necesita el REAL → doUnmock antes de importar.
    vi.doUnmock(cfPath);
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    const { normalizeMembersCF } = await import(cfPath);
    return normalizeMembersCF;
  };

  it('proyecta eliteGoalsV2[] (espec P3: tierKey + metaTotalCol/Row + metaAviancaCol/Row)', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const out = normalizeMembersCF({
      eliteGoalsV2: [
        {
          tierKey: 'Gold', metaTotalCol: 20000, metaTotalRow: 24000, metaAviancaCol: 8000, metaAviancaRow: 12000,
        },
        // Entrada parcial: solo metas avianca (Magno no tiene fila de totales).
        { tierKey: 'magno', metaAviancaCol: 110000, metaAviancaRow: 110000 },
        // Entrada inválida (sin tierKey) → se ignora.
        { metaTotalCol: 1 },
      ],
    });
    expect(out.eliteGoalsV2).toEqual({
      gold: {
        totales: { col: 20000, row: 24000 }, avianca: { col: 8000, row: 12000 },
      },
      magno: { avianca: { col: 110000, row: 110000 } },
    });
  });

  it('proyecta cenitConfig (anidado u campos planos) y eliteMetrics', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const nested = normalizeMembersCF({
      cenitConfig: { visibleFrom: 400000, oneGoal: 1000000, twoGoal: 2000000 },
      eliteMetrics: { total: 'historic', avianca: 'av-miles', lifetime: 'avstar' },
    });
    expect(nested.cenitConfig).toEqual({ visibleFrom: 400000, oneGoal: 1000000, twoGoal: 2000000 });
    expect(nested.eliteMetrics).toEqual({ total: 'historic', avianca: 'av-miles', lifetime: 'avstar' });

    const flat = normalizeMembersCF({ cenitVisibleFrom: 550000, eliteMetricAvianca: 'av-miles' });
    expect(flat.cenitConfig).toEqual({ visibleFrom: 550000 });
    expect(flat.eliteMetrics).toEqual({ avianca: 'av-miles' });
  });

  it('proyecta countryRegionMap[] como dict código→región y flags eliteProgress', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const out = normalizeMembersCF({
      countryRegionMap: [
        { code: '7710', region: 'excol' },
        { countryCode: '1234', region: 'COL' },
        { code: '', region: 'COL' }, // inválida → se ignora
      ],
      eliteProgress: {
        alertsPersistDismiss: false,
        progressDescriptionVisible: false,
        howToEarnSections23MaxTier: 'silver',
      },
    });
    expect(out.countryRegionMap).toEqual({ 7710: 'EXCOL', 1234: 'COL' });
    expect(out.eliteProgress).toEqual({
      alertsPersistDismiss: false,
      progressDescriptionVisible: false,
      howToEarnSections23MaxTier: 'silver',
    });
  });

  it('CF sin campos del tab Progreso → NO emite las claves (defaults del caller)', async () => {
    const normalizeMembersCF = await loadNormalizer();
    const out = normalizeMembersCF({ authConfig: { loginMode: 'redirect' } });
    expect(out.eliteGoalsV2).toBeUndefined();
    expect(out.cenitConfig).toBeUndefined();
    expect(out.eliteMetrics).toBeUndefined();
    expect(out.countryRegionMap).toBeUndefined();
    expect(out.eliteProgress).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildEliteDetailVM (paso 5) — contra los CONTRATOS REALES por tier. Cubre
// también la validación del paso 2 (normalización de keys compuestas:
// diamondone → diamond-cenit + cenitLevel 1; magno con avstar 1.13M →
// cenitLevel null porque el SERVICIO manda; gold → null).
// ---------------------------------------------------------------------------
describe('elite-detail.service · buildEliteDetailVM (contratos reales, paso 5)', () => {
  const servicePath = '../../../scripts/services/members/elite-detail.service.js';
  const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
  const CURRENT_YEAR = new Date().getFullYear();

  let buildEliteDetailVM;
  let resolveRegion;

  beforeAll(async () => {
    // Mismo idiom que session-cenit.test.js: el import de session.service
    // (por deriveCenit) arrastra el loader → aem.js, que toca window en
    // top-level. Stubs mínimos + mock del loader; members-config va REAL
    // (elite-detail usa sus DEFAULT_* y mergeEliteGoalsV2) con aem-data mockeado.
    globalThis.window = globalThis.window || {
      location: { pathname: '/', href: 'http://localhost/', search: '' },
      history: {},
    };
    globalThis.document = globalThis.document || { cookie: '', documentElement: { lang: 'es' } };
    vi.doUnmock(cfPath);
    vi.doMock(loaderPath, () => ({
      loadLmScript: vi.fn().mockResolvedValue(undefined),
      whenLmReady: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
    }));
    ({ buildEliteDetailVM, resolveRegion } = await import(servicePath));
  });

  it('gold (COL): métricas por mapeo default, metas mantener gold + siguiente diamond', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: goldFx.eliteProgram, profileRaw: goldFx.memberProfile,
    });
    expect(vm.tierBase).toBe('gold');
    expect(vm.cenitLevel).toBeNull();
    expect(vm.displayTier).toBe('Gold');
    expect(vm.region).toBe('COL');
    expect(vm.year).toBe(CURRENT_YEAR);
    expect(vm.maintainYear).toBe(CURRENT_YEAR + 1);
    // historic=8000 · av-miles=8000 · avstar=23000 (NO usar avstar para el año).
    expect(vm.metrics).toEqual({ totalYear: 8000, avYear: 8000, avLifetime: 23000 });
    expect(vm.goals.maintain).toEqual({ total: 20000, avianca: 8000 });
    expect(vm.goals.next).toEqual({ tier: 'diamond', total: 45000, avianca: 15000 });
    // avstar 23k < 500k, sin cenit del servicio → panel Cenit oculto.
    expect(vm.cenit).toMatchObject({
      visible: false, version: '1m', goal: 1000000, current: 23000,
    });
  });

  it('lifemiles base (COL): sin meta de mantener, siguiente red-plus; tolera expiryDate ""', () => {
    expect(lifemilesFx.eliteProgram.status.expiryDate).toBe(''); // edge real
    const vm = buildEliteDetailVM({
      eliteRaw: lifemilesFx.eliteProgram, profileRaw: lifemilesFx.memberProfile,
    });
    expect(vm.tierBase).toBe('lifemiles');
    expect(vm.cenitLevel).toBeNull();
    expect(vm.goals.maintain).toBeNull();
    expect(vm.goals.next).toEqual({ tier: 'red-plus', total: 4000, avianca: 1000 });
    expect(vm.metrics).toEqual({ totalYear: 500, avYear: 500, avLifetime: 6500 });
    expect(vm.cenit.visible).toBe(false);
  });

  it('diamondone → tierBase diamond-cenit + cenitLevel 1 (key compuesta del servicio)', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: diamondCenitFx.eliteProgram, profileRaw: diamondCenitFx.memberProfile,
    });
    expect(diamondCenitFx.eliteProgram.status.current).toBe('diamondone');
    expect(vm.tierBase).toBe('diamond-cenit');
    expect(vm.cenitLevel).toBe(1);
    expect(vm.displayTier).toBe('Diamond Cenit One Million');
    // Metas del tier base puro (diamond, COL) + siguiente magno (sin totales).
    expect(vm.goals.maintain).toEqual({ total: 45000, avianca: 15000 });
    expect(vm.goals.next).toEqual({ tier: 'magno', total: null, avianca: 110000 });
    // Panel Cenit VISIBLE porque el servicio marca cenit. La VERSIÓN la manda el
    // servicio (cenitLevel 1 = reconocido Cenit 1M → progresa hacia 2M), NO el
    // número. Verificado en QA vs LM (Enrique): LM muestra "of 2,000,000".
    expect(vm.cenit).toMatchObject({
      visible: true, version: '2m', goal: 2000000, current: 45000,
    });
  });

  it('magno (EXCOL): solo meta avianca de mantener, sin siguiente; Cenit visible por tier', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: magnoFx.eliteProgram, profileRaw: magnoFx.memberProfile,
    });
    expect(vm.tierBase).toBe('magno');
    expect(vm.cenitLevel).toBeNull();
    expect(vm.region).toBe('EXCOL'); // única cuenta EXCOL de la captura
    expect(vm.goals.maintain).toEqual({ total: null, avianca: 110000 });
    expect(vm.goals.next).toBeNull();
    expect(vm.metrics.avYear).toBe(100000); // 100k/110k → barra ~91%
    expect(vm.cenit.visible).toBe(true); // magno siempre ve el panel
    expect(vm.cenit.version).toBe('1m'); // cenitLevel null (magno sin reconocimiento Cenit) → 1M
  });

  it('magno con avstar 1.13M: cenitLevel null → panel Cenit versión 1M (el SERVICIO manda, verificado vs LM)', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: magnoAvstarAltoFx.eliteProgram, profileRaw: magnoAvstarAltoFx.memberProfile,
    });
    expect(vm.tierBase).toBe('magno');
    // El servicio reporta magno SIN reconocimiento Cenit aunque avstar ≥ 1M
    // (cenitStatus:"Magno"). Verificado en QA vs LM (Fernanda): LM muestra
    // "of 1,000,000" → versión 1M. La versión la manda el SERVICIO, NO el número
    // (derivar del número mostraba 2M erróneamente).
    expect(vm.cenitLevel).toBeNull();
    expect(vm.cenit).toMatchObject({
      visible: true, version: '1m', goal: 1000000, current: 1130000,
    });
  });

  it('región EXCOL cambia las metas (gold sintético): 24000/12000', () => {
    const profileExcol = JSON.parse(JSON.stringify(goldFx.memberProfile));
    profileExcol.memberProfileDetails.applicableRegion = { value: 'EXCOL' };
    const vm = buildEliteDetailVM({ eliteRaw: goldFx.eliteProgram, profileRaw: profileExcol });
    expect(vm.region).toBe('EXCOL');
    expect(vm.goals.maintain).toEqual({ total: 24000, avianca: 12000 });
    expect(vm.goals.next).toEqual({ tier: 'diamond', total: 45000, avianca: 22500 });
  });

  it('resolveRegion: cadena applicableRegion → countryRegionMap → default EXCOL (T16)', () => {
    const noRegion = JSON.parse(JSON.stringify(goldFx.memberProfile));
    delete noRegion.memberProfileDetails.applicableRegion;
    // countryOfResidence 7710 mapeado a COL vía config → COL.
    expect(resolveRegion(noRegion, { 7710: 'COL' })).toBe('COL');
    // Sin mapa → default conservador EXCOL.
    expect(resolveRegion(noRegion, {})).toBe('EXCOL');
    expect(resolveRegion(null, {})).toBe('EXCOL');
    // Región no-COL literal → EXCOL (semántica binaria).
    expect(resolveRegion({ memberProfileDetails: { applicableRegion: { value: 'BRA' } } })).toBe('EXCOL');
  });

  it('cenit 2M completado (sintético): versión 2M (cenitLevel≥1 del servicio) con current ≥ goal', () => {
    // Base = diamondone (cenitStatus reconocido 1M → cenitLevel 1 → versión 2M);
    // avstar bumpeado ≥ 2M para el estado completado.
    const elite2m = JSON.parse(JSON.stringify(diamondCenitFx.eliteProgram));
    elite2m.qualified.find((q) => q.type === 'avstar').amount = 2200000;
    const vm = buildEliteDetailVM({
      eliteRaw: elite2m, profileRaw: diamondCenitFx.memberProfile,
    });
    expect(vm.cenit).toMatchObject({
      visible: true, version: '2m', goal: 2000000, current: 2200000,
    });
  });

  it('config CF override: metas y umbral cenit del CF pisan los defaults', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: goldFx.eliteProgram,
      profileRaw: goldFx.memberProfile,
      config: {
        eliteGoalsV2: {
          gold: { totales: { col: 21000, row: 25000 }, avianca: { col: 9000, row: 13000 } },
          diamond: { totales: { col: 46000, row: 46000 }, avianca: { col: 16000, row: 23000 } },
        },
        cenitConfig: { visibleFrom: 20000 },
      },
    });
    expect(vm.goals.maintain).toEqual({ total: 21000, avianca: 9000 });
    expect(vm.goals.next).toEqual({ tier: 'diamond', total: 46000, avianca: 16000 });
    expect(vm.cenit.visible).toBe(true); // avstar 23k ≥ umbral CF 20k
  });

  it('wrapper caído (raws null) → VM en estado 0 sin romper (mismo criterio que el hero)', () => {
    const vm = buildEliteDetailVM({ eliteRaw: null, profileRaw: null });
    expect(vm.tierBase).toBe('lifemiles');
    expect(vm.cenitLevel).toBeNull();
    expect(vm.metrics).toEqual({ totalYear: 0, avYear: 0, avLifetime: 0 });
    expect(vm.goals.maintain).toBeNull();
    expect(vm.goals.next).toEqual({ tier: 'red-plus', total: 6000, avianca: 1000 }); // EXCOL default
    expect(vm.cenit.visible).toBe(false);
    expect(vm.region).toBe('EXCOL');
  });

  it('tier desconocido del servicio → base lifemiles + warn (§7.3)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vm = buildEliteDetailVM({
      eliteRaw: { status: { current: 'platinum-x' }, qualified: [] },
    });
    expect(vm.tierBase).toBe('lifemiles');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

// FIX UAT 1b (2026-07-06): degradado con tier de sesión cuando los wrappers no
// responden (raws null) — el panel muestra la variante CORRECTA con métricas 0,
// no el fallback mentiroso a lifemiles/Red Plus.
describe('buildEliteDetailVM — degradado sessionUser (FIX UAT 1b)', () => {
  const servicePath = '../../../scripts/services/members/elite-detail.service.js';
  let buildEliteDetailVM;

  beforeAll(async () => {
    ({ buildEliteDetailVM } = await import(servicePath));
  });

  it('raws null + sessionUser Diamond Cenit → variante correcta con métricas 0', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: null,
      profileRaw: null,
      config: null,
      sessionUser: { tier: 'Diamond Cenit One Million', cenit: { level: 1 } },
    });
    expect(vm.tierBase).toBe('diamond-cenit');
    expect(vm.cenitLevel).toBe(1);
    expect(vm.displayTier).toBe('Diamond Cenit One Million');
    expect(vm.metrics.totalYear).toBe(0);
    expect(vm.metrics.avYear).toBe(0);
  });

  it('con raws presentes, sessionUser NO pesa (comportamiento intacto)', () => {
    const vm = buildEliteDetailVM({
      eliteRaw: { status: { current: 'gold' }, tier: 'Gold', qualified: [{ type: 'historic', amount: 8000 }] },
      profileRaw: null,
      config: null,
      sessionUser: { tier: 'Magno' },
    });
    expect(vm.tierBase).toBe('gold');
    expect(vm.displayTier).toBe('Gold');
  });

  it('sin raws ni sessionUser → base lifemiles (fallback previo intacto)', () => {
    const vm = buildEliteDetailVM({});
    expect(vm.tierBase).toBe('lifemiles');
  });
});
