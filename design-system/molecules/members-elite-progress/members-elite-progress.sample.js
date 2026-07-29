import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersEliteProgress } from './members-elite-progress.js';

const html = htm.bind(h);

const fmt = (n) => new Intl.NumberFormat('es-CO').format(n);

const LABELS = {
  'qualifying-miles': 'Millas totales calificables',
  'avianca-miles': 'Millas requeridas con avianca',
};
// Labels alternativos para cuando la condición se completa (Figma 518:26305 /
// 518:26411 / 518:26523 / 518:26627). El atom los usa automáticamente si
// `completed === true`.
const LABELS_COMPLETED = {
  'qualifying-miles': 'Millas calificables completadas',
  'avianca-miles': 'Millas requeridas con avianca completadas',
};
const TOOLTIP = 'Completa 20,000 millas calificables totales, de las cuales 8,000 millas deben ser con avianca.';

const GOLD = {
  year: 2027,
  tierTarget: 'gold',
  conditions: [
    // Valores tomados directamente del Figma desktop 518:26144
    // (qualifying 5,400/20,000 ≈ 27%; avianca 3,500/8,000 ≈ 44%).
    { key: 'qualifying-miles', value: 5400, goal: 20000 },
    { key: 'avianca-miles', value: 3500, goal: 8000 },
  ],
};
// Empty state (Figma 518:25999 desktop / 518:26071 mobile): ambas barras en 0.
// Se renderiza con `ctaUrl` para verificar el layout mobile (CTA inline con
// title en header row) y desktop (CTA a la derecha de las barras).
const EMPTY = {
  year: 2027,
  tierTarget: 'gold',
  conditions: [
    { key: 'qualifying-miles', value: 0, goal: 20000 },
    { key: 'avianca-miles', value: 0, goal: 8000 },
  ],
};
// Estado mixto (Figma 518:26289 desktop / 518:26506 mobile): condition 1
// completada → verde + check + label alterno + valor oculto; condition 2
// sigue en progreso parcial (3,500/8,000).
const PARTIAL_COMPLETED = {
  year: 2027,
  tierTarget: 'gold',
  conditions: [
    { key: 'qualifying-miles', value: 20000, goal: 20000 },
    { key: 'avianca-miles', value: 3500, goal: 8000 },
  ],
};
// Estado mixto simétrico (Figma 518:26361 desktop / 518:26576 mobile):
// condition 2 completada → verde + check + label alterno + valor oculto;
// condition 1 sigue en progreso parcial (5,400/20,000).
const PARTIAL_COMPLETED_2 = {
  year: 2027,
  tierTarget: 'gold',
  conditions: [
    { key: 'qualifying-miles', value: 5400, goal: 20000 },
    { key: 'avianca-miles', value: 8000, goal: 8000 },
  ],
};
// Estado "Tier completed (pending update)" (Figma 518:26433 desktop /
// 518:26648 mobile): AMBAS barras completas → verdes + check + labels alternos
// + valores ocultos. PERO el título NO cambia a "Disfruta…" porque el backend
// aún no actualizó el tier (la comunicación del cambio vive en la página de
// progreso — entrega posterior). El switch a `titleEnjoy` se activa con la
// prop explícita `tierAchieved=true` (ver último card del sample).
const BOTH_COMPLETED = {
  year: 2027,
  tierTarget: 'gold',
  conditions: [
    { key: 'qualifying-miles', value: 20000, goal: 20000 },
    { key: 'avianca-miles', value: 8000, goal: 8000 },
  ],
};
const MAGNO = {
  year: 2027,
  tierTarget: 'magno',
  conditions: [{ key: 'avianca-miles', value: 45000, goal: 110000 }],
};
const MAGNO_EMPTY = {
  year: 2027,
  tierTarget: 'magno',
  conditions: [{ key: 'avianca-miles', value: 0, goal: 110000 }],
};
const MAGNO_COMPLETED = {
  year: 2027,
  tierTarget: 'magno',
  conditions: [{ key: 'avianca-miles', value: 110000, goal: 110000 }],
};

// La molécula trae su PROPIO fondo blanco; la montamos sobre un backdrop oscuro
// para simular el borde inferior del hero (donde vive la tira full-width).
// `titleMaintain` se inyecta dinámicamente: en el organism cambia a
// "Mantener tu estatus elite {tier} en {year}" cuando hay 1 sola condition
// (Magno/Diamond). Aquí pasamos `titleMaintainOverride` para que el sample
// refleje la lógica del organism sin acoplarse a i18n.
const card = (
  caption,
  elite,
  tierLabel,
  ctaUrl = null,
  tierAchieved = false,
  titleMaintainOverride = null,
) => html`
  <div>
    <p style=${{ color: '#666', margin: '0 0 8px' }}>${caption}</p>
    <div style=${{ background: '#393838', padding: '24px', borderRadius: '16px' }}>
      <${MembersEliteProgress}
        elite=${elite}
        tierLabel=${tierLabel}
        titleMaintain=${titleMaintainOverride || 'Tu progreso elite {tier} para {year}'}
        titleEnjoy="Disfruta tu estatus elite {tier} en {year}"
        tierAchieved=${tierAchieved}
        conditionLabels=${LABELS}
        conditionLabelsCompleted=${LABELS_COMPLETED}
        tooltipContent=${TOOLTIP}
        formatValue=${fmt}
        ctaUrl=${ctaUrl}
      />
    </div>
  </div>
`;

/**
 * Sample del MembersEliteProgress: barra blanca full-width.
 * Cubre: en progreso, empty state con CTA, completo, Magno (1 sola condición).
 */
export const MembersEliteProgressSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
  }}>
    <h2>MembersEliteProgress (molécula · tira blanca full-width)</h2>
    ${card('En progreso (parcial) + CTA — Figma 518:26144/26216', GOLD, 'Gold', '/es/members/elite')}
    ${card('C1 completed + C2 en progreso — Figma 518:26289/26506', PARTIAL_COMPLETED, 'Gold', '/es/members/elite')}
    ${card('C2 completed + C1 en progreso — Figma 518:26361/26576', PARTIAL_COMPLETED_2, 'Gold', '/es/members/elite')}
    ${card('Empty (0/meta) + CTA — Figma 518:25999/26071', EMPTY, 'Gold', '/es/members/elite')}
    ${card('Tier completed (pending update) — Figma 518:26433/26648 · ambas verdes, título sigue siendo "Tu progreso…"', BOTH_COMPLETED, 'Gold', '/es/members/elite')}
    ${card('Tier achieved (entrega posterior) — mismo data + tierAchieved=true → switch a "Disfruta…"', BOTH_COMPLETED, 'Gold', '/es/members/elite', true)}
    ${card('Magno empty (0/110k) — Figma 518:27096 mobile · título "Mantener…"', MAGNO_EMPTY, 'Magno', '/es/members/elite', false, 'Mantener tu estatus elite {tier} en {year}')}
    ${card('Magno en progreso (45k/110k) — Figma 518:26794 desktop · título "Mantener…"', MAGNO, 'Magno', '/es/members/elite', false, 'Mantener tu estatus elite {tier} en {year}')}
    ${card('Magno completed (110k/110k) — Figma 518:26936/27134 · switch automático a "Disfruta…"', MAGNO_COMPLETED, 'Magno', '/es/members/elite', false, 'Mantener tu estatus elite {tier} en {year}')}
  </section>
`;

export default MembersEliteProgressSample;
