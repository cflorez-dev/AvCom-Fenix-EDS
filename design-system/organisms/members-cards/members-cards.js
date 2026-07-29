import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { session as sessionStore } from '../../../scripts/services/members/session.store.js';
import {
  getMembersConfigSync,
  loadMembersConfig,
} from '../../../scripts/services/members/members-config.js';
import {
  getCardsLabelsSync,
  loadCardsLabels,
} from '../../../scripts/services/members/members-i18n.js';
import { completenessFromPresence } from '../../../scripts/services/members/profile-completeness.js';
import { getRecentTransactionsSync, loadRecentTransactions } from '../../../scripts/services/members/members-activity.service.js';
import { MembersCard } from '../../molecules/members-card/members-card.js';
import { MembersActivityCard } from '../../molecules/members-activity-card/members-activity-card.js';

const html = htm.bind(h);

/**
 * MembersCards — grid de cards de navegación del Dashboard (PBI 1263921, "Bloque 4").
 *
 * Organism orquestador del grid: lee la **config de cards del CF** (`cfg.cards`,
 * con fallback automático a `APP_CONFIG.cards` porque `getMembersConfigSync()`
 * mergea los defaults) y resuelve los **copies por `key` desde `members-i18n`**
 * (×4 idiomas, con fallback al CF `c.title`/`c.description` y luego a vacío).
 *
 * Mismo esqueleto cfg+i18n que `MembersHero`, pero MÁS SIMPLE: las cards de
 * navegación NO dependen del signal de sesión ni de los wrappers de Lifemiles
 * (datos por usuario = sub-track aparte). Por eso NO hay rama de
 * `session`/skeleton acá — solo cfg + i18n.
 *
 * **Escalable a N cards:** filtra `visible !== false`, ordena por `sortOrder`
 * ascendente y mapea cada card a `<MembersCard>`. La 6ª card (Multiplica/Triplica)
 * entra sin cambio de código en cuanto el CF la traiga `visible:true`.
 *
 * **Variante "Actividad de millas" (CA10):** la card con `type:'activity'` (o
 * `key === 'activity'`) renderiza `<MembersActivityCard>` (card navegable con
 * lista inline de las últimas N transacciones, data MOCK desde
 * `members-activity.service.js` mientras no exista el wrapper Lifemiles real)
 * **sólo cuando hay ≤5 cards visibles**. Con 6 cards (Figma 518:25367) el grid
 * no tiene altura para el listado, así que Activity degrada automáticamente a
 * `<MembersCard>` simple (nav card estándar).
 *
 * El layout columnar (desktop 3col / mobile 1col) lo aporta el CSS del bloque
 * (`blocks/members-cards/members-cards.css`) sobre `.members-cards-grid`; este
 * organism solo emite el contenedor semántico (`role="list"`) + la lógica.
 *
 * ## Props
 * @param {Array|null} [props.cards=null] - Override explícito de la lista de
 *   cards (para fixtures/`.sample.js`). Si es null, usa `cfg.cards` (CF →
 *   defaults). Cada card: `{ key, icon, title?, description?, link, linkType,
 *   visible, sortOrder }`.
 */
export const MembersCards = ({ cards: cardsProp = null } = {}) => {
  const [cfg, setCfg] = useState(() => getMembersConfigSync());
  const [labels, setLabels] = useState(() => getCardsLabelsSync());
  // Sesión: SOLO la usa el badge de completitud de la card `account` (las cards de
  // navegación NO dependen de sesión). El store es signals-core sin integración
  // preact → suscripción manual (idiom de MembersHero).
  const [session, setSessionState] = useState(() => sessionStore.value);
  // Transacciones de la card "Actividad de millas": first-paint síncrono
  // (cache-or-mock) + override async desde el wrapper `lmLastThreeTransactions`
  // (Login Script v1.1.0). Fail-soft al mock si el wrapper no está deployado.
  const [activityTx, setActivityTx] = useState(() => getRecentTransactionsSync(3));

  // members-config / members-i18n usan signals-core / cache sin integración
  // preact → carga manual en effect (mismo idiom que MembersHero).
  useEffect(() => {
    let mounted = true;
    loadMembersConfig().then((c) => { if (mounted) setCfg(c); }).catch(() => {});
    loadCardsLabels().then((l) => { if (mounted) setLabels(l); }).catch(() => {});
    loadRecentTransactions(3).then((tx) => { if (mounted) setActivityTx(tx); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => sessionStore.subscribe(setSessionState), []);

  // Fuente: prop explícita (fixture) → CF (cfg.cards, que ya cae a APP_CONFIG.cards).
  const source = Array.isArray(cardsProp) ? cardsProp : (cfg.cards || []);

  // Filtro + orden estables (mismo patrón que MembersMenuList): `visible`
  // ausente se trata como `true`; empate de `sortOrder` conserva orden de array.
  const cards = source
    .filter((c) => c && c.visible !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (!cards.length) return null;

  // Con ≥6 cards Activity degrada a `<MembersCard>` simple (Figma 518:25367):
  // en el grid 3×2 desktop / 2×3 tablet no cabe la lista de transacciones, así
  // que la card cae al render estándar de nav card. Con ≤5 cards (Figma
  // 518:25357 / 518:25334) se renderiza la variante con lista de transacciones
  // inline (CA10) — la card sigue siendo un `<a>` navegable, NO es collapsible.
  const useActivityList = cards.length <= 5;

  // Copy por card: i18n[key] (×4 idiomas) → CF/prop (c.title/c.description) → ''.
  const copyFor = (card) => {
    const fromI18n = (labels && labels[card.key]) || null;
    return {
      title: (fromI18n && fromI18n.title) || card.title || '',
      description: (fromI18n && fromI18n.description) || card.description || '',
    };
  };

  const opensInNewWindow = labels?.opensInNewWindow || '';

  // Badge de completitud de perfil (card `account`, 1263921). Solo si la card trae
  // `badge.enabled` Y hay sesión con el mapa de presencia (`user.profileFields`).
  // Reglas (fields/threshold) del CF (o defaults de APP_CONFIG); labels del CF con
  // fallback a i18n. Sin sesión/datos → sin badge (fail-soft).
  const badgeFor = (card) => {
    const cfgBadge = card.badge;
    if (!cfgBadge || cfgBadge.enabled === false) return null;
    const presence = session?.user?.profileFields;
    if (!presence) return null;
    const { complete } = completenessFromPresence(presence, {
      fields: cfgBadge.fields,
      threshold: cfgBadge.threshold,
    });
    const label = complete
      ? (cfgBadge.completeLabel || labels?.badgeComplete || '')
      : (cfgBadge.incompleteLabel || labels?.badgeIncomplete || '');
    if (!label) return null;
    return { label, complete };
  };

  return html`
    <ul class="members-cards-grid" data-name="members-cards" role="list">
      ${cards.map((card) => {
    const { title, description } = copyFor(card);
    const isExternal = card.linkType === 'external';
    const ariaLabel = isExternal && opensInNewWindow
      ? `${title}, ${opensInNewWindow}`
      : null;
    // CA10: card "Actividad de millas" usa molecule propio (lista de las
    // últimas N transacciones inline). Data MOCK por ahora (wrapper Lifemiles
    // pendiente — ver `members-activity.service.js`). Cuando exista el wrapper,
    // se intercambia `getRecentTransactionsSync` por el load async sin tocar el
    // organism.
    //
    // Con 6 cards la lista se desactiva (`useActivityList=false`) y la card de
    // Activity cae al render estándar de `<MembersCard>` — ver Figma 518:25367.
    // Por eso el guard incluye `useActivityList`.
    if ((card.type === 'activity' || card.key === 'activity') && useActivityList) {
      const i18nCard = (labels && labels[card.key]) || {};
      const previewCount = card?.activity?.previewCount ?? 3;
      // `activityTx` = data real del wrapper (o mock si no está deployado), cargada
      // async en el effect. Se corta a `previewCount` (reducible desde el CF).
      const transactions = activityTx.slice(0, previewCount);
      return html`
        <li class="members-cards-item" data-key=${card.key} role="listitem">
          <${MembersActivityCard}
            icon=${card.icon}
            title=${title}
            lastTransactionsLabel=${description || i18nCard.description || ''}
            emptyLabel=${i18nCard.emptyLabel || ''}
            transactions=${transactions}
            href=${card.link || '#'}
            target=${isExternal ? '_blank' : null}
            rel=${isExternal ? 'noopener noreferrer' : null}
            ariaLabel=${ariaLabel}
          />
        </li>
      `;
    }
    return html`
      <li class="members-cards-item" data-key=${card.key} role="listitem">
        <${MembersCard}
          icon=${card.icon}
          title=${title}
          description=${description}
          href=${card.link || '#'}
          target=${isExternal ? '_blank' : null}
          rel=${isExternal ? 'noopener noreferrer' : null}
          ariaLabel=${ariaLabel}
          badge=${badgeFor(card)}
        />
      </li>
    `;
  })}
    </ul>
  `;
};

export default MembersCards;
