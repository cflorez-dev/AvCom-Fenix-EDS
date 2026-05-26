import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

// Stub — la implementación real llega en la historia del formulario MMB.
// Existe únicamente para que el import desde megamenu.js resuelva sin
// romper el bundle. Mientras tanto, renderiza un contenedor vacío.
export const MMBForm = () => html`<div class="mmb-form-pending" aria-hidden="true"></div>`;

export default MMBForm;
