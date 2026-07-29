import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersAccountSettings } from './members-account-settings.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import { getMembersConfigSync } from '../../../scripts/services/members/members-config.js';

const html = htm.bind(h);

// VM FICTICIO (mismo shape que account-profile.service). `security.hasPin:true`
// para ver el PIN en •••••; método vacío para ver el estado "Información incompleta".
const VM = {
  ok: true,
  security: { hasPin: true },
  profileParams: { membershipNumber: '99999999901' },
};

/**
 * MembersAccountSettingsSample — tab Ajustes con fixtures (1279363): 2 acordeones
 * (seguridad inline mock + opt-ins). Editar una fila de seguridad bloquea las
 * otras 2 (cross-módulo); los opt-ins arrancan ON (defaultOn) y persisten en
 * localStorage al recargar el showcase. editOpts baja la latencia del mock.
 */
export const MembersAccountSettingsSample = () => {
  const labels = getAccountLabelsSync();
  const cfg = getMembersConfigSync('es');

  return html`
    <section style=${{ padding: '24px', background: '#EEEFF1' }}>
      <h2 style=${{ marginBottom: '16px' }}>MembersAccountSettings (organism — tab Ajustes 1279363)</h2>
      <div style=${{ maxWidth: '1248px' }}>
        <${MembersAccountSettings}
          cfg=${cfg}
          labels=${labels}
          overrides=${{ vm: VM }}
          editOpts=${{ latencyMs: 400 }}
        />
      </div>
    </section>
  `;
};

export default MembersAccountSettingsSample;
