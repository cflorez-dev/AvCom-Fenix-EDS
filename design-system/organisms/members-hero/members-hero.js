import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { session as sessionStore } from '../../../scripts/services/members/session.store.js';
import {
  getMembersConfigSync,
  loadMembersConfig,
} from '../../../scripts/services/members/members-config.js';
import {
  getHeroLabelsSync,
  loadHeroLabels,
} from '../../../scripts/services/members/members-i18n.js';
import { getStoredLanguage } from '../../../scripts/services/header/language-country-selector.js';
import { normalizeTierKey } from '../../helpers/members-tier-theme.js';
import { resolveInitialExpanded, toTitleCaseName } from '../../helpers/members-hero-logic.js';
import { MembersHeroCompact } from '../../molecules/members-hero-compact/members-hero-compact.js';
import { MembersHeroExpanded } from '../../molecules/members-hero-expanded/members-hero-expanded.js';
import { MembersHeroSkeleton } from '../../molecules/members-hero-skeleton/members-hero-skeleton.js';

const html = htm.bind(h);

const STORAGE_KEY = 'members-hero-expanded';

// Breadcrumb labels per-locale (Figma 518:24516). El parent es la Home del portal
// Members; "Cuenta Lifemiles" es la página actual (profile).
const BREADCRUMB_LABELS = {
  es: { parent: 'Mi Lifemiles', current: 'Cuenta Lifemiles' },
  pt: { parent: 'Meu Lifemiles', current: 'Conta Lifemiles' },
  en: { parent: 'My Lifemiles', current: 'Lifemiles account' },
  fr: { parent: 'Mon Lifemiles', current: 'Compte Lifemiles' },
};

const resolveLang = () => String(
  getStoredLanguage()
  || (typeof document !== 'undefined' && document.documentElement.lang)
  || 'es',
).toLowerCase().slice(0, 2);

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const tierDisplay = (rawTier) => {
  const key = normalizeTierKey(rawTier);
  return key === 'red-plus' ? 'Red Plus' : capitalize(key);
};

/** Fecha → "Mes Dia, Año" por locale (ej. "Dic 31, 2026"). Acepta 'YYYY-MM-DD'
 * (statusExpiry) o ISO completo 'YYYY-MM-DDTHH:mm:ssZ' (milesExpiryDate del wrapper):
 * toma solo la parte de fecha para evitar el doble sufijo de tiempo. */
const formatDate = (iso, lang) => {
  if (!iso) return '';
  const dateOnly = String(iso).split('T')[0];
  const d = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    const month = new Intl.DateTimeFormat(lang, { month: 'short' }).format(d).replace('.', '');
    return `${capitalize(month)} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (e) {
    return iso;
  }
};

/**
 * MembersHero — organism orquestador del hero colapsable "Mi Lifemiles" (1263924).
 * Figma 518:21856 (comprimido) + 518:23344 (expandido) + 518:27631/27647/45854.
 *
 * Orquesta `members-hero-compact` ↔ `members-hero-expanded` con:
 *  - Toggle animado (300ms ease-out abrir / ease-in cerrar; respeta
 *    `prefers-reduced-motion` vía el CSS).
 *  - Persistencia del estado en `sessionStorage` (default inicial desde
 *    `cfg.hero.defaultState`, P2=A).
 *  - Estados: loading (skeleton de barrido), empty (placeholder por campo +
 *    mensaje configurable), error (mensaje configurable). Anónimo/expirado →
 *    no renderiza (la guardia de ruta redirige al login, Step 16).
 *
 * Lee el signal `session.store` con el idiom de `user-session.js` (el store NO
 * auto-suscribe), + `getMembersConfigSync`/`loadMembersConfig` + los copies de
 * `members-i18n` (getHeroLabelsSync/loadHeroLabels). Theme por tier lo resuelven
 * las moléculas (reciben `tier` + `tierThemes`).
 *
 * a11y: `aria-expanded` en el toggle (en las moléculas), `aria-live="polite"` en
 * el contenedor para anunciar el cambio de estado.
 *
 * ## Reutilización por superficie
 *
 * Este organism vive hoy en `/members/profile` (Cuenta Lifemiles, CU-321). El
 * mismo `MembersHero` se reutiliza en otras páginas autenticadas (Dashboard,
 * Mi Lifemiles landing, etc.) cambiando dos props:
 *
 * - `showBreadcrumb`: muestra el breadcrumb "Mi Lifemiles › Cuenta Lifemiles"
 *   (Figma 518:24516). EXCLUSIVO de `/members/profile` (default `true`). En
 *   cualquier otra superficie pasar `false` para ocultarlo — el breadcrumb
 *   global de la página ya cubre la navegación contextual.
 *
 * - `showToggle`: render del botón "Ver detalle / Ocultar detalle" que alterna
 *   compact ↔ expanded (Figma 518:22528). En `/members/profile` el hero es
 *   ESTATICO (default `false`, siempre expandido, sin botón). En Mi Lifemiles
 *   landing y otras páginas con colapsable pasar `true`.
 *
 * El bloque `members-hero` (`blocks/members-hero/members-hero.js`) detecta la
 * ruta y setea estos props + `data-surface` en `.members-hero-container` para
 * que el CSS del bloque pueda invertir también los márgenes verticales del
 * contenedor por superficie (`/members/profile` sin padding vertical; el resto
 * con padding del layout general).
 */
export const MembersHero = ({
  showBreadcrumb = true,
  showToggle = false,
} = {}) => {
  const [session, setSessionState] = useState(() => sessionStore.value);
  const [cfg, setCfg] = useState(() => getMembersConfigSync());
  const [labels, setLabels] = useState(() => getHeroLabelsSync());
  // ¿Ya resolvió el primer `loadMembersConfig`? Sin este flag, el organism
  // pinta el expanded con el PRESET local (porque `getMembersConfigSync()`
  // retorna `tierThemes: {}` en cold load) y luego —cuando el CF llega—
  // re-renderiza con el gradient del CF, generando un "flash" visible de un
  // gradient a otro. Lo evitamos manteniendo el skeleton hasta que el fetch
  // termine (success O failure: en error caemos al preset igual, pero sin
  // doble paint). Warm load (cache poblada) → arranca en `true`.
  const [cfgLoaded, setCfgLoaded] = useState(
    () => Object.keys(getMembersConfigSync().tierThemes || {}).length > 0,
  );

  // El store usa signals-core SIN integración preact → suscripción manual.
  useEffect(() => sessionStore.subscribe(setSessionState), []);

  useEffect(() => {
    let mounted = true;
    loadMembersConfig()
      .then((c) => { if (mounted) setCfg(c); })
      .catch(() => {})
      .finally(() => { if (mounted) setCfgLoaded(true); });
    loadHeroLabels().then((l) => { if (mounted) setLabels(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Estado del toggle persistido. Default inicial desde el CF (P2=A).
  // Cuando `showToggle === false` (superficie sin colapsable, ej. /members/profile)
  // forzamos `expanded = true` y NO leemos/escribimos sessionStorage: el hero
  // siempre vive expandido en esa superficie.
  const [expanded, setExpanded] = useState(() => {
    if (!showToggle) return true;
    let saved = null;
    try { saved = sessionStorage.getItem(STORAGE_KEY); } catch (e) { /* sin sessionStorage */ }
    return resolveInitialExpanded(saved, getMembersConfigSync().hero?.defaultState);
  });
  // Dirección de la última transición (para el easing: abrir=ease-out, cerrar=ease-in).
  const [collapsing, setCollapsing] = useState(false);

  // onToggle sólo se cablea cuando la superficie permite colapsar. Cuando
  // `showToggle === false`, las moléculas reciben `onToggle = null` y no
  // pintan el botón.
  const onToggle = showToggle ? () => {
    setExpanded((v) => {
      const next = !v;
      setCollapsing(!next);
      try { sessionStorage.setItem(STORAGE_KEY, String(next)); } catch (e) { /* ignore */ }
      return next;
    });
  } : null;

  const { status, user } = session;
  const hero = cfg.hero || {};
  const lang = resolveLang();

  // Anónimo / expirado → la guardia de ruta redirige; el hero no pinta nada.
  if (status === 'anonymous' || status === 'expired') return null;

  // Error de servicio → mensaje configurable (el modal CMS-driven es 1255601).
  if (status === 'error') {
    return html`
      <div
        class="members-hero rounded-2xl bg-[#1b1b1b] text-white px-4 py-6 text-center"
        data-name="members-hero"
        data-state="error"
        role="alert"
      >
        <p class="!m-0 text-base">${labels.errorMessage}</p>
      </div>
    `;
  }

  // Loading: autenticado pero el VM aún no resolvió (cold load, sin cache) O
  // el config aún no terminó de cargar (evita render con preset y posterior
  // re-render con CF → "flash" de gradiente). Skeleton matchea geometría del
  // hero EXPANDIDO (Figma 518:24796 mobile / 518:24717 tablet / 518:24636
  // desktop) con barrido lateral continuo, bg `#d5d5d5`.
  //
  // Padding: el skeleton reproduce EXACTAMENTE el padding que aplicará el
  // molecule destino según el estado guardado (`expanded` viene de
  // sessionStorage). Así, al hidratar el hero real, el contenido queda en la
  // MISMA coordenada X/Y y no hay salto vertical/horizontal (CLS 0). Ver
  // paddings de `MembersHeroCompact.js` y `MembersHeroExpanded.js`:
  //   - Expanded → px-16 pt-24 pb-16 / md:px-24 md:pt-32 md:pb-24 / lg:p-32
  //   - Compact  → pt-24 pb-16 px-16 (mobile+tablet) / lg:py-16 lg:px-32
  // Nota: en mobile ambos coinciden (24/16/16/16); las diferencias aparecen
  // en tablet (8px pt) y desktop (16px py). Sin este switch el skeleton pinta
  // el layout de expanded aunque el usuario vaya a caer en compact.
  const loadingPaddingClasses = expanded
    ? 'px-[16px] pt-[24px] pb-[16px] md:px-[24px] md:pt-[32px] md:pb-[24px] lg:p-[32px]'
    : 'pt-[24px] pb-[16px] px-[16px] lg:py-[16px] lg:px-[32px]';
  if (status === 'authenticated' && (!user || !cfgLoaded)) {
    return html`
      <div
        class=${`members-hero rounded-2xl overflow-hidden bg-[#d5d5d5] ${loadingPaddingClasses}`}
        data-name="members-hero"
        data-state="loading"
        data-target-state=${expanded ? 'expanded' : 'compact'}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="sr-only">${labels.emptyTitle}</span>
        <${MembersHeroSkeleton} />
      </div>
    `;
  }

  if (status !== 'authenticated' || !user) return null;

  // --- Derivación de props desde el VM + config + copies (todo formateado acá) ---
  const placeholder = labels.placeholder || '—';
  const numberFmt = (n) => {
    try { return new Intl.NumberFormat(lang).format(n); } catch (e) { return String(n); }
  };

  const firstName = user.firstName || '';
  const greeting = (labels.greeting || 'Hola, {name}').replace('{name}', firstName || '');
  const tierLabel = tierDisplay(user.tier);

  const metricsEmpty = user.totalMiles == null
    && user.milesExpiryDate == null
    && user.statusExpiry == null
    && !user.elite;

  const milesLabelValue = user.totalMiles != null
    ? `${numberFmt(user.totalMiles)} ${labels.milesUnit || ''}`.trim()
    : placeholder;

  const viewProfileUrl = cfg.viewProfileUrl || null;

  // Empty: el wrapper no devolvió métricas. Mostramos compact con placeholders +
  // mensaje, sin toggle (no hay nada que expandir).
  if (metricsEmpty) {
    return html`
      <div class="members-hero" data-name="members-hero" data-state="empty" aria-live="polite">
        <div class="members-hero__state">
          <${MembersHeroCompact}
            firstName=${firstName}
            greetingLabel=${labels.greeting}
            tier=${user.tier}
            tierThemes=${cfg.tierThemes}
            tierLabel=${tierLabel}
            totalMilesLabel=${placeholder}
            toggleLabel=${labels.viewDetail}
            viewProfileLabel=${labels.viewProfile}
            viewProfileUrl=${viewProfileUrl}
            onToggle=${null}
            borderAccentColor=${hero.borderAccentColor}
          />
          <p class="!mt-2 !mb-0 text-sm text-[#5a5a5a]">${labels.emptyMessage}</p>
        </div>
      </div>
    `;
  }

  // Props del grid (valores ya formateados; campos ausentes → placeholder).
  const grid = {
    milesLabel: labels.milesLabel,
    milesValue: milesLabelValue,
    expiryLabel: labels.expiryLabel,
    expiryValue: user.milesExpiryDate ? formatDate(user.milesExpiryDate, lang) : placeholder,
    statusLabel: labels.statusLabel,
    statusValue: tierLabel,
    // Vigencia del estatus: con el mismo criterio de "Fecha de vencimiento" de las
    // millas, un socio SIN vigencia (tier base, que no tiene estatus elite) muestra el
    // placeholder en vez de omitir la línea — si no, la sección Estatus queda sin el
    // renglón que define el diseño y el bloque se ve incompleto (1284699).
    statusExpiryText: `${labels.statusExpiryPrefix} ${
      user.statusExpiry ? formatDate(user.statusExpiry, lang) : placeholder
    }`,
    membershipLabel: labels.membershipLabel,
    membershipNumber: user.membershipNumber,
    copyAriaLabel: labels.copyAriaLabel,
    copiedLabel: labels.copiedLabel,
  };

  // Single-condition flow (Diamond/diamond-cenit/Magno → 1 sola condition,
  // Figma 518:26794/27096): el copy de mantenimiento cambia a "Mantener tu
  // estatus elite {tier} en {year}". Multi-condition (Gold → 2) usa el
  // template default "Tu progreso elite {tier} para {year}".
  const eliteConditionsCount = Array.isArray(user.elite?.conditions)
    ? user.elite.conditions.length
    : 0;
  const eliteTitleMaintain = eliteConditionsCount === 1
    ? (labels.eliteTitleMaintainSingle || labels.eliteTitleMaintain)
    : labels.eliteTitleMaintain;

  const eliteCopies = {
    tierLabel: tierDisplay(user.elite?.tierTarget),
    titleMaintain: eliteTitleMaintain,
    titleEnjoy: labels.eliteTitleEnjoy,
    conditionLabels: {
      'qualifying-miles': labels.eliteCondition1,
      'avianca-miles': labels.eliteCondition2,
    },
    // Etiquetas alternativas cuando la condición se completa
    // (Figma 518:26305 / 26523). Si el spreadsheet no las define, el atom cae
    // automáticamente al label en progreso (`conditionLabels`).
    conditionLabelsCompleted: {
      'qualifying-miles': labels.eliteCondition1Completed,
      'avianca-miles': labels.eliteCondition2Completed,
    },
    tooltipContent: labels.eliteTooltip,
    tooltipAriaLabel: labels.eliteTooltipAria,
    ctaLabel: labels.viewProgress,
    // CTA "Ver progreso" (AVAEMF2P20-200): habilitado en TODAS las
    // resoluciones. Apunta a la landing elite (`/{lang}/members/profile/elite`),
    // mismo destino que la card "Mi estatus elite" (ver `members-config.js`).
    // La molecule ya soporta doble render (mobile inline con el title / desktop
    // a la derecha de las barras) con visibilidad por breakpoint.
    ctaUrl: `/${lang}/members/profile/elite`,
  };

  // `memberName` alimenta la tarjeta de membresía (bottom-left). El wrapper
  // devuelve firstName/lastName en MAYÚSCULAS ("SEBASTIÁN RUIZ"); en la card
  // los queremos en Title Case ("Sebastián Ruiz") — normalizamos acá (una sola
  // vez, en el borde donde el VM del wrapper se convierte en props de UI).
  const memberName = toTitleCaseName(
    [user.firstName, user.lastName].filter(Boolean).join(' '),
  );

  // Breadcrumb del hero (Figma 518:24516). Parent = portal Members landing.
  // EXCLUSIVO de `/members/profile`: si `showBreadcrumb === false` (Dashboard,
  // Mi Lifemiles landing, otras), no se pasa al expandido ⇒ no se renderiza.
  const bcLabels = BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.es;
  const breadcrumbItems = showBreadcrumb ? [
    { isHome: true, url: `/${lang}/members`, label: bcLabels.parent },
    { label: bcLabels.current, isActive: true },
  ] : null;

  // Quick actions del hero — fuente de datos según SURFACE:
  //  - `surface === 'profile'` (`showBreadcrumb === true`, p.ej. `/members/profile`):
  //    se RENDERIZA el CF "Quick Actions Profile" (`cfg.profile.quickActions`,
  //    AVAEMF2P20-200) en el mismo slot del hero que normalmente ocupan las
  //    quick actions del CF "hero". Así el Dashboard puede curar su propia
  //    botonera (Datos personales, Seguridad, etc.) sin duplicar contenedores.
  //  - Resto de superficies (drawer reusable, landing Members): se mantienen
  //    las del CF de hero (`hero.quickActions`: Reserva con millas, Lounges,
  //    etc.).
  // Fail-soft: si la superficie profile no trae acciones (CF apagado + sin
  // defaults), cae a las del hero para no dejar el slot vacío.
  const heroQuickActions = (showBreadcrumb && cfg.profile?.quickActions?.length)
    ? cfg.profile.quickActions
    : hero.quickActions;

  // Al terminar la transición de altura del wrapper limpiamos el flag
  // `collapsing`. Sin este reset, `data-collapsing="true"` se quedaría pegado
  // tras el primer cierre y aplicaría el easing de cierre (ease-in) también
  // en la siguiente apertura. Filtramos por `propertyName === 'height'` para
  // ignorar transitions de descendientes (skeletons, otras props).
  const handleTransitionEnd = (e) => {
    if (e.propertyName === 'height' && collapsing) setCollapsing(false);
  };

  return html`
    <div
      class="members-hero"
      data-name="members-hero"
      data-state=${expanded ? 'expanded' : 'collapsed'}
      data-collapsing=${collapsing ? 'true' : 'false'}
      aria-live="polite"
    >
      <div class="members-hero__animator" onTransitionEnd=${handleTransitionEnd}>
      <div class="members-hero__state" key=${expanded ? 'expanded' : 'collapsed'}>
        ${expanded
    ? html`
        <${MembersHeroExpanded}
          greeting=${greeting}
          tier=${user.tier}
          tierThemes=${cfg.tierThemes}
          tierLabel=${tierLabel}
          toggleLabel=${labels.hideDetail}
          onToggle=${onToggle}
          showToggle=${showToggle}
          grid=${grid}
          quickActions=${heroQuickActions}
          opensInNewWindowLabel=${labels.opensInNewWindow || ''}
          elite=${user.elite}
          eliteCopies=${eliteCopies}
          memberName=${memberName}
          logoUrl=${cfg.logoUrl}
          logoAlt=${cfg.logoAlt || 'Avianca LifeMiles'}
          formatValue=${numberFmt}
          borderAccentColor=${hero.borderAccentColor}
          breadcrumbItems=${breadcrumbItems}
          breadcrumbHomeLabel=${bcLabels.parent}
        />
      `
    : html`
        <${MembersHeroCompact}
          firstName=${firstName}
          greetingLabel=${labels.greeting}
          tier=${user.tier}
          tierThemes=${cfg.tierThemes}
          tierLabel=${tierLabel}
          totalMilesLabel=${milesLabelValue}
          toggleLabel=${labels.viewDetail}
          viewProfileLabel=${labels.viewProfile}
          viewProfileUrl=${viewProfileUrl}
          onToggle=${onToggle}
          borderAccentColor=${hero.borderAccentColor}
        />
      `}
      </div>
      </div>
    </div>
  `;
};

export default MembersHero;
