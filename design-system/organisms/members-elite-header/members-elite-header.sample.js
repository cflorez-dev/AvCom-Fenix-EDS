import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { MembersEliteHeader } from './members-elite-header.js';
import { getEliteLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

// 8 status variants (§A) + empty. `cenit` lo pasa el sample (el organism lo lee
// del VM; en runtime lo deriva session.service.deriveCenit). Gold/Diamond CENIT
// y Lifemiles NO muestran "Vence:".
const TIERS = [
  { tier: 'LifeMiles', cenit: null },
  { tier: 'Red Plus', cenit: null },
  { tier: 'Silver', cenit: null },
  { tier: 'Gold', cenit: null },
  { tier: 'Gold Cenit One Million', cenit: { level: 1 } },
  { tier: 'Diamond', cenit: null },
  { tier: 'Diamond Cenit Two Million', cenit: { level: 2 } },
  { tier: 'Magno', cenit: null },
];

const FULL_BALANCE = { totalMiles: 10460, milesExpiryDate: '2026-12-31' };
const EMPTY_BALANCE = { totalMiles: null, milesExpiryDate: null };

/**
 * Sample del organism MembersEliteHeader: selector de los 8 tiers + estado empty.
 * Verificar en /design-system contra §A: gradientes por tier, overlay de la
 * balance box, regla "sin Vence:" (Lifemiles/CENIT), empty "0 millas" / "–", y
 * los niveles del breadcrumb al hacer resize (mobile 2 / desktop 3).
 */
export const MembersEliteHeaderSample = () => {
  const [idx, setIdx] = useState(0);
  const [empty, setEmpty] = useState(false);
  // 1279360: alterna la variante "Gestión de cuenta" (crumb activo reemplazado +
  // CTA "Mi Lifemiles ›" desktop). Con `accountVariant=false` el header elite
  // queda idéntico (props nuevas en default).
  const [accountVariant, setAccountVariant] = useState(false);
  const labels = getEliteLabelsSync();
  const current = TIERS[idx];

  return html`
    <section class="p-6 flex flex-col gap-4">
      <h2 class="text-2xl font-bold">MembersEliteHeader (organism · header por estatus)</h2>
      <div class="flex gap-2 flex-wrap">
        ${TIERS.map((t, i) => html`
          <${Button}
            key=${t.tier}
            variant=${i === idx ? 'primary' : 'secondary'}
            size="sm"
            onClick=${() => { setIdx(i); setEmpty(false); }}
          >${t.tier}</${Button}>
        `)}
        <${Button} variant=${empty ? 'primary' : 'secondary'} size="sm" onClick=${() => setEmpty(true)}>
          empty (0 millas)
        </${Button}>
        <${Button}
          variant=${accountVariant ? 'primary' : 'secondary'}
          size="sm"
          onClick=${() => setAccountVariant((v) => !v)}
        >
          ${accountVariant ? 'variante: Gestión de cuenta ✓' : 'variante: Gestión de cuenta'}
        </${Button}>
      </div>
      <${MembersEliteHeader}
        user=${{ firstName: 'Sebastián', tier: current.tier, cenit: current.cenit }}
        balance=${empty ? EMPTY_BALANCE : FULL_BALANCE}
        statusExpiry=${empty ? null : '2026-01-30'}
        tierThemes=${{}}
        labels=${labels}
        activeCrumbLabel=${accountVariant ? 'Gestión de cuenta' : null}
        headerCta=${accountVariant ? { label: 'Mi Lifemiles', href: '#', enabled: true } : null}
      />
    </section>
  `;
};

export default MembersEliteHeaderSample;
