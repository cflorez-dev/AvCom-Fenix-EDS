import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { InformativeBanner } from './informative-banner.js';

const html = htm.bind(h);

/**
 * InformativeBannerSample component for showcasing all variations
 * @returns {import('preact').VNode} Sample showcase
 */
export const InformativeBannerSample = () => {
  const sectionStyles = {
    marginBottom: 'var(--spacing-xl, 4rem)',
  };

  const headingStyles = {
    fontFamily: 'var(--font-family-primary, "Red Hat Display", sans-serif)',
    fontSize: 'var(--heading-h400-size, 2.4rem)',
    fontWeight: 'var(--heading-h400-weight, 700)',
    marginBottom: 'var(--spacing-medium, 1.6rem)',
    color: 'var(--text-color-primary, #1b1b1b)',
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-medium, 1.6rem)',
    maxWidth: '120rem',
    margin: '0 auto',
    padding: 'var(--spacing-large, 2.4rem)',
  };

  const handleDismiss = () => {
    console.log('Banner dismissed');
  };

  return html`
    <div style=${containerStyles}>
      <h1 style=${{ ...headingStyles, fontSize: 'var(--heading-h200-size, 3.6rem)' }}>
        Informative Banner Component
      </h1>

      <!-- Type Variations -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Type Variations</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Informative Type</h3>
            <${InformativeBanner}
              type="informative"
              title="Recuerda que los tiempos de llegada al aeropuerto El Dorado están un poco altos. Anticípate para llegar a tiempo"
              showDismissButton=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Promo Type</h3>
            <${InformativeBanner}
              type="promo"
              title="¡Aprovecha nuestra promoción especial! Descuentos de hasta 30% en vuelos nacionales"
              showDismissButton=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Header Alert Type (New)</h3>
            <${InformativeBanner}
              type="header-alert"
              title="Recuerda que los tiempos de llegada al aeropuerto El Dorado están un poco altos."
              boldText="Anticípate para llegar a tiempo,"
              linkText="más información."
              linkUrl="#more-info"
              showDismissButton=${true}
              onDismiss=${handleDismiss}
              onLinkClick=${() => console.log('Link clicked')}
            />
          </div>
        </div>
      </section>

      <!-- With/Without Dismiss Button -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Dismiss Button Options</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>With Dismiss Button</h3>
            <${InformativeBanner}
              type="informative"
              title="Este banner puede ser cerrado por el usuario"
              showDismissButton=${true}
              onDismiss=${handleDismiss}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Without Dismiss Button</h3>
            <${InformativeBanner}
              type="informative"
              title="Este banner no puede ser cerrado y permanece visible"
              showDismissButton=${false}
            />
          </div>
        </div>
      </section>

      <!-- Long Text Handling -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Long Text Handling</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Short Message</h3>
            <${InformativeBanner}
              type="informative"
              title="Mensaje corto"
              showDismissButton=${true}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Medium Message</h3>
            <${InformativeBanner}
              type="informative"
              title="Este es un mensaje de longitud media que proporciona información importante al usuario sobre el estado del sistema"
              showDismissButton=${true}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Long Message</h3>
            <${InformativeBanner}
              type="informative"
              title="Este es un mensaje muy largo que demuestra cómo el componente maneja textos extensos. El banner debe ajustarse correctamente y mantener la legibilidad incluso con contenido extenso. Es importante que el diseño sea responsive y que todos los elementos se mantengan alineados correctamente independientemente de la longitud del texto."
              showDismissButton=${true}
            />
          </div>
        </div>
      </section>

      <!-- Custom Usage Examples -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Custom Usage</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>With Custom Class</h3>
            <${InformativeBanner}
              type="informative"
              title="Banner con clase CSS personalizada"
              customClassName="custom-banner-class"
              showDismissButton=${true}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Multiple Banners</h3>
            <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-8, 0.8rem)' }}>
              <${InformativeBanner}
                type="informative"
                title="Primer banner informativo"
                showDismissButton=${true}
              />
              <${InformativeBanner}
                type="promo"
                title="Segundo banner promocional"
                showDismissButton=${true}
              />
              <${InformativeBanner}
                type="informative"
                title="Tercer banner sin botón de cierre"
                showDismissButton=${false}
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Accessibility & Best Practices -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Accessibility Features</h2>
        <div style=${{
    backgroundColor: '#f5f5f5',
    padding: 'var(--spacing-medium, 1.6rem)',
    borderRadius: 'var(--border-radius-small, 0.8rem)',
    fontFamily: 'var(--font-family-primary, "Red Hat Display", sans-serif)',
  }}>
          <ul style=${{ margin: '0', paddingLeft: '2rem' }}>
            <li>Uses <code>role="alert"</code> for screen reader announcements</li>
            <li>Includes <code>aria-live="polite"</code> for dynamic content</li>
            <li>Dismiss button has <code>aria-label</code> for screen readers</li>
            <li>Icons marked as <code>aria-hidden="true"</code></li>
            <li>Keyboard accessible (Tab to focus, Enter/Space to dismiss)</li>
            <li>Focus visible states for keyboard navigation</li>
            <li>High contrast colors for readability (WCAG AA compliant)</li>
            <li>Responsive design adapts to different screen sizes</li>
          </ul>
        </div>
      </section>
    </div>
  `;
};
