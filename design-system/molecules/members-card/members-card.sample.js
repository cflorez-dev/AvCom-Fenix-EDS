import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersCard } from './members-card.js';

const html = htm.bind(h);

/**
 * Sample del MembersCard (molécula · card del grid del Dashboard 1263921).
 *
 * Muestra: card normal (ícono+título+desc+chevron, toda clickable), card con
 * descripción larga (verifica el `lineClamp`), y card "externa" (target/rel).
 * Las cards van sobre fondo claro (el grid del dashboard es sobre fondo claro).
 * Los íconos son del catálogo real `/icons/` (los definitivos por card se fijan
 * en `APP_CONFIG.cards`, Paso 3).
 *
 * Redimensionar para ver el ancho fluido (la card ocupa el ancho de su columna).
 */
export const MembersCardSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#f4f4f4',
  }}>
    <h2>MembersCard (molécula · card clickable del grid)</h2>

    <div style=${{ maxWidth: '360px' }}>
      <${MembersCard}
        icon="action/assessment"
        title="Progreso Elite y beneficios"
        description="Consulta tu nivel actual, tus beneficios y tu progreso hacia el siguiente estatus."
        href="#/es/members/elite"
      />
    </div>

    <div style=${{ maxWidth: '360px' }}>
      <${MembersCard}
        icon="members/quick-book-miles"
        title="Gestionar millas"
        description="Transfiere, dona, cambia tus puntos y gestiona tus millas según tus necesidades. Texto extra para verificar el truncado a tres líneas con ellipsis en idiomas largos como francés o portugués."
        href="#/es/members/millas"
        lineClamp=${3}
      />
    </div>

    <div style=${{ maxWidth: '360px' }}>
      <${MembersCard}
        icon="action/plane"
        title="Mis viajes (externo)"
        description="Ejemplo de card con enlace externo: abre en nueva pestaña con rel noopener."
        href="https://www.avianca.com"
        target="_blank"
        rel="noopener noreferrer"
        ariaLabel="Mis viajes, abre en nueva ventana"
      />
    </div>
  </section>
`;

export default MembersCardSample;
