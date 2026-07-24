import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersCards } from './members-cards.js';

const html = htm.bind(h);

/**
 * Sample del MembersCards (organism · grid del Dashboard 1263921).
 *
 * Pasa un array de cards de muestra (prop `cards`) para verificar la LÓGICA del
 * grid ANTES de tener los defaults reales (APP_CONFIG.cards, Paso 3) y el CF:
 *  - Render en orden por `sortOrder` (se pasan desordenadas a propósito).
 *  - `visible:false` oculta una card (la 5ª de muestra no debe aparecer).
 *  - Card externa → target/rel + aria.
 *
 * Los copies van inline en cada card (el fallback del organism usa
 * `card.title`/`card.description` mientras i18n no esté cableado). El layout
 * columnar real (3col/1col) lo aporta el CSS del bloque en Paso 6; acá un grid
 * inline mínimo para previsualizar.
 */
const SAMPLE_CARDS = [
  {
    key: 'manage-miles',
    icon: 'members/quick-book-miles',
    title: 'Gestionar millas',
    description: 'Transfiere, dona, cambia tus puntos y gestiona tus millas según tus necesidades.',
    link: '#/es/members/millas',
    linkType: 'internal',
    visible: true,
    sortOrder: 4,
  },
  {
    key: 'elite-progress',
    icon: 'action/assessment',
    title: 'Progreso Elite y beneficios',
    description: 'Consulta tu nivel actual, tus beneficios y tu progreso hacia el siguiente estatus.',
    link: '#/es/members/elite',
    linkType: 'internal',
    visible: true,
    sortOrder: 1,
  },
  {
    key: 'account',
    icon: 'action/data-setting',
    title: 'Gestión de cuenta',
    description: 'Administra tu información personal, documentos de viaje, preferencias y ajustes de seguridad.',
    link: '#/es/members/profile',
    linkType: 'internal',
    visible: true,
    sortOrder: 2,
  },
  {
    key: 'my-trips',
    icon: 'action/plane',
    title: 'Mis viajes',
    description: 'Consulta tus próximos vuelos y el historial de los viajes que has realizado con Avianca.',
    link: '#/es/members/viajes',
    linkType: 'internal',
    visible: true,
    sortOrder: 3,
  },
  {
    key: 'hidden-demo',
    icon: 'action/assessment',
    title: 'Card oculta (visible:false)',
    description: 'No debe renderizarse — valida el filtro de visibilidad.',
    link: '#',
    linkType: 'internal',
    visible: false,
    sortOrder: 5,
  },
];

export const MembersCardsSample = () => html`
  <section style=${{ padding: '24px', background: '#f4f4f4' }}>
    <h2>MembersCards (organism · grid del Dashboard)</h2>
    <style>
      .members-cards-sample .members-cards-grid {
        list-style: none; margin: 0; padding: 0; display: grid; gap: 16px;
        grid-template-columns: 1fr;
      }
      @media (width >= 768px) {
        .members-cards-sample .members-cards-grid { grid-template-columns: repeat(3, 1fr); }
      }
    </style>
    <div class="members-cards-sample">
      <${MembersCards} cards=${SAMPLE_CARDS} />
    </div>
  </section>
`;

export default MembersCardsSample;
