import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Logo } from './logo.js';

const html = htm.bind(h);

export const LogoSample = () => html`
    <div style=${{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2>Logo Component Showcase</h2>
        <section>
            <h3>Primary Variant - Desktop and Mobile</h3>
            <${Logo} variant="primary" mode="desktop" />
            <${Logo} variant="primary" mode="mobile" />
        </section>
    </div>
  `;

export default LogoSample;
