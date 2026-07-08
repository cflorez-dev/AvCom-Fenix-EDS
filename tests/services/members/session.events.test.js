/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const eventsPath = '../../../scripts/services/members/session.events.js';

/**
 * Mock de BroadcastChannel que simula varias pestañas: todas las instancias del mismo
 * nombre comparten un bus, y el emisor NO se entrega a sí mismo (igual que el estándar).
 */
function installBroadcastChannelMock() {
  const buses = new Map(); // name → Set<instance>
  class FakeBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.listeners = new Set();
      if (!buses.has(name)) buses.set(name, new Set());
      buses.get(name).add(this);
    }

    addEventListener(type, cb) { if (type === 'message') this.listeners.add(cb); }

    removeEventListener(type, cb) { if (type === 'message') this.listeners.delete(cb); }

    postMessage(data) {
      buses.get(this.name).forEach((inst) => {
        if (inst === this) return; // el emisor no se recibe a sí mismo
        inst.listeners.forEach((cb) => cb({ data }));
      });
    }

    close() { buses.get(this.name).delete(this); }
  }
  globalThis.BroadcastChannel = FakeBroadcastChannel;
  return { buses, FakeBroadcastChannel };
}

describe('members/session.events cross-tab (BroadcastChannel dedicado)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.BroadcastChannel;
  });

  it('emitCrossTab desde una "tab" llega a onCrossTab de OTRA tab (mismo canal)', async () => {
    const { FakeBroadcastChannel } = installBroadcastChannelMock();
    const { onCrossTab, MEMBERS_EVENTS } = await import(eventsPath);
    // "otra tab": un canal independiente sobre el mismo nombre
    const otherTab = new FakeBroadcastChannel('avianca/members');
    const received = [];
    onCrossTab(MEMBERS_EVENTS.LOGOUT, (p) => received.push(p));
    // emite desde la "otra tab" (no desde el canal del módulo)
    otherTab.postMessage({ event: MEMBERS_EVENTS.LOGOUT, payload: { foo: 'bar' } });
    expect(received).toEqual([{ foo: 'bar' }]);
  });

  it('solo dispara el callback del evento suscrito (filtra por event)', async () => {
    const { FakeBroadcastChannel } = installBroadcastChannelMock();
    const { onCrossTab, MEMBERS_EVENTS } = await import(eventsPath);
    const otherTab = new FakeBroadcastChannel('avianca/members');
    const logoutCb = vi.fn();
    onCrossTab(MEMBERS_EVENTS.LOGOUT, logoutCb);
    otherTab.postMessage({ event: MEMBERS_EVENTS.LOGIN_SUCCESS, payload: {} });
    expect(logoutCb).not.toHaveBeenCalled();
    otherTab.postMessage({ event: MEMBERS_EVENTS.LOGOUT, payload: {} });
    expect(logoutCb).toHaveBeenCalledTimes(1);
  });

  it('la propia tab NO recibe su propio emit (evita reaccionar al evento local)', async () => {
    installBroadcastChannelMock();
    const { emitCrossTab, onCrossTab, MEMBERS_EVENTS } = await import(eventsPath);
    const selfCb = vi.fn();
    onCrossTab(MEMBERS_EVENTS.LOGOUT, selfCb);
    emitCrossTab(MEMBERS_EVENTS.LOGOUT, {});
    expect(selfCb).not.toHaveBeenCalled();
  });

  it('off() desuscribe el listener', async () => {
    const { FakeBroadcastChannel } = installBroadcastChannelMock();
    const { onCrossTab, MEMBERS_EVENTS } = await import(eventsPath);
    const otherTab = new FakeBroadcastChannel('avianca/members');
    const cb = vi.fn();
    const sub = onCrossTab(MEMBERS_EVENTS.LOGOUT, cb);
    expect(typeof sub.off).toBe('function');
    sub.off();
    otherTab.postMessage({ event: MEMBERS_EVENTS.LOGOUT, payload: {} });
    expect(cb).not.toHaveBeenCalled();
  });

  it('sin BroadcastChannel (browsers viejos) degrada sin romper', async () => {
    // no instala el mock → typeof BroadcastChannel === 'undefined'
    const { emitCrossTab, onCrossTab, MEMBERS_EVENTS } = await import(eventsPath);
    expect(() => emitCrossTab(MEMBERS_EVENTS.LOGOUT, {})).not.toThrow();
    const sub = onCrossTab(MEMBERS_EVENTS.LOGOUT, vi.fn());
    expect(() => sub.off()).not.toThrow();
  });
});
