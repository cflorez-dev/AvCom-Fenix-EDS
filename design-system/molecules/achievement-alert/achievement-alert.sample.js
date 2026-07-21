import { h } from '@dropins/tools/preact.js';
import { useReducer } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { AchievementAlert } from './achievement-alert.js';
import { shouldShowAlert, dismissAlert } from '../../../scripts/services/members/alert-persistence.js';

const html = htm.bind(h);

const CASES = [
  {
    tier: 'red-plus', key: 'status:red-plus:2026', title: '¡Felicitaciones! Ahora eres Red Plus', body: 'Disfruta de los nuevos beneficios de tu estatus elite.',
  },
  {
    tier: 'silver', key: 'status:silver:2026', title: '¡Felicitaciones! Ahora eres Silver', body: 'Disfruta de los nuevos beneficios de tu estatus elite.',
  },
  {
    tier: 'gold', key: 'status:gold:2026', title: '¡Felicitaciones! Ahora eres Gold', body: 'Disfruta de los nuevos beneficios de tu estatus elite.',
  },
  {
    tier: 'diamond', key: 'cenit-1m:1m:2026', title: '¡Felicitaciones! Alcanzaste Cenit One Million', body: 'Ganaste de manera vitalicia todos los beneficios del estatus Diamond.',
  },
  {
    tier: 'magno', key: 'status:magno:2026', title: '¡Felicitaciones! Ahora eres Magno', body: 'Disfruta de los nuevos beneficios de tu estatus elite.',
  },
];

// Body RICH (se sanitiza con DOMPurify antes de inyectarse — el <script> debe
// desaparecer del render).
const RICH_CASE = {
  tier: 'gold',
  key: 'rich-demo:gold:2026',
  title: 'Body rich sanitizado (whitelist del repo)',
  bodyHTML: 'Texto con <strong>negrita</strong> y <em>énfasis</em>.<script>alert("xss")</script>',
};

/**
 * Sample del AchievementAlert (1271699 paso 13): un banner por tier (gradiente
 * sutil + cóndor stroke gradiente strong) + persistencia real del dismiss
 * (recargar la página: el cerrado NO reaparece; usar "reset" para limpiarlos).
 */
export const AchievementAlertSample = () => {
  const [, rerender] = useReducer((n) => n + 1, 0);

  const resetDismissed = () => {
    try {
      [...CASES, RICH_CASE].forEach((c) => window.localStorage.removeItem(`av-elite-alert:${c.key}`));
    } catch (e) { /* noop */ }
    rerender();
  };

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>AchievementAlert (molécula — 1271699)</h2>
      <button
        type="button"
        onClick=${resetDismissed}
        style=${{
    alignSelf: 'flex-start', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
  }}
      >reset alertas cerradas (localStorage)</button>

      ${[...CASES, RICH_CASE].map((c) => (shouldShowAlert(c.key) ? html`
        <${AchievementAlert}
          key=${c.key}
          tier=${c.tier}
          title=${c.title}
          body=${c.body || ''}
          bodyHTML=${c.bodyHTML || ''}
          onDismiss=${() => dismissAlert(c.key)}
        />
      ` : html`
        <p key=${c.key} style=${{ color: '#999', fontSize: '12px', margin: 0 }}>
          (${c.key} cerrada — persistida en localStorage)
        </p>
      `))}
    </section>
  `;
};

export default AchievementAlertSample;
