import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { InformativeModal } from './informative-modal.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * InformativeModalSample — variante confirmación (eliminar acompañante) + variante
 * error (nº LM inexistente). 1279361, Figma `1064:71640` / `1056:39858`.
 */
export const InformativeModalSample = () => {
  const [open, setOpen] = useState(null); // 'confirm' | 'error' | null
  const [deleting, setDeleting] = useState(false);

  const onDelete = () => {
    setDeleting(true);
    setTimeout(() => { setDeleting(false); setOpen(null); }, 900);
  };

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#EEEFF1',
  }}>
      <h2>InformativeModal (molécula — 1279361)</h2>
      <div style=${{ display: 'flex', gap: '12px' }}>
        <${Button} variant="secondary" size="sm" onClick=${() => setOpen('confirm')}>Abrir confirmación (eliminar)</${Button}>
        <${Button} variant="secondary" size="sm" onClick=${() => setOpen('error')}>Abrir error (nº LM)</${Button}>
      </div>

      <${InformativeModal}
        isOpen=${open === 'confirm'}
        onClose=${() => setOpen(null)}
        variant="confirm"
        title="¿Eliminar acompañante?"
        body="Esta acción no se puede deshacer."
        primaryLabel="Sí, elimínalo"
        onPrimary=${onDelete}
        primaryLoading=${deleting}
        secondaryLabel="Cancelar"
        onSecondary=${() => setOpen(null)}
      />

      <${InformativeModal}
        isOpen=${open === 'error'}
        onClose=${() => setOpen(null)}
        variant="error"
        title="No encontramos este número de Lifemiles"
        body="Verifica el número e inténtalo nuevamente."
        primaryLabel="Intentar nuevamente"
        onPrimary=${() => setOpen(null)}
      />
    </section>
  `;
};

export default InformativeModalSample;
