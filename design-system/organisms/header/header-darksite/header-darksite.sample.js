import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { HeaderDarksite } from './header-darksite.js';

const html = htm.bind(h);

const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

// Cada instancia tiene un `Select` con dropdown flotante. En el preview del DS
// renderizamos dos headers seguidos, así que aislamos cada sección con
// `isolation: isolate` + z-index decreciente para que el dropdown del primero
// se dibuje siempre encima del segundo header.
const previewSection = (zIndex) => ({
  marginTop: '32px',
  position: 'relative',
  isolation: 'isolate',
  zIndex,
});

export const HeaderDarksiteSample = () => html`
  <div style=${{ padding: '40px 0', maxWidth: '100%' }}>
    <h2 style=${{ padding: '0 40px' }}>Header Darksite (Referencia DS)</h2>
    <p style=${{ padding: '0 40px', color: '#5a5a5a', maxWidth: '760px' }}>
      Header simplificado de referencia para el flujo de contingencia (darksite).
      Consume los átomos <code>Logo</code> y <code>Select</code> con
      <code>theme="darksite-dark|darksite-light"</code>. La activación real del
      darksite en el sitio se controla vía el Content Fragment
      <code>getDarksiteConfig</code> y el gate en
      <code>scripts/services/darksite/</code>.
    </p>

    <section style=${previewSection(3)}>
      <h3 style=${{ padding: '0 40px' }}>Darksite Dark — Landing de emergencia</h3>
      <p style=${{ padding: '0 40px', color: '#5a5a5a' }}>Fondo <code>#3F4448</code>, logo primario, selector dark.</p>
      <${HeaderDarksite}
        variant="dark"
        languageOptions=${languageOptions}
      />
    </section>

    <section style=${previewSection(2)}>
      <h3 style=${{ padding: '0 40px' }}>Darksite Light — Página informativa</h3>
      <p style=${{ padding: '0 40px', color: '#5a5a5a' }}>Fondo blanco, botón "Ir a avianca.com" + selector light.</p>
      <${HeaderDarksite}
        variant="light"
        backUrl="https://www.avianca.com"
        backLabel="Ir a avianca.com"
        languageOptions=${languageOptions}
      />
    </section>
  </div>
`;

export default HeaderDarksiteSample;
