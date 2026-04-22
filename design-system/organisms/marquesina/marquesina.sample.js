import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Marquesina } from './marquesina.js';

const html = htm.bind(h);

/**
 * MarquesinaSample component for showcasing marquesina organism
 * @returns {import('preact').VNode} Sample showcase
 */
export const MarquesinaSample = () => {
  const sectionStyles = {
    marginBottom: 'var(--spacing-x-large, 2.4rem)',
  };

  const headingStyles = {
    fontFamily: 'var(--font-family-primary, "Red Hat Display", sans-serif)',
    fontSize: 'var(--heading-h400-size, 2.4rem)',
    fontWeight: 'var(--heading-h400-weight, 700)',
    marginBottom: 'var(--spacing-medium, 1.6rem)',
    color: 'var(--text-normal-primary, #1b1b1b)',
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
    console.log('Marquesina dismissed');
  };

  return html`
    <div style=${containerStyles}>
      <h1 style=${{ ...headingStyles, fontSize: 'var(--heading-h600-size, 3.6rem)' }}>
        Marquesina Organism
      </h1>
      <p style=${{ fontSize: '1.6rem', color: 'var(--text-normal-secondary)', marginBottom: '2.4rem' }}>
        Sticky header alert with auto-marquee scroll for overflow content. Composes the Alert atom with marquee behavior.
      </p>

      <!-- Basic Marquesina -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Basic Marquesina (Sticky)</h2>
        <${Marquesina}
          variant="informative"
          contentHTML="<p>Recuerda que los tiempos de llegada al aeropuerto El Dorado están un poco altos. <strong>Anticípate para llegar a tiempo.</strong></p>"
          alertId="demo-basic"
          dismissible=${true}
          isSticky=${true}
          marqueeMode="auto"
          onDismiss=${handleDismiss}
        />
      </section>

      <!-- Variants -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Variants</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Informative</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>Información importante para todos los pasajeros del vuelo AV123</p>"
              alertId="demo-info"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Warning</h3>
            <${Marquesina}
              variant="warning"
              contentHTML="<p><strong>Alerta:</strong> Condiciones climáticas adversas pueden afectar los horarios de vuelo</p>"
              alertId="demo-warning"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Success</h3>
            <${Marquesina}
              variant="success"
              contentHTML="<p>¡Tu vuelo está a tiempo! Abordaje en 30 minutos desde la puerta B12</p>"
              alertId="demo-success"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Promotional</h3>
            <${Marquesina}
              variant="promotional"
              contentHTML="<p>🎉 <strong>Oferta especial:</strong> Descuentos de hasta 30% en vuelos nacionales. <a href='#promo'>Ver detalles</a></p>"
              alertId="demo-promo"
              isSticky=${false}
            />
          </div>
        </div>
      </section>

      <!-- Marquee Modes -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Marquee Behavior</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Auto Marquee (activates on overflow)</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>Este es un mensaje muy largo que probablemente excederá el ancho disponible en pantallas pequeñas y medianas, por lo que se activará el comportamiento de marquee automático para permitir que los usuarios lean todo el contenido mediante el scroll horizontal automático. El marquee se pausará cuando el usuario pase el mouse sobre el mensaje.</p>"
              alertId="demo-auto-marquee"
              marqueeMode="auto"
              marqueeSpeed=${50}
              isSticky=${false}
            />
            <p style=${{ fontSize: '1.4rem', color: '#666', marginTop: '0.8rem' }}>
              <em>Reduce el ancho del navegador para ver el efecto marquee. Hover para pausar.</em>
            </p>
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Always Marquee (forced scroll)</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>Contenido con scroll forzado aunque sea corto</p>"
              alertId="demo-always-marquee"
              marqueeMode="always"
              marqueeSpeed=${30}
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Never Marquee (truncate or wrap)</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>Este contenido nunca hará scroll horizontal, se truncará o hará wrap según los estilos CSS aplicados</p>"
              alertId="demo-never-marquee"
              marqueeMode="never"
              isSticky=${false}
            />
          </div>
        </div>
      </section>

      <!-- Dismiss Strategies -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Dismiss Persistence</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Session Persistence (default)</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>Se oculta hasta cerrar el navegador (sessionStorage)</p>"
              alertId="demo-session"
              dismissStrategy="session"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Permanent Persistence</h3>
            <${Marquesina}
              variant="warning"
              contentHTML="<p>Se oculta permanentemente (localStorage)</p>"
              alertId="demo-permanent"
              dismissStrategy="permanent"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>No Persistence</h3>
            <${Marquesina}
              variant="success"
              contentHTML="<p>Reaparece al recargar (sin storage)</p>"
              alertId="demo-none"
              dismissStrategy="none"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Not Dismissible</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>No se puede cerrar - mensaje crítico permanente</p>"
              alertId="demo-not-dismissible"
              dismissible=${false}
              isSticky=${false}
            />
          </div>
        </div>
      </section>

      <!-- Icons -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Custom Icons</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Clock Icon</h3>
            <${Marquesina}
              variant="informative"
              icon="action/alarm"
              contentHTML="<p>Recuerda llegar 2 horas antes para vuelos internacionales</p>"
              alertId="demo-icon-clock"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Plane Icon</h3>
            <${Marquesina}
              variant="success"
              icon="action/plane"
              contentHTML="<p>Tu vuelo está listo para abordar desde la puerta B12</p>"
              alertId="demo-icon-plane"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>No Icon</h3>
            <${Marquesina}
              variant="promotional"
              icon="none"
              contentHTML="<p>Mensaje sin icono</p>"
              alertId="demo-no-icon"
              isSticky=${false}
            />
          </div>
        </div>
      </section>

      <!-- Rich Content -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Rich Text Content</h2>
        
        <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-16, 1.6rem)' }}>
          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Multiple Links</h3>
            <${Marquesina}
              variant="informative"
              contentHTML="<p>Consulta nuestras <a href='#policies'>políticas de equipaje</a> y <a href='#checkin'>proceso de check-in</a> antes de viajar. También puedes revisar <a href='#faq'>preguntas frecuentes</a>.</p>"
              alertId="demo-links"
              isSticky=${false}
            />
          </div>

          <div>
            <h3 style=${{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Mixed Formatting</h3>
            <${Marquesina}
              variant="warning"
              contentHTML="<p><strong>Importante:</strong> Todos los pasajeros deben <em>presentar documento de identidad</em> al abordar. <a href='#docs'>Ver requisitos</a></p>"
              alertId="demo-mixed"
              isSticky=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sticky Example -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Sticky Example (scroll down)</h2>
        <p style=${{ fontSize: '1.4rem', color: '#666', marginBottom: '1.6rem' }}>
          La siguiente marquesina permanecerá visible en la parte superior al hacer scroll
        </p>
        <${Marquesina}
          variant="promotional"
          contentHTML="<p>🎉 <strong>Sticky Marquesina:</strong> Este mensaje permanece visible mientras haces scroll</p>"
          alertId="demo-sticky"
          isSticky=${true}
          dismissible=${true}
        />
        
        <div style=${{
    height: '150vh', padding: '2rem', backgroundColor: '#f5f5f5', marginTop: '2rem', borderRadius: '8px',
  }}>
          <h3>Scroll Content</h3>
          <p>Haz scroll hacia abajo para ver cómo la marquesina permanece en la parte superior...</p>
          <p style=${{ marginTop: '20rem' }}>Contenido de ejemplo...</p>
          <p style=${{ marginTop: '20rem' }}>Más contenido...</p>
          <p style=${{ marginTop: '20rem' }}>Final del contenido de scroll</p>
        </div>
      </section>

      <!-- Technical Details -->
      <section style=${sectionStyles}>
        <h2 style=${headingStyles}>Technical Features</h2>
        <div style=${{
    backgroundColor: '#f5f5f5',
    padding: 'var(--spacing-medium, 1.6rem)',
    borderRadius: 'var(--border-radius-small, 0.8rem)',
    fontFamily: 'var(--font-family-primary, "Red Hat Display", sans-serif)',
  }}>
          <ul style=${{ margin: '0', paddingLeft: '2rem' }}>
            <li><strong>Composition:</strong> Uses Alert atom as base</li>
            <li><strong>Sticky positioning:</strong> CSS <code>position: sticky</code> with <code>z-index: 50</code></li>
            <li><strong>Auto-marquee detection:</strong> Detects content overflow via <code>scrollWidth</code></li>
            <li><strong>Pause on hover:</strong> Animation pauses when user hovers</li>
            <li><strong>Configurable speed:</strong> Marquee speed in pixels/second</li>
            <li><strong>Dismiss persistence:</strong> sessionStorage (session) or localStorage (permanent)</li>
            <li><strong>Unique alert ID:</strong> Required for dismiss tracking</li>
            <li><strong>Rich text support:</strong> Full HTML via <code>dangerouslySetInnerHTML</code></li>
            <li><strong>Responsive:</strong> Font size adjusts on mobile</li>
            <li><strong>Accessible:</strong> ARIA labels, keyboard navigation, focus states</li>
          </ul>
        </div>
      </section>
    </div>
  `;
};
