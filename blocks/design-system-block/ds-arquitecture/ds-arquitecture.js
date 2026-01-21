import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { AtomsSamples } from './atoms.samples.js';
import { MoleculesSamples } from './molecules.samples.js';
import { OrganismsSamples } from './organisms.samples.js';

const html = htm.bind(h);

export const DsArquitecture = () => html`
    <div>
        <h1>Avianca Design System</h1>
        <${AtomsSamples} />
        <${OrganismsSamples} />
        <${MoleculesSamples} />
    </div>
  `;

export default DsArquitecture;
