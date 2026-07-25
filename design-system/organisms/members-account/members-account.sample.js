import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersAccount } from './members-account.js';
import { setSession } from '../../../scripts/services/members/session.store.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * Sample del organism MembersAccount (1279360, shell). Conduce el signal
 * `session.store` con usuarios mock (no consume wrappers LM: el header lee del VM
 * de sesión). Cada botón setea la sesión y REMONTA el organism (key) para reflejar
 * el estado; "loading" muestra el skeleton de página.
 */
const USERS = [
  {
    label: 'Gold (Sebastián)',
    user: {
      firstName: 'Sebastián',
      tier: 'Gold',
      membershipNumber: '47464574706',
      totalMiles: 10460,
      milesExpiryDate: '2026-12-31',
      statusExpiry: '2026-01-30',
    },
  },
  {
    label: 'LifeMiles base (sin Vence)',
    user: {
      firstName: 'Ana',
      tier: 'LifeMiles',
      membershipNumber: '82042048200',
      totalMiles: 1200,
      milesExpiryDate: null,
      statusExpiry: null,
    },
  },
];

export const MembersAccountSample = () => {
  const [mountKey, setMountKey] = useState(0);
  const [activeUser, setActiveUser] = useState(null);

  const applyUser = (entry) => {
    setSession({ status: 'authenticated', user: entry.user });
    setActiveUser(entry.label);
    setMountKey((k) => k + 1);
  };

  const setLoading = () => {
    setSession({ status: 'anonymous', user: null });
    setActiveUser(null);
    setMountKey((k) => k + 1);
  };

  return html`
    <section class="p-6 flex flex-col gap-4" style=${{ background: '#EEEFF1' }}>
      <h2 class="text-2xl font-bold">MembersAccount (organism · página Gestión de cuenta)</h2>
      <p class="text-sm text-[#666]">
        Elegí un usuario mock para ver el shell (header + tabs Datos|Pagos|Ajustes
        + slots vacíos); "loading" muestra el skeleton. Usuario activo:
        <strong> ${activeUser || 'ninguno'}</strong>
      </p>
      <div class="flex gap-2 flex-wrap">
        ${USERS.map((entry) => html`
          <${Button} key=${entry.label} variant="secondary" size="sm" onClick=${() => applyUser(entry)}>
            ${entry.label}
          </${Button}>
        `)}
        <${Button} variant="secondary" size="sm" onClick=${setLoading}>
          loading (skeleton)
        </${Button}>
      </div>
      <${MembersAccount} key=${mountKey} />
    </section>
  `;
};

export default MembersAccountSample;
