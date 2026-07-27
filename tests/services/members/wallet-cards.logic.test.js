/* global globalThis */
import {
  describe, it, expect, beforeAll, vi,
} from 'vitest';

/**
 * Wallet cards logic (1279362 paso 5): mapping cardCode→red (5 redes + fallback),
 * masking `•••• XXXX`, chip cobrand, moneda condicional + fail-soft del wrapper.
 */
const servicePath = '../../../scripts/services/members/wallet-cards.logic.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';

let loadWalletCards;
let toWalletCardsVM;
let mapNetworkKey;
let maskCardNumber;

beforeAll(async () => {
  globalThis.window = globalThis.window || {
    location: { pathname: '/', href: 'http://localhost/', search: '' },
    history: {},
  };
  globalThis.document = globalThis.document || { cookie: '', documentElement: { lang: 'es' } };
  vi.doMock(loaderPath, () => ({
    loadLmScript: vi.fn().mockResolvedValue(undefined),
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  ({
    loadWalletCards, toWalletCardsVM, mapNetworkKey, maskCardNumber,
  } = await import(servicePath));
});

const makeResponse = (json) => new Response(JSON.stringify(json), {
  status: 200, headers: { 'Content-Type': 'application/json' },
});

describe('wallet-cards · mapNetworkKey', () => {
  it('mapea las 5 redes por cardCode', () => {
    expect(mapNetworkKey('VI', 'VISA')).toBe('visa');
    expect(mapNetworkKey('MC', 'MASTERCARD')).toBe('mastercard');
    expect(mapNetworkKey('AX', 'AMEX')).toBe('amex');
    expect(mapNetworkKey('DS', 'DISCOVER')).toBe('discover');
    expect(mapNetworkKey('DN', 'DINERS')).toBe('diners');
  });
  it('cardCode desconocido → fallback cardType lowercased; sin nada → card', () => {
    expect(mapNetworkKey('ZZ', 'JCB')).toBe('jcb');
    expect(mapNetworkKey('', '')).toBe('card');
  });
});

describe('wallet-cards · maskCardNumber', () => {
  it('normaliza a •••• + últimos 4', () => {
    expect(maskCardNumber('4111111111111111')).toBe('•••• 1111');
    expect(maskCardNumber('**** **** **** 8901')).toBe('•••• 8901');
    expect(maskCardNumber('XXXXXXXXXXXX0004')).toBe('•••• 0004');
  });
});

describe('wallet-cards · toWalletCardsVM', () => {
  it('proyecta tarjetas: red, masking, cobrand (isLifemiles/cobCodSoc) y moneda condicional', () => {
    const vm = toWalletCardsVM({
      paymentMethods: [
        {
          cardType: 'VISA', cardCode: 'VI', maskedNumber: '4111111111111111', currency: 'COP', isLifemiles: true,
        },
        // sin moneda ni cobrand
        { cardType: 'MASTERCARD', cardCode: 'MC', cardNumber: '5500000000000004' },
        // cobrand por cobCodSoc
        {
          cardType: 'AMEX', cardCode: 'AX', last4: '1005', cobCodSoc: '778',
        },
      ],
    });
    expect(vm.state).toBe('ready');
    expect(vm.cards[0]).toEqual({
      networkKey: 'visa', networkLabel: 'Visa', maskedNumber: '•••• 1111', currency: 'COP', isCobrand: true,
    });
    expect(vm.cards[1].currency).toBeNull();
    expect(vm.cards[1].isCobrand).toBe(false);
    expect(vm.cards[2].isCobrand).toBe(true);
    expect(vm.cards[2].maskedNumber).toBe('•••• 1005');
  });

  it('array vacío explícito → ready con [] (empty state); shape sin array → unavailable', () => {
    expect(toWalletCardsVM({ paymentMethods: [] })).toEqual({ state: 'ready', cards: [] });
    expect(toWalletCardsVM({ foo: 1 }).state).toBe('unavailable');
    expect(toWalletCardsVM(null).state).toBe('unavailable');
  });
});

describe('wallet-cards · loadWalletCards (fail-soft)', () => {
  it('wrapper ok → VM ready; llama con refreshLoginFlag=false', async () => {
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue(
      makeResponse({ paymentMethods: [{ cardType: 'VISA', cardCode: 'VI', maskedNumber: '4111111111111111' }] }),
    );
    const vm = await loadWalletCards();
    expect(vm.state).toBe('ready');
    expect(vm.cards).toHaveLength(1);
    expect(globalThis.window.lmFetchWrapper).toHaveBeenCalledWith(
      'lmUserPaymentMethods',
      expect.objectContaining({ country: expect.any(String), language: expect.any(String) }),
      false,
    );
  });

  it('wrapper no deployado (string E.EON) o error → unavailable', async () => {
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue('E.EON.12');
    expect((await loadWalletCards()).state).toBe('unavailable');
    globalThis.window.lmFetchWrapper = vi.fn().mockRejectedValue(new Error('net'));
    expect((await loadWalletCards()).state).toBe('unavailable');
    delete globalThis.window.lmFetchWrapper;
    expect((await loadWalletCards()).state).toBe('unavailable');
  });
});
