import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { LoginButton } from '../../../atoms/login-button/login-button.js';
import { login } from '../../../../scripts/services/members/login.service.js';
import { useLoginButtonVariation } from '../use-login-button-variation.js';
import { useMembersLabels } from '../use-members-labels.js';
import { showMembersModal } from '../../../../scripts/services/members/members-modal-host.js';

const html = htm.bind(h);

// Tope de espera del login: si LM no resuelve (script lento o config caído) dentro de este
// tiempo, paramos el spinner y mostramos "Problema de conexión" en vez de dejar al usuario
// esperando sin feedback. Ajustable (UX/PO).
const LOGIN_TIMEOUT_MS = 15000;

/**
 * Anonymous - estado no logueado del organismo user-session.
 *
 * Usa el átomo `LoginButton` en su variante `logged-out`: icono de persona inline
 * + texto + borde gris (`--color-tier-logged-out`). El átomo gestiona el icono, los
 * estados hover/active y el focus ring; acá solo cableamos el click al login.
 *
 * Click → login.service.login() (abre el login de Lifemiles, popup o redirect).
 *
 * ## Props
 * - `label`: string - texto del botón (viene de i18n, Paso 12). Fallback del átomo.
 * - `icon`: string - nombre del SVG del botón (configurable por CMS, CU-279 CA2).
 *   Si viene vacío, el átomo usa el `PersonIcon` por defecto (Figma).
 */
export const Anonymous = ({ label, icon }) => {
  const variation = useLoginButtonVariation();
  const labels = useMembersLabels();
  const [loading, setLoading] = useState(false);

  // Click → guard anti-double-click mientras `login()` resuelve el servicio de LM.
  // QA (2026-07-27) pidió NO mostrar spinner visible en el botón durante la carga
  // de la sesión: el SSO de Lifemiles ya presenta su propio loading en la vista de
  // destino y el spinner intermedio en el header se percibía como bug. Mantenemos
  // el `loading` state SOLO para bloquear disparos repetidos (línea del `return` de
  // abajo), pero NO se lo pasamos al átomo → el botón queda estático durante la
  // navegación al SSO. Si LM CUELGA (config caído → login() nunca resuelve), un
  // timeout corta la espera y muestra el modal "connection-error" via `showMembersModal`.
  const onSignIn = () => {
    if (loading) return; // evita doble disparo mientras está en curso
    setLoading(true);
    let settled = false;
    const stop = () => { if (!settled) { settled = true; setLoading(false); } };
    const timer = setTimeout(() => {
      stop();
      showMembersModal('connection-error');
    }, LOGIN_TIMEOUT_MS);
    login()
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[user-session] login() falló:', error);
        showMembersModal('connection-error');
      })
      .finally(() => { clearTimeout(timer); stop(); });
  };

  // chip (≤767 y 1024–1149) → icono persona · full (768–1023 y ≥1150) → icono + texto.
  return html`
    <${LoginButton}
      tier="logged-out"
      variation=${variation}
      loginText=${label || labels.signIn}
      icon=${icon}
      onClick=${onSignIn}
    />
  `;
};

export default Anonymous;
