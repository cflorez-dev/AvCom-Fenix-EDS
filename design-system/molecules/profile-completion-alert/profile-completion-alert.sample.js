import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { ProfileCompletionAlert } from './profile-completion-alert.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';

const html = htm.bind(h);

/**
 * ProfileCompletionAlertSample — 4 estados (1279361, D35): rojo 20% / naranja
 * 60% / verde 85% / 100% con dismiss. Umbrales 50/80.
 */
export const ProfileCompletionAlertSample = () => {
  const labels = getAccountLabelsSync();
  const [dismissed, setDismissed] = useState(false);
  const [dismissedWithBody, setDismissedWithBody] = useState(false);
  const thresholds = { warning: 50, positive: 80 };
  const SECTIONS = [
    { key: 'contact', label: labels.sectionContact },
    { key: 'documents', label: labels.panelDocuments },
    { key: 'emergency', label: labels.sectionEmergency },
  ];
  const wrap = (title, node) => html`
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style=${{ color: '#666', margin: 0, fontWeight: 600 }}>${title}</p>
      ${node}
    </div>
  `;

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px', background: '#EEEFF1',
  }}>
      <h2>ProfileCompletionAlert (molécula — 1279361)</h2>
      ${wrap('Rojo — 20% (< umbral warning) · PENDIENTE-DISEÑO D35', html`
        <${ProfileCompletionAlert} percent=${20} pending=${3} sections=${SECTIONS} thresholds=${thresholds} labels=${labels} onNavigate=${() => {}} />
      `)}
      ${wrap('Naranja — 60% (warning ≤ p < positive)', html`
        <${ProfileCompletionAlert} percent=${60} pending=${2} sections=${SECTIONS.slice(0, 2)} thresholds=${thresholds} labels=${labels} onNavigate=${() => {}} />
      `)}
      ${wrap('Verde — 85% (≥ positive)', html`
        <${ProfileCompletionAlert} percent=${85} pending=${1} sections=${SECTIONS.slice(0, 1)} thresholds=${thresholds} labels=${labels} onNavigate=${() => {}} />
      `)}
      ${wrap('100% slim — sin descripción (Figma 1056:32509 / 1056:32350) + X dismiss', dismissed
    ? html`<p style=${{ color: '#1ea93c', margin: 0 }}>✔ Banner descartado (onDismiss)</p>`
    : html`<${ProfileCompletionAlert} percent=${100} pending=${0} sections=${[]} thresholds=${thresholds} labels=${labels} onDismiss=${() => setDismissed(true)} />`)}
      ${wrap('100% con descripción (showDescription=true)', dismissedWithBody
    ? html`<p style=${{ color: '#1ea93c', margin: 0 }}>✔ Banner descartado (onDismiss)</p>`
    : html`<${ProfileCompletionAlert} percent=${100} pending=${0} sections=${[]} thresholds=${thresholds} labels=${labels} showDescription=${true} onDismiss=${() => setDismissedWithBody(true)} />`)}
    </section>
  `;
};

export default ProfileCompletionAlertSample;
