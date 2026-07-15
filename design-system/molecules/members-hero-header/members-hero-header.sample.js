import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Sidemenu } from '../sidemenu/sidemenu.js';
import { MembersHeroHeader } from './members-hero-header.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * Sample del MembersHeroHeader. Se monta dentro del Sidemenu (sin su X propio,
 * el HeroHeader trae el botón close) para reproducir el contexto Figma.
 *
 * Importante: el `Sidemenu` por defecto pinta su propia X (`closeButtonColor`).
 * Como el HeroHeader trae su propio close, pasamos `showCloseButton={false}`.
 */
export const MembersHeroHeaderSample = () => {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState('lifemiles');
  const [withProfileUrl, setWithProfileUrl] = useState(true);
  const [withMembership, setWithMembership] = useState(true);

  return html`
    <section style=${{
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }}>
      <h2>MembersHeroHeader (drawer Members)</h2>
      <p>Tier: ${tier}</p>
      <div style=${{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        ${['lifemiles', 'gold', 'silver', 'diamond', 'red-plus', 'magno'].map((t) => html`
          <${Button}
            key=${t}
            variant=${tier === t ? 'primary' : 'secondary'}
            size="sm"
            onClick=${() => setTier(t)}
          >${t}</${Button}>
        `)}
      </div>
      <div style=${{ display: 'flex', gap: '8px' }}>
        <${Button} variant="secondary" size="sm" onClick=${() => setWithProfileUrl((v) => !v)}>
          Toggle "Ver perfil" (${withProfileUrl ? 'on' : 'off'})
        </${Button}>
        <${Button} variant="secondary" size="sm" onClick=${() => setWithMembership((v) => !v)}>
          Toggle membership (${withMembership ? 'on' : 'off'})
        </${Button}>
      </div>
      <${Button} variant="primary" size="md" onClick=${() => setOpen(true)}>
        Abrir drawer
      </${Button}>

      <${Sidemenu}
        isOpen=${open}
        onClose=${() => setOpen(false)}
        showCloseButton=${false}
        ariaLabel="Drawer Members"
        header=${html`
          <${MembersHeroHeader}
            firstName="Sebastián"
            tier=${tier}
            tierLabel="Lifemiles"
            membershipNumber=${withMembership ? '10226536986' : null}
            totalMiles="232,757 millas"
            expiryDate="Dic 31, 2026"
            totalLabel="Total"
            expiryLabel="Fecha de vencimiento"
            viewProfileLabel="Ver perfil"
            viewProfileUrl=${withProfileUrl ? '#perfil' : null}
            onClose=${() => setOpen(false)}
          />
        `}
      >
        <div style=${{ padding: '24px', color: '#666' }}>
          (Lista de items va acá — pendiente)
        </div>
      </${Sidemenu}>
    </section>
  `;
};

export default MembersHeroHeaderSample;
