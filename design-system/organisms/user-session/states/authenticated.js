import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { LoginButton } from '../../../atoms/login-button/login-button.js';
import { Sidemenu } from '../../../molecules/sidemenu/sidemenu.js';
import { MembersHeroHeader } from '../../../molecules/members-hero-header/members-hero-header.js';
import { MembersMenuList } from '../../../molecules/members-menu-list/members-menu-list.js';
import { logout } from '../../../../scripts/services/members/logout.service.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';
import { useLoginButtonVariation } from '../use-login-button-variation.js';
import { useMembersLabels } from '../use-members-labels.js';
import { useMembersConfig } from '../use-members-config.js';
import { useMembersMenuItems } from '../use-members-menu-items.js';

const html = htm.bind(h);

// El VM trae el tier como string de Lifemiles ("LifeMiles", "Gold", "Diamond"…).
// El átomo LoginButton espera la clave normalizada (kebab). Mapeamos por valor
// normalizado (sin espacios/guiones); default a la base logueada 'lifemiles'
// (nunca 'logged-out' acá, que es el estado anónimo).
// Las keys de salida matchean `config.tiers` del CF (los *-cenit caen a su base
// vía el fallback de color del botón). Los strings Cenit del servicio NO son
// exactos: verificado en QA 2026-07-15 que LM manda "Diamond Cenit One Million"
// (no "Diamond Cenit") → `diamondcenitonemillion`. Por eso el match exacto no
// alcanza y hace falta el fallback por SUBSTRING abajo.
const TIER_MAP = {
  lifemiles: 'lifemiles',
  silver: 'silver',
  gold: 'gold',
  goldcenit: 'gold-cenit',
  diamond: 'diamond',
  diamondcenit: 'diamond-cenit',
  redplus: 'red-plus',
  magno: 'magno',
};
const normalizeTier = (raw) => {
  const key = String(raw || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (TIER_MAP[key]) return TIER_MAP[key];
  // Fallback por SUBSTRING para strings de servicio no exactos (ej. Cenit
  // "Diamond Cenit One Million" → "diamondcenitonemillion"). El color se resuelve
  // por el tier base contenido; una variante Cenit comparte color con su base.
  const cenit = key.includes('cenit');
  if (key.includes('magno')) return 'magno';
  if (key.includes('diamond')) return cenit ? 'diamond-cenit' : 'diamond';
  if (key.includes('gold')) return cenit ? 'gold-cenit' : 'gold';
  if (key.includes('silver')) return 'silver';
  if (key.includes('redplus')) return 'red-plus';
  return 'lifemiles';
};

// Millas del drawer con separador de miles por locale (refinamiento 2026-07-14
// punto 2.8b) — mismo idiom que members-hero.js (la molecule pinta tal cual).
const formatMilesByLocale = (n) => {
  const lang = String(
    getStoredLanguage()
    || (typeof document !== 'undefined' && document.documentElement.lang)
    || 'es',
  ).toLowerCase().slice(0, 2);
  try { return new Intl.NumberFormat(lang).format(n); } catch (e) { return String(n); }
};

/**
 * Authenticated - estado logueado del organismo user-session (1255338).
 *
 * Muestra nombre + apellido del usuario en el header. Al click abre el
 * `Sidemenu` (drawer lateral derecho Members). Por ahora SOLO contiene la
 * acción de logout — el resto del menú (reservar con millas, mis tarjetas,
 * estatus, etc.) se construye en tickets siguientes.
 *
 * Logout: llama `logout()` (logout.service) → `window.lmLogout()`, que borra las
 * cookies de LM, mata la sesión SSO de Keycloak y redirige al puente
 * `/{lang}/members/auth/redirect-logout`. Ahí
 * (`scripts/services/members/members-auth.route.js#handleRedirectLogout`) se limpia
 * el estado a `anonymous`, se emite el evento cross-tab y se vuelve al home del POS.
 * No llamamos `setSession` directamente acá para mantener una sola fuente de verdad.
 *
 * ## Props
 * - `user`: VM de sesión del session.store ({ firstName, lastName, tier, ... }).
 */
export const Authenticated = ({ user }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const variation = useLoginButtonVariation();
  const labels = useMembersLabels();
  const cfg = useMembersConfig();
  // `useMembersMenuItems` consume el CF "Members Config" → menuItems[].
  // Render-immediate con DEFAULT_MENU_ITEMS y refresh cuando resuelve el CF.
  // El item con `isLogout: true` cablea automáticamente `handleLogout`; ya no
  // existe un footer explícito porque el CF dicta la posición del logout
  // (sortOrder=99 → último en la lista, con separador visual aplicado por la
  // molécula).
  const menuItems = useMembersMenuItems();

  // `labels.account` ('Mi cuenta') es el fallback transitorio mientras carga el perfil.
  // `fullName` (CON espacio) se usa SOLO para el aria-label del botón y el
  // header del drawer → los lectores de pantalla anuncian "Ana Palomares",
  // no "AnaPalomares". No se muestra visualmente.
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || labels.account;
  // Display VISIBLE en el header: `firstName + lastName` CON espacio (F8, 2026-07-16,
  // por decisión de diseño/PO). El código original los pegaba SIN espacio citando
  // Figma 14:31447 ("MaximilianoBartolomé"), pero se confirmó que va con espacio
  // ("Maximiliano Bartolomé"). Se trunca a `max-w-[136px]` con tooltip 76:12391.
  // Si solo hay firstName caemos a firstName; si no hay nada, al fullName
  // (que a su vez cae a labels.account).
  let displayName;
  if (user?.firstName && user?.lastName) displayName = `${user.firstName} ${user.lastName}`;
  else displayName = user?.firstName || fullName;
  const tier = normalizeTier(user?.tier);
  // Iniciales para el chip (≤767 y 1024–1149): 1ª letra de nombre + 1ª de apellido.
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((s) => s.trim()[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // logout real: window.lmLogout() borra las cookies de LM + mata la sesión SSO y
  // redirige al puente redirect-logout. Capturamos el rechazo para no dejar un
  // uncaught rejection (el servicio ya cae a un fallback local si LM no está).
  const handleLogout = () => {
    logout().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[user-session] logout() falló:', error);
    });
  };

  // El overlay del Sidemenu (fixed z-[9999]) vive dentro de .header-user-actions
  // (z-10), debajo de .header-container (z-20, logo/nav). Mientras el drawer está
  // abierto marcamos <html> para que header.css eleve .header-user-actions y el
  // overlay tape todo el header. Stacking vía z-index, NO portal (ver memoria DS).
  useEffect(() => {
    if (isMenuOpen) {
      setLiveMessage(`${labels.account || 'Menú'}: Menú de perfil, diálogo abierto`);
    } else {
      setLiveMessage(`${labels.account || 'Menú'}: Menú cerrado`);
      // clear after announcement to avoid repeated reads
      const t = setTimeout(() => setLiveMessage(''), 1200);
      return () => clearTimeout(t);
    }
  }, [isMenuOpen, labels.account]);

  useEffect(() => {
    const cls = 'members-drawer-open';
    document.documentElement.classList.toggle(cls, isMenuOpen);
    return () => document.documentElement.classList.remove(cls);
  }, [isMenuOpen]);

  // Header del drawer: HeroHeader Members con gradient por tier + status row +
  // balance card. Las URLs e items pendientes (CF "Members Config") se cablean
  // en pasos siguientes; acá solo el HeroHeader.
  //
  // Campos editables desde el CF "Members Config" (cuando esté listo el field
  // del lider, mapear `cfg.profileNameTag` y `cfg.logoUrl` acá abajo). Hoy
  // caen a los defaults del molecule (h3 + asset local del lockup AvLM).
  //
  // TODOs (datos no expuestos por toUserVM en `session.service.js`):
  //  - `totalMiles`: el wrapper LM `lmFetchWrapper('memberProfile')` trae el
  //    balance pero NO lo proyectamos al VM (ver toUserVM). Pendiente
  //    enriquecer el VM cuando UX confirme la fuente.
  //  - `expiryDate`: idem, pendiente exposer la fecha de vencimiento del balance.
  //  - `viewProfileUrl`: pendiente CF "Members Config" (futuro spreadsheet).
  //    Mientras llegue, el block lo deja en `null` y el pill se oculta.
  const drawerHeader = html`
    <${MembersHeroHeader}
      firstName=${displayName}
      nameTag=${cfg.profileNameTag || 'h3'}
      tier=${user?.tier || tier}
      tierThemes=${cfg.tierThemes}
      tierLabel=${user?.tier || ''}
      membershipNumber=${user?.membershipNumber || null}
      totalMiles=${user?.totalMiles ? formatMilesByLocale(user.totalMiles) : '— millas'}
      expiryDate=${user?.expiryDate || '—'}
      totalLabel=${labels.balanceTotal || 'Total'}
      expiryLabel=${labels.balanceExpiry || 'Fecha de vencimiento'}
      viewProfileLabel=${labels.viewProfile || 'Ver perfil'}
      viewProfileUrl=${cfg.viewProfileUrl || '#'}
      logoUrl=${cfg.logoUrl || null}
      logoAlt=${cfg.logoAlt || 'Avianca LifeMiles'}
      copyAriaLabel=${labels.copyMembership || 'Copiar número de socio'}
      copiedLabel=${labels.copied || 'Copiado'}
      closeAriaLabel=${labels.closeMenu || 'Cerrar menú'}
      onClose=${() => setMenuOpen(false)}
    />
  `;

  // Drawer body: el listado de items del CF (`menuItems[]`) reemplaza al
  // antiguo footer explícito de logout. `MembersMenuList` ya filtra por
  // `visible`, ordena por `sortOrder` y aplica truncado a 2 líneas. El item
  // con `isLogout: true` se cablea a `handleLogout`.
  const drawerChildren = html`
    <${MembersMenuList}
      items=${menuItems}
      onLogout=${handleLogout}
      opensInNewWindowLabel=${labels.opensInNewWindow}
    />
  `;

  return html`
    <${LoginButton}
      tier=${tier}
      tierColors=${cfg.tiers?.[tier] || null}
      variation=${variation}
      userName=${fullName}
      userDisplayName=${displayName}
      userInitials=${initials}
      tooltipText=${labels.profileTooltip}
      aria-haspopup="dialog"
      aria-expanded=${isMenuOpen}
      onClick=${() => setMenuOpen(true)}
    />
    <div class="sr-only" role="status" aria-live="polite">${liveMessage}</div>
    <${Sidemenu}
      isOpen=${isMenuOpen}
      onClose=${() => setMenuOpen(false)}
      header=${drawerHeader}
      ariaLabel=${labels.account ? `${labels.account} - Menú de perfil` : 'Menú de perfil'}
      showCloseButton=${false}
    >
      ${drawerChildren}
    </${Sidemenu}>
  `;
};

export default Authenticated;
