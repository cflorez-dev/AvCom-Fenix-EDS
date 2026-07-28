import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersQuickAction } from './members-quick-action.js';
import { getQuickActionTokens } from '../../helpers/members-tier-theme.js';

const html = htm.bind(h);

/**
 * Sample del MembersQuickAction. Los 4 defaults de desktop del Figma (íconos =
 * placeholders, gap #3). Sobre gradient oscuro. Tab para ver foco; uno con newTab.
 *
 * Segunda tira: variante "Lifemiles" (Figma 518:23646, spec 2026-07-27) — tinta
 * el chip circular con fill `#970346` + stroke `#D7ACBF` + ícono blanco. Sirve
 * para QA visual de los tokens de tier.
 */
export const MembersQuickActionSample = () => {
  const lifemilesTokens = getQuickActionTokens('lifemiles');
  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
      <h2>MembersQuickAction (átomo)</h2>
      <p style=${{ color: '#666', margin: 0 }}>Default (chip oscuro genérico) sobre gradient del hero:</p>
      <div style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  }}>
        <${MembersQuickAction} icon="members/quick-book-miles" label="Reserva con millas" url="#" />
        <${MembersQuickAction} icon="members/quick-upgrade-business" label="Ascenso a Business" url="#" />
        <${MembersQuickAction} icon="members/quick-lounges" label="Avianca Lounges" url="#" />
        <${MembersQuickAction}
          icon="members/quick-lifemiles-plus"
          label="Lifemiles Plus"
          url="https://www.lifemiles.com"
          newTab=${true}
          ariaLabel="Lifemiles Plus, abre en nueva ventana"
        />
      </div>
      <p style=${{ color: '#666', margin: 0 }}>Tier Lifemiles (chip magenta — Figma 518:23646):</p>
      <div style=${{
    background: 'linear-gradient(90deg, #b50080 0%, #e9010d 100%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  }}>
        <${MembersQuickAction} icon="members/quick-book-miles" label="Reserva con millas" url="#" chipTokens=${lifemilesTokens} />
        <${MembersQuickAction} icon="members/quick-upgrade-business" label="Ascenso a Business" url="#" chipTokens=${lifemilesTokens} />
        <${MembersQuickAction} icon="members/quick-lounges" label="Avianca Lounges" url="#" chipTokens=${lifemilesTokens} />
        <${MembersQuickAction} icon="members/quick-lifemiles-plus" label="Lifemiles Plus" url="#" chipTokens=${lifemilesTokens} />
      </div>
    </section>
  `;
};

export default MembersQuickActionSample;
