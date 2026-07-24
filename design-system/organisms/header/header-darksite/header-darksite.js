import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Logo } from '../../../atoms/logo/logo.js';
import { Select } from '../../../atoms/inputs/select/select.js';

const html = htm.bind(h);

/**
 * HeaderDarksite - Header simplificado (referencia DS) para el flujo darksite.
 *
 * Contexto: en el flujo real de contingencia por emergencia aérea, el chrome
 * del interstitial (logo + selector de idioma + botón "Ir a avianca.com") lo
 * genera `scripts/services/darksite/darksite-gate.js` y se estiliza vía
 * `styles/darksite.css`. Este organismo es el equivalente "canónico" en el
 * Design System: mismo layout, mismos átomos (`Logo`, `Select`), pero
 * autónomo (sin depender de CSS externo) para que se pueda visualizar y
 * consumir desde previews u otros contextos.
 *
 * Sigue las reglas del DS:
 *   - Tailwind para layout/estructura.
 *   - CSS variables para tokens (`--spacing-*`, `--transition-all`, etc.).
 *   - Inline styles solo para colores dinámicos según `variant`.
 *
 * @param {Object} props
 * @param {'dark'|'light'} [props.variant='dark'] `dark` = landing; `light` = informativa
 * @param {string} [props.logoUrl='/']
 * @param {string} [props.logoAlt='Avianca']
 * @param {string} [props.backUrl] Solo se pinta en `light`
 * @param {string} [props.backLabel='Ir a avianca.com']
 * @param {Array<{value:string,label:string}>} [props.languageOptions]
 * @param {string} [props.defaultLanguage='es']
 * @param {(lang: string) => void} [props.onLanguageChange]
 * @param {string} [props.customClassName='']
 */

// Token único de fondo darksite: `--color-darksite-bg` en
// styles/variables/tailwind.css. Cualquier consumidor que necesite el mismo
// bg debe usar la clase `bg-darksite-bg` o `var(--color-darksite-bg)`.
const DARKSITE_BG = 'var(--color-darksite-bg)';

const wrapperStyleByVariant = {
  dark: {
    backgroundColor: DARKSITE_BG,
    color: '#ffffff',
  },
  light: {
    backgroundColor: '#ffffff',
    color: 'var(--text-normal-primary)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  },
};

const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  padding: '7.5px 12px',
  border: '1px solid #B6B6B6',
  borderRadius: '999px',
  color: 'var(--text-normal-primary)',
  backgroundColor: 'transparent',
  textDecoration: 'none',
  fontSize: 'var(--font-size-small)',
  lineHeight: '19px',
  fontWeight: 'var(--font-weight-regular)',
  transition: 'var(--transition-all)',
};

export const HeaderDarksite = ({
  variant = 'dark',
  logoUrl = '/',
  logoAlt = 'Avianca',
  backUrl,
  backLabel = 'Ir a avianca.com',
  languageOptions,
  defaultLanguage = 'es',
  onLanguageChange,
  customClassName = '',
  ...rest
}) => {
  const isLight = variant === 'light';
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

  const options = languageOptions || [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
  ];

  const selectTheme = isLight ? 'darksite-light' : 'darksite-dark';

  const handleLanguageChange = (nextValue) => {
    setSelectedLanguage(nextValue);
    if (onLanguageChange) onLanguageChange(nextValue);
  };

  const wrapperClasses = `w-full h-[76px] flex items-center ${customClassName}`.trim();
  // Padding lateral 32px en todos los breakpoints (Figma spec darksite header,
  // nodos 9611:8040 mobile y 9611:8002 desktop, ambos usan --x-x-large=32px).
  const innerClasses = 'w-full max-w-[1248px] mx-auto flex items-center justify-between h-full '
    + 'px-[var(--spacing-x-x-large)]';

  // Los SVGs del logo (assets/logos/*.svg) traen fills de color (rojo, etc.),
  // así que un `color: white` no basta. En la variante dark del interstitial
  // el logo debe ir en negativo puro (blanco): filter brightness(0)+invert(1)
  // aplicado al <picture> renderizado por el atom Logo. En light se deja el
  // color original de marca.
  const logoFilterClass = isLight ? '' : '[filter:brightness(0)_invert(1)]';

  return html`
    <div
      class=${wrapperClasses}
      data-name="headerDarksite"
      data-variant=${variant}
      style=${wrapperStyleByVariant[variant] || wrapperStyleByVariant.dark}
      ...${rest}
    >
      <div class=${innerClasses}>
        <div class="flex items-center">
          <a href=${logoUrl} aria-label=${logoAlt} class="inline-flex items-center">
            <${Logo}
              variant="primary"
              mode="desktop"
              alt=${logoAlt}
              customClassName=${logoFilterClass}
            />
          </a>
        </div>

        <div class="flex items-center gap-[var(--spacing-medium)]">
          ${isLight && backUrl && html`
            <a
              href=${backUrl}
              style=${pillStyle}
              data-name="darksiteBackButton"
            >${backLabel}</a>
          `}

          <${Select}
            theme=${selectTheme}
            options=${options}
            value=${selectedLanguage}
            onChange=${handleLanguageChange}
          />
        </div>
      </div>
    </div>
  `;
};

export default HeaderDarksite;
