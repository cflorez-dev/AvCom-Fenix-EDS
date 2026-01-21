import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { BookingBox } from './booking-box.js';

const html = htm.bind(h);

/**
 * BookingBoxSample - Showcase del componente BookingBox
 *
 * Muestra el organismo completo de búsqueda de vuelos con
 * step-based flow, validación, y comportamiento responsive.
 */
export const BookingBoxSample = () => {
  const [searchPayload, setSearchPayload] = useState(null);
  const [changeLog, setChangeLog] = useState([]);
  const [stepLog, setStepLog] = useState([]);

  // Sample action buttons
  const sampleActionButtons = [
    {
      icon: '✈️',
      text: 'Mis reservas',
      label: 'Mis reservas',
      href: '/my-bookings',
      target: '_self',
    },
    {
      icon: '🎫',
      text: 'Check-in',
      label: 'Check-in',
      href: '/check-in',
      target: '_self',
    },
    {
      icon: '📋',
      text: 'Estado de vuelo',
      label: 'Estado de vuelo',
      href: '/flight-status',
      target: '_self',
    },
  ];

  // Handlers
  const handleSearch = (payload) => {
    setSearchPayload(payload);
    // eslint-disable-next-line no-console
    console.log('🔍 Search Payload:', payload);
  };

  const handleChange = (field, value) => {
    const logEntry = `${new Date().toLocaleTimeString()} - ${field}: ${JSON.stringify(value)}`;
    setChangeLog((prev) => [logEntry, ...prev].slice(0, 10));
  };

  const handleStepOpen = (step) => {
    const logEntry = `${new Date().toLocaleTimeString()} - Opened step: ${step}`;
    setStepLog((prev) => [logEntry, ...prev].slice(0, 10));
  };

  return html`
    <div style=${{
      maxWidth: '1400px',
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
        BookingBox - Design System
      </h1>

      <p style=${{
        fontSize: 'var(--paragraph-p200-size)',
        color: 'var(--text-normal-secondary)',
        marginBottom: 'var(--spacing-x-huge)',
        lineHeight: 'var(--paragraph-p200-line-height)',
      }}>
        Organismo maestro de búsqueda de vuelos con step-based flow, validación automática,
        y comportamiento responsive (mobile sequential reveal, desktop all visible).
      </p>

      <!-- Sección 1: Ejemplo Completo -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
          color: 'var(--text-normal-primary)',
        }}>
          Ejemplo Completo con Action Buttons
        </h2>

        <div style=${{
          backgroundColor: 'white',
          padding: 'var(--padding-x-large)',
          borderRadius: 'var(--border-radius-large)',
          boxShadow: 'var(--shadow-medium)',
        }}>
          <${BookingBox}
            actionButtons=${sampleActionButtons}
            defaultTripType="round-trip"
            onSearch=${handleSearch}
            onChange=${handleChange}
            onStepOpen=${handleStepOpen}
          />
        </div>
      </section>

      <!-- Sección 3: Logs -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
          color: 'var(--text-normal-primary)',
        }}>
          Event Logs (onChange, onStepOpen, onSearch)
        </h2>

        <div style=${{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--gap-large)',
        }}>
          <!-- Search Payload -->
          <div style=${{
            backgroundColor: 'white',
            padding: 'var(--padding-large)',
            borderRadius: 'var(--border-radius-large)',
            boxShadow: 'var(--shadow-small)',
          }}>
            <h3 style=${{
              fontSize: 'var(--heading-h400-size)',
              fontWeight: 'var(--heading-h400-weight)',
              marginBottom: 'var(--spacing-medium)',
              color: 'var(--brand-primary)',
            }}>
              Last Search Payload
            </h3>
            ${searchPayload ? html`
              <pre style=${{
                fontSize: 'var(--font-size-tiny)',
                backgroundColor: 'var(--bg-page-light)',
                padding: 'var(--padding-medium)',
                borderRadius: 'var(--border-radius-small)',
                overflow: 'auto',
                maxHeight: '300px',
              }}>
                ${JSON.stringify(searchPayload, null, 2)}
              </pre>
            ` : html`
              <p style=${{
                fontSize: 'var(--paragraph-p200-size)',
                color: 'var(--text-normal-secondary)',
              }}>
                No search submitted yet
              </p>
            `}
          </div>

          <!-- Change Log -->
          <div style=${{
            backgroundColor: 'white',
            padding: 'var(--padding-large)',
            borderRadius: 'var(--border-radius-large)',
            boxShadow: 'var(--shadow-small)',
          }}>
            <h3 style=${{
              fontSize: 'var(--heading-h400-size)',
              fontWeight: 'var(--heading-h400-weight)',
              marginBottom: 'var(--spacing-medium)',
              color: 'var(--brand-primary)',
            }}>
              onChange Log (last 10)
            </h3>
            ${changeLog.length > 0 ? html`
              <ul style=${{
                fontSize: 'var(--font-size-tiny)',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                maxHeight: '300px',
                overflow: 'auto',
              }}>
                ${changeLog.map((log) => html`
                  <li key=${log} style=${{
                    padding: 'var(--spacing-tiny)',
                    borderBottom: '1px solid var(--border-stroke-default)',
                    fontFamily: 'var(--font-family-mono)',
                  }}>
                    ${log}
                  </li>
                `)}
              </ul>
            ` : html`
              <p style=${{
                fontSize: 'var(--paragraph-p200-size)',
                color: 'var(--text-normal-secondary)',
              }}>
                No changes yet
              </p>
            `}
          </div>

          <!-- Step Log -->
          <div style=${{
            backgroundColor: 'white',
            padding: 'var(--padding-large)',
            borderRadius: 'var(--border-radius-large)',
            boxShadow: 'var(--shadow-small)',
          }}>
            <h3 style=${{
              fontSize: 'var(--heading-h400-size)',
              fontWeight: 'var(--heading-h400-weight)',
              marginBottom: 'var(--spacing-medium)',
              color: 'var(--brand-primary)',
            }}>
              onStepOpen Log (last 10)
            </h3>
            ${stepLog.length > 0 ? html`
              <ul style=${{
                fontSize: 'var(--font-size-tiny)',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                maxHeight: '300px',
                overflow: 'auto',
              }}>
                ${stepLog.map((log) => html`
                  <li key=${log} style=${{
                    padding: 'var(--spacing-tiny)',
                    borderBottom: '1px solid var(--border-stroke-default)',
                    fontFamily: 'var(--font-family-mono)',
                  }}>
                    ${log}
                  </li>
                `)}
              </ul>
            ` : html`
              <p style=${{
                fontSize: 'var(--paragraph-p200-size)',
                color: 'var(--text-normal-secondary)',
              }}>
                No steps opened yet
              </p>
            `}
          </div>
        </div>
      </section>

      <!-- Sección 4: Features -->
      <section style=${{ marginBottom: 'var(--spacing-x-huge)' }}>
        <h2 style=${{
          fontSize: 'var(--heading-h500-size)',
          fontWeight: 'var(--heading-h500-weight)',
          marginBottom: 'var(--spacing-large)',
          color: 'var(--text-normal-primary)',
        }}>
          Features Implementados
        </h2>

        <div style=${{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--gap-large)',
        }}>
          ${[
            {
              title: 'Step-based Flow',
              items: [
                'Route → Dates → Passengers',
                'Auto-advance on completion',
                'Back navigation (mobile)',
                'First incomplete opens on error',
              ],
            },
            {
              title: 'Mobile Sequential',
              items: [
                'Route always visible',
                'Dates after route complete',
                'Passengers after dates complete',
                'Search button always visible',
              ],
            },
            {
              title: 'Desktop All Visible',
              items: [
                'All fields from start',
                'Overlay on step active',
                'Click overlay to close',
                'Grid layout responsive',
              ],
            },
            {
              title: 'Validation',
              items: [
                'Origin + Destination required',
                'Departure date required',
                'Return date (round-trip only)',
                'Min 1 adult passenger',
              ],
            },
            {
              title: 'Sticky Header (Desktop)',
              items: [
                'IntersectionObserver detection',
                'Fixed position on scroll',
                'Hides TripTypeToggle',
                'Hides TopActionButtons',
              ],
            },
            {
              title: 'CMS Configurable',
              items: [
                'Action buttons (max 5)',
                'Default values (origin, etc)',
                'Disabled dates by route',
                'Callbacks (search, change)',
              ],
            },
          ].map((feature) => html`
            <div
              key=${feature.title}
              style=${{
                backgroundColor: 'white',
                padding: 'var(--padding-large)',
                borderRadius: 'var(--border-radius-large)',
                boxShadow: 'var(--shadow-small)',
              }}
            >
              <h3 style=${{
                fontSize: 'var(--heading-h400-size)',
                fontWeight: 'var(--heading-h400-weight)',
                marginBottom: 'var(--spacing-medium)',
                color: 'var(--brand-primary)',
              }}>
                ${feature.title}
              </h3>
              <ul style=${{
                fontSize: 'var(--paragraph-p200-size)',
                color: 'var(--text-normal-secondary)',
                paddingLeft: 'var(--spacing-large)',
                margin: 0,
              }}>
                ${feature.items.map((item) => html`
                  <li key=${item} style=${{ marginBottom: 'var(--spacing-tiny)' }}>
                    ${item}
                  </li>
                `)}
              </ul>
            </div>
          `)}
        </div>
      </section>

      <!-- Instructions -->
      <section>
        <div style=${{
          backgroundColor: 'var(--bg-brand-primary-lighter)',
          padding: 'var(--padding-large)',
          borderRadius: 'var(--border-radius-large)',
          borderLeft: '4px solid var(--brand-primary)',
        }}>
          <h3 style=${{
            fontSize: 'var(--heading-h400-size)',
            fontWeight: 'var(--heading-h400-weight)',
            marginBottom: 'var(--spacing-small)',
            color: 'var(--brand-primary)',
          }}>
            📱 Test Instructions
          </h3>
          <ul style=${{
            fontSize: 'var(--paragraph-p200-size)',
            color: 'var(--text-normal-primary)',
            paddingLeft: 'var(--spacing-large)',
            margin: 0,
          }}>
          </ul>
        </div>
      </section>

    </div>
  `;
};

export default BookingBoxSample;
