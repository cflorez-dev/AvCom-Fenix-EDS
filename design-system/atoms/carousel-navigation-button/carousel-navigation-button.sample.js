import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CarouselNavigationButton } from './carousel-navigation-button.js';

const html = htm.bind(h);

/**
 * CarouselNavigationButtonSample - Showcase del componente CarouselNavigationButton
 * 
 * Muestra todas las variantes, estados y modos de posicionamiento
 * según diseño de Figma y especificaciones del Design System.
 */
export const CarouselNavigationButtonSample = () => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = (direction) => {
    setClickCount((prev) => prev + 1);
    console.log(`${direction} button clicked. Total clicks: ${clickCount + 1}`);
  };

  return html`
    <div style=${{ 
      padding: '40px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: 'var(--bg-page-lighter)',
    }}>
      
      <!-- Título Principal -->
      <h1 style=${{
        fontSize: 'var(--heading-h600-size)',
        fontWeight: 'var(--heading-h600-weight)',
        marginBottom: 'var(--spacing-x-large)',
        color: 'var(--text-normal-primary)',
      }}>
        CarouselNavigationButton - Design System
      </h1>

      <!-- Sección 1: Direcciones -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
          color: 'var(--text-normal-primary)',
        }}>
          Directions (Fixed Positioning)
        </h2>
        <div style=${{ 
          display: 'flex', 
          gap: 'var(--gap-large)', 
          alignItems: 'center',
        }}>
          <${CarouselNavigationButton}
            direction="left"
            onClick=${() => handleClick('Left')}
            absolute=${false}
          />
          
          <${CarouselNavigationButton}
            direction="right"
            onClick=${() => handleClick('Right')}
            absolute=${false}
          />
        </div>
      </section>

      <!-- Sección 2: Estados -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          States (Fixed Positioning)
        </h2>
        <div style=${{ 
          display: 'flex', 
          gap: 'var(--gap-large)', 
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-small)' }}>
            <span style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)' }}>
              Normal
            </span>
            <${CarouselNavigationButton}
              direction="left"
              onClick=${() => handleClick('Normal')}
              absolute=${false}
            />
          </div>

          <div style=${{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-small)' }}>
            <span style=${{ fontSize: 'var(--font-size-small)', color: 'var(--text-normal-secondary)' }}>
              Disabled
            </span>
            <${CarouselNavigationButton}
              direction="right"
              onClick=${() => handleClick('Disabled')}
              disabled=${true}
              absolute=${false}
            />
          </div>
        </div>
      </section>

      <!-- Sección 3: Absolute Positioning (Default) -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Absolute Positioning (Default - Carousel Overlay)
        </h2>
        <p style=${{
          fontSize: 'var(--font-size-small)',
          color: 'var(--text-normal-secondary)',
          marginBottom: 'var(--spacing-medium)',
        }}>
          Buttons positioned absolutely on left/right edges, vertically centered.
          Ideal for overlaying on carousel containers.
        </p>
        <div style=${{ 
          position: 'relative',
          width: '100%',
          height: '200px',
          backgroundColor: 'var(--bg-page-light)',
          borderRadius: 'var(--border-radius-large)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style=${{
            fontSize: 'var(--heading-h500-size)',
            color: 'var(--text-normal-secondary)',
          }}>
            Carousel Content Area
          </span>

          <${CarouselNavigationButton}
            direction="left"
            onClick=${() => handleClick('Absolute Left')}
          />
          
          <${CarouselNavigationButton}
            direction="right"
            onClick=${() => handleClick('Absolute Right')}
          />
        </div>
      </section>

      <!-- Sección 4: Fixed Positioning con Custom Layout -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Fixed Positioning (Custom Layout)
        </h2>
        <p style=${{
          fontSize: 'var(--font-size-small)',
          color: 'var(--text-normal-secondary)',
          marginBottom: 'var(--spacing-medium)',
        }}>
          Buttons without absolute positioning, placed manually in flex layout.
          Useful for custom navigation controls outside carousel container.
        </p>
        <div style=${{ 
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--gap-medium)',
          padding: 'var(--padding-medium)',
          backgroundColor: 'var(--bg-page-light)',
          borderRadius: 'var(--border-radius-large)',
        }}>
          <${CarouselNavigationButton}
            direction="left"
            onClick=${() => handleClick('Fixed Left')}
            absolute=${false}
          />
          
          <span style=${{
            flex: 1,
            textAlign: 'center',
            fontSize: 'var(--font-size-medium)',
            color: 'var(--text-normal-primary)',
          }}>
            Page ${clickCount % 5 + 1} of 5
          </span>
          
          <${CarouselNavigationButton}
            direction="right"
            onClick=${() => handleClick('Fixed Right')}
            absolute=${false}
          />
        </div>
      </section>

      <!-- Sección 5: Disabled in Absolute Mode -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Disabled States (Absolute Mode)
        </h2>
        <div style=${{ 
          position: 'relative',
          width: '100%',
          height: '160px',
          backgroundColor: 'var(--bg-page-light)',
          borderRadius: 'var(--border-radius-large)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style=${{
            fontSize: 'var(--font-size-medium)',
            color: 'var(--text-normal-secondary)',
          }}>
            First Page (Left Disabled)
          </span>

          <${CarouselNavigationButton}
            direction="left"
            onClick=${() => handleClick('Disabled Left')}
            disabled=${true}
          />
          
          <${CarouselNavigationButton}
            direction="right"
            onClick=${() => handleClick('Active Right')}
          />
        </div>
      </section>

      <!-- Sección 6: Click Counter -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
        }}>
          Interactive Example
        </h2>
        <div style=${{
          padding: 'var(--padding-large)',
          backgroundColor: 'var(--bg-page-light)',
          borderRadius: 'var(--border-radius-large)',
          textAlign: 'center',
        }}>
          <p style=${{
            fontSize: 'var(--heading-h400-size)',
            fontWeight: 'var(--heading-h400-weight)',
            marginBottom: 'var(--spacing-medium)',
            color: 'var(--text-normal-primary)',
          }}>
            Total Clicks: ${clickCount}
          </p>
          <p style=${{
            fontSize: 'var(--font-size-small)',
            color: 'var(--text-normal-secondary)',
          }}>
            Click any button above to increment the counter
          </p>
        </div>
      </section>

    </div>
  `;
};

export default CarouselNavigationButtonSample;
