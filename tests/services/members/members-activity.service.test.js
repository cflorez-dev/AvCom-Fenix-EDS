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

  it('getRecentTransactionsSync devuelve el mock (sin cache) con el shape del molecule', async () => {
    mockDeps();
    const { getRecentTransactionsSync } = await import(servicePath);
    const tx = getRecentTransactionsSync(3);
    expect(tx).toHaveLength(3);
    expect(tx[0]).toHaveProperty('date');
    expect(tx[0]).toHaveProperty('description');
    expect(typeof tx[0].amount).toBe('number');
    expect(getRecentTransactionsSync(2)).toHaveLength(2);
  });

  it('loadRecentTransactions cae al mock cuando el wrapper no está deployado (string E.EON.12)', async () => {
    mockDeps();
    setWrapper(() => Promise.resolve('E.EON.12 - WrapperId "lmLastThreeTransactions" invalido'));
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toHaveLength(3);
    expect(tx[0].description).toBe('Redención de tiquete'); // mock fallback
  });

  it('loadRecentTransactions mapea la respuesta real del wrapper a {date,description,amount}', async () => {
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
    const { loadRecentTransactions } = await import(servicePath);
    const tx = await loadRecentTransactions(3);
    expect(tx).toHaveLength(2);
    expect(tx[0]).toEqual({ date: 'JUN 08', description: 'Lifemiles plus plan mensual', amount: 2000 });
    expect(tx[1].amount).toBe(500);
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
