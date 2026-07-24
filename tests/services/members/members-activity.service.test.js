/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const servicePath = '../../../scripts/services/members/members-activity.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

const mockDeps = () => {
  vi.doMock(loaderPath, () => ({ whenLmReady: vi.fn().mockResolvedValue(undefined) }));
  vi.doMock(langPath, () => ({
    getStoredLanguage: () => 'es',
    getStoredCountry: () => 'col',
    getStoredCurrency: () => 'COP',
    normalizeToIsoCountry: () => 'co',
  }));
};

// Response OK con el JSON del wrapper (Node/undici expone `Response` global).
const mkResponse = (json) => new Response(JSON.stringify(json), { status: 200 });
const setWrapper = (impl) => { globalThis.window = { lmFetchWrapper: vi.fn(impl) }; };

describe('members/members-activity.service', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); delete globalThis.window; });

  it('getRecentTransactionsSync devuelve null sin data confirmada (NUNCA mock)', async () => {
    mockDeps();
    const { getRecentTransactionsSync } = await import(servicePath);
    expect(getRecentTransactionsSync(3)).toBeNull();
  });

  it('wrapper no deployado (string E.EON.12) → null, UNA sola llamada (sin poll)', async () => {
    mockDeps();
    setWrapper(() => Promise.resolve('E.EON.12 - WrapperId "lmLastThreeTransactions" invalido'));
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toBeNull(); // sin data → la card degrada a nav card, sin lista
    expect(globalThis.window.lmFetchWrapper.mock.calls.length).toBe(1);
  });

  it('refresh de token fallido (string E.EON.13) → null, UNA sola llamada', async () => {
    mockDeps();
    setWrapper(() => Promise.resolve('E.EON.13 - No se pudo actualizar token expirado.'));
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toBeNull();
    expect(globalThis.window.lmFetchWrapper.mock.calls.length).toBe(1);
  });

  it('wrapper devuelve null (cookies no listas) o lanza → null, sin reintentos', async () => {
    mockDeps();
    setWrapper(() => Promise.resolve(null));
    const { loadRecentTransactions } = await import(servicePath);
    expect(await loadRecentTransactions(3)).toBeNull();
    expect(globalThis.window.lmFetchWrapper.mock.calls.length).toBe(1);

    setWrapper(() => Promise.reject(new Error('boom')));
    expect(await loadRecentTransactions(3)).toBeNull();
  });

  it('mapea la respuesta real del wrapper a {date,description,amount} y cachea', async () => {
    mockDeps();
    const wrapperJson = {
      title: 'Actividad Reciente',
      transactions: [
        {
          activityType: 'STOTH', date: 'JUN 08', text: 'Lifemiles plus plan mensual', totalAmount: 2000,
        },
        {
          activityType: 'STOTH', date: 'MAY 08', text: 'Millas lifemiles+ Visa', totalAmount: 500,
        },
      ],
    };
    setWrapper(() => Promise.resolve(mkResponse(wrapperJson)));
    const { loadRecentTransactions, getRecentTransactionsSync } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toHaveLength(2);
    expect(tx[0]).toEqual({ date: 'JUN 08', description: 'Lifemiles plus plan mensual', amount: 2000 });
    expect(tx[1].amount).toBe(500);
    // data confirmada → el getter síncrono ahora la devuelve (cache)
    expect(getRecentTransactionsSync(3)).toHaveLength(2);
  });

  it('mapea la forma real ANIDADA `activityHistory.transactions` (contrato de qa)', async () => {
    mockDeps();
    const wrapperJson = {
      activityHistory: {
        title: 'Actividad Reciente',
        transactions: [{
          activityType: 'STCOB', date: 'JUL 03', text: 'Acumulación con CREDOMATIC PANAMA', totalAmount: 150000,
        }],
      },
      profileInfo: [{ type: 'lifetimeEarnings', value: '150000' }],
    };
    setWrapper(() => Promise.resolve(mkResponse(wrapperJson)));
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toEqual([
      { date: 'JUL 03', description: 'Acumulación con CREDOMATIC PANAMA', amount: 150000 },
    ]);
  });

  it('saca la fecha duplicada del `text` de LM ("… - 03-Jul-2026") pero deja la fecha en `date`', async () => {
    mockDeps();
    const wrapperJson = {
      activityHistory: {
        transactions: [
          {
            activityType: 'STCOB', date: 'JUL 03', text: 'Acumulación con CREDOMATIC PANAMA - 03-Jul-2026', totalAmount: 150000,
          },
          // guion legítimo (no fecha) → NO se toca
          {
            activityType: 'STOTH', date: 'JUN 08', text: 'Transferencia - regalo', totalAmount: 500,
          },
        ],
      },
    };
    setWrapper(() => Promise.resolve(mkResponse(wrapperJson)));
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx[0]).toEqual({ date: 'JUL 03', description: 'Acumulación con CREDOMATIC PANAMA', amount: 150000 });
    expect(tx[1].description).toBe('Transferencia - regalo'); // guion no-fecha intacto
  });

  it('data confirmada VACÍA ([]) se distingue de "sin data" (null) → emptyLabel', async () => {
    mockDeps();
    setWrapper(() => Promise.resolve(mkResponse({ activityHistory: { transactions: [] } })));
    const { loadRecentTransactions, getRecentTransactionsSync } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toEqual([]); // confirmado: el socio no tiene transacciones
    expect(getRecentTransactionsSync(3)).toEqual([]);
  });

  it('usa `activityDate` (ISO) como fecha si viene', async () => {
    mockDeps();
    const wrapperJson = {
      transactions: [{
        activityType: 'STOTH', activityDate: '2026-06-08T00:00:00Z', date: 'JUN 08', text: 'x', totalAmount: 100,
      }],
    };
    setWrapper(() => Promise.resolve(mkResponse(wrapperJson)));
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx[0].date).toBe('2026-06-08T00:00:00Z');
  });

  it('pasa los params (country ISO2 uppercase, language, currency) al wrapper', async () => {
    mockDeps();
    setWrapper(() => Promise.resolve(mkResponse({ transactions: [] })));
    const { loadRecentTransactions } = await import(servicePath);
    await loadRecentTransactions(3);
    expect(globalThis.window.lmFetchWrapper).toHaveBeenCalledWith(
      'lmLastThreeTransactions',
      { country: 'CO', language: 'es', currency: 'COP' },
      false,
    );
  });
});
