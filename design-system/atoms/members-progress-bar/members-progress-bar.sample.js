import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersProgressBar } from './members-progress-bar.js';

const html = htm.bind(h);

const fmt = (n) => new Intl.NumberFormat('es-CO').format(n);

/**
 * Sample del MembersProgressBar. surface="light" (sobre barra blanca del hero) y
 * surface="dark" (sobre gradient). Cubre empty/progress/completed + loading.
 */
export const MembersProgressBarSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersProgressBar (átomo)</h2>

    <p style=${{ color: '#666', margin: 0 }}>surface="light" (barra blanca del hero):</p>
    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '520px',
  }}>
      <${MembersProgressBar} label="Millas totales calificables" value=${11460} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} label="Millas requeridas con avianca" value=${4000} goal=${8000} variant="magenta" formatValue=${fmt} />
      <${MembersProgressBar} label="Empty (0/meta)" value=${0} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} label="Completed (verde + check, valor oculto)" value=${20000} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} label="Loading skeleton" loading=${true} />
    </div>

    <p style=${{ color: '#666', margin: 0 }}>surface="dark" (sobre gradient):</p>
    <div style=${{
    background: 'linear-gradient(90deg, #88431c 0%, #ffa625 124.8%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '520px',
  }}>
      <${MembersProgressBar} surface="dark" label="Millas totales calificables" value=${11460} goal=${20000} variant="navy" formatValue=${fmt} />
      <${MembersProgressBar} surface="dark" label="Millas requeridas con avianca" value=${4000} goal=${8000} variant="magenta" formatValue=${fmt} />
    </div>

    <p style=${{ color: '#666', margin: 0 }}>
      Barra extendida (1271699 paso 8): milestones (check/flag) sobre el track,
      alto 16px, track #EEEFF1, hook FAB oculto. Distribución 2 / 4 / 5 / 6 milestones
      (redlines 765-51483):
    </p>
    <div style=${{
    background: '#ffffff',
    border: '1px solid #e5e5e5',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  }}>
      <${MembersProgressBar}
        fillPct=${12.5}
        trackColor="#EEEFF1"
        trackHeight=${16}
        fillStyle="#2B3C46"
        fabSlot=${{ pct: 12.5, kind: 'total' }}
        milestones=${[
    {
      pos: 0, label: 'Inicio', labelAlign: 'left', marker: 'flag',
    },
    {
      pos: 1, label: 'Red Plus', sublabel: '4,000', labelAlign: 'right',
    },
  ]}
      />
      <${MembersProgressBar}
        fillPct=${62.5}
        trackColor="#EEEFF1"
        trackHeight=${16}
        fillStyle="linear-gradient(90deg, #FF0000 0%, #B50080 100%)"
        fabSlot=${{ pct: 62.5, kind: 'avianca' }}
        milestones=${[
    {
      pos: 0, label: 'Inicio', labelAlign: 'left', marker: 'flag',
    },
    {
      pos: 0.5, label: 'Mantener Gold en 2027', sublabel: '8,000', state: 'success', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Diamond', sublabel: '15,000', labelAlign: 'right',
    },
  ]}
      />
      <${MembersProgressBar}
        fillPct=${50}
        trackColor="#EEEFF1"
        trackHeight=${16}
        fillStyle="#2B3C46"
        milestoneStateColor="#393838"
        milestones=${[
    { pos: 0, label: 'LifeMiles', labelAlign: 'left' },
    {
      pos: 1 / 3, label: 'Silver', sublabel: '8,000', state: 'current', labelAlign: 'center',
    },
    {
      pos: 2 / 3, label: 'Gold', sublabel: '20,000', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Diamond', sublabel: '45,000', labelAlign: 'right',
    },
  ]}
      />
      <${MembersProgressBar}
        fillPct=${25}
        trackColor="#EEEFF1"
        trackHeight=${16}
        fillStyle="#2B3C46"
        milestoneStateColor="#7D0106"
        milestones=${[
    { pos: 0, label: 'LifeMiles', labelAlign: 'left' },
    {
      pos: 0.25, label: 'Red Plus', sublabel: '4,000', state: 'current', labelAlign: 'center',
    },
    {
      pos: 0.5, label: 'Silver', sublabel: '8,000', labelAlign: 'center',
    },
    {
      pos: 0.75, label: 'Gold', sublabel: '20,000', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Diamond', sublabel: '45,000', labelAlign: 'right',
    },
  ]}
      />
      <${MembersProgressBar}
        fillPct=${80}
        trackColor="#EEEFF1"
        trackHeight=${16}
        fillStyle="linear-gradient(90deg, #FF0000 0%, #B50080 100%)"
        milestoneStateColor="#0F0F0F"
        milestones=${[
    { pos: 0, label: 'LifeMiles', labelAlign: 'left' },
    {
      pos: 0.2, label: 'Red Plus', sublabel: '1,000', labelAlign: 'center',
    },
    {
      pos: 0.4, label: 'Silver', sublabel: '2,000', labelAlign: 'center',
    },
    {
      pos: 0.6, label: 'Gold', sublabel: '8,000', labelAlign: 'center',
    },
    {
      pos: 0.8, label: 'Diamond', sublabel: '15,000', state: 'current', labelAlign: 'center',
    },
    {
      pos: 1, label: 'Magno', sublabel: '110,000', labelAlign: 'right',
    },
  ]}
      />
    </div>
  </section>
`;

export default MembersProgressBarSample;
