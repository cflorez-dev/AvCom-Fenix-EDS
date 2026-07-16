import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersElite } from './members-elite.js';
import { setSession } from '../../../scripts/services/members/session.store.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * Sample del organism MembersElite (Fase 1a shell + 1271699 tab Progreso).
 *
 * Conduce el signal `session.store` + mockea `window.lmFetchWrapper` con los
 * 5 CONTRATOS REALES capturados en UAT (tests/fixtures/members/elite/*.json)
 * como mocks conmutables — flujo completo: session.store → raws →
 * buildEliteDetailVM → buildPanelModel → GoalProgressPanel/Cenit/HowToEarn.
 *
 * Cada botón de fixture: instala el mock del wrapper, setea la sesión y
 * REMONTA el organism (key) para que refetchee raws y recalcule alertas.
 */
const FIXTURES = [
  { name: 'lifemiles-base', label: 'LifeMiles base (82042048200)' },
  { name: 'gold', label: 'Gold (47464574706)' },
  { name: 'magno', label: 'Magno (78368923603)' },
  { name: 'magno-avstar-alto', label: 'Magno avstar 1.13M (82359028500)' },
  { name: 'diamond-cenit-1m', label: 'Diamond Cenit 1M (95939493904)' },
];

const loadFixture = async (name) => {
  const res = await fetch(`/tests/fixtures/members/elite/${name}.json`);
  if (!res.ok) throw new Error(`fixture ${name}: ${res.status}`);
  return res.json();
};

export const MembersEliteSample = () => {
  const [mountKey, setMountKey] = useState(0);
  const [activeFixture, setActiveFixture] = useState(null);
  // Mock del wrapper LM por PROP (`wrapperOverride`), NO por global: el loader
  // real de LM pisa `window.lmFetchWrapper` al cargar y rompía el e2e (fix
  // 2026-07-05). Response REAL porque los servicios validan `instanceof Response`.
  const [wrapperMock, setWrapperMock] = useState(null);

  const applyFixture = async (name) => {
    try {
      const data = await loadFixture(name);
      const mock = async (id) => new Response(
        JSON.stringify(data[id] ?? null),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
      setWrapperMock(() => mock);
      const profile = data.memberProfile?.memberProfileDetails;
      setSession({
        status: 'authenticated',
        user: {
          firstName: 'Sebastián',
          tier: profile?.memberAccount?.tier || data.eliteProgram?.tier || 'lifemiles',
          membershipNumber: profile?.memberAccount?.memberProfile?.membershipNumber || null,
          totalMiles: null,
          milesExpiryDate: null,
          statusExpiry: data.eliteProgram?.status?.expiryDate || null,
        },
      });
      setActiveFixture(name);
      setMountKey((k) => k + 1); // remonta: refetch de raws + recomputo de alertas
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[members-elite.sample] fixture', name, e);
    }
  };

  const setLoading = () => {
    setSession({ status: 'anonymous', user: null });
    setActiveFixture(null);
    setMountKey((k) => k + 1);
  };

  return html`
    <section class="p-6 flex flex-col gap-4" style=${{ background: '#EEEFF1' }}>
      <h2 class="text-2xl font-bold">MembersElite (organism · página elite + tab Progreso)</h2>
      <p class="text-sm text-[#666]">
        Elegí una cuenta UAT (fixture real) para ver el flujo completo de la tab
        Progreso; "loading" muestra el skeleton (T13). Fixture activo:
        <strong> ${activeFixture || 'ninguno'}</strong>
      </p>
      <div class="flex gap-2 flex-wrap">
        ${FIXTURES.map((f) => html`
          <${Button} key=${f.name} variant="secondary" size="sm" onClick=${() => applyFixture(f.name)}>
            ${f.label}
          </${Button}>
        `)}
        <${Button} variant="secondary" size="sm" onClick=${setLoading}>
          loading (skeleton)
        </${Button}>
      </div>
      <${MembersElite} key=${mountKey} wrapperOverride=${wrapperMock} />
    </section>
  `;
};

export default MembersEliteSample;
