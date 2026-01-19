import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { DayCell } from './day-cell.js';

const html = htm.bind(h);

/**
 * DayCellSample - Showcase del átomo DayCell
 */
export const DayCellSample = () => {
  const today = new Date();
  const sampleDate = new Date(2026, 0, 15);

  return html`
    <div style=${{
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-page-lighter)',
  }}>
      
      <h1 style=${{
    fontSize: 'var(--heading-h600-size)',
    fontWeight: 'var(--heading-h600-weight)',
    marginBottom: 'var(--spacing-x-large)',
    color: 'var(--text-normal-primary)',
  }}>
        DayCell - 30x30px redondo
      </h1>

      <!-- Estados Básicos -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Estados</h2>
        <div style=${{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 42px)',
    gap: 'var(--spacing-small)',
  }}>
          
          <!-- Default -->
          <div>
            <${DayCell}
              date=${sampleDate}
              onClick=${() => console.log('Day clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Default</p>
          </div>

          <!-- Today -->
          <div>
            <${DayCell}
              date=${today}
              isToday=${true}
              onClick=${() => console.log('Today clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Today</p>
          </div>

          <!-- Selected Single -->
          <div>
            <${DayCell}
              date=${sampleDate}
              isSelected=${true}
              onClick=${() => console.log('Selected clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Selected</p>
          </div>

          <!-- Range Start -->
          <div>
            <${DayCell}
              date=${sampleDate}
              isRangeStart=${true}
              onClick=${() => console.log('Range start clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Start</p>
          </div>

          <!-- In Range -->
          <div>
            <${DayCell}
              date=${sampleDate}
              isInRange=${true}
              onClick=${() => console.log('In range clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>In Range</p>
          </div>

          <!-- Range End -->
          <div>
            <${DayCell}
              date=${sampleDate}
              isRangeEnd=${true}
              onClick=${() => console.log('Range end clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>End</p>
          </div>

          <!-- Disabled -->
          <div>
            <${DayCell}
              date=${sampleDate}
              isDisabled=${true}
              onClick=${() => console.log('Disabled clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Disabled</p>
          </div>
        </div>
      </section>

      <!-- Con Pricing (fondo color) -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Con Pricing (fondo)</h2>
        <div style=${{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 42px)',
    gap: 'var(--spacing-small)',
  }}>
          
          <!-- Low Price - Verde #B8E6D4 -->
          <div>
            <${DayCell}
              date=${sampleDate}
              pricingCategory="low"
              onClick=${() => console.log('Low price clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Low</p>
          </div>

          <!-- Medium Price - Amarillo #FFECB7 -->
          <div>
            <${DayCell}
              date=${sampleDate}
              pricingCategory="medium"
              onClick=${() => console.log('Medium price clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>Medium</p>
          </div>

          <!-- High Price - Rojo #FFC3B6 -->
          <div>
            <${DayCell}
              date=${sampleDate}
              pricingCategory="high"
              onClick=${() => console.log('High price clicked')}
            />
            <p style=${{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>High</p>
          </div>
        </div>
      </section>

      <!-- Grid Ejemplo con Rango -->
      <section style=${{ marginBottom: 'var(--spacing-x-large)' }}>
        <h2 style=${{
    fontSize: 'var(--heading-h500-size)',
    fontWeight: 'var(--heading-h500-weight)',
    marginBottom: 'var(--spacing-medium)',
  }}>Grid Ejemplo (Rango 10-14 con pricing)</h2>
        <div style=${{
    display: 'grid',
    gridTemplateColumns: 'repeat(7, auto)',
    rowGap: 'var(--spacing-small)',
    width: 'fit-content',
  }}>
          ${Array.from({ length: 21 }, (_, i) => {
    const date = new Date(2026, 0, i + 1);
    const isStart = i === 9;
    const isEnd = i === 14;
    const inRange = i > 9 && i < 14;
    const isCurrentDay = i === 7;

    return html`
              <${DayCell}
                key=${i}
                date=${date}
                isToday=${isCurrentDay}
                isRangeStart=${isStart}
                isRangeEnd=${isEnd}
                isInRange=${inRange}
                pricingCategory=${i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high'}
                onClick=${() => console.log(`Day ${i + 1} clicked`)}
              />
            `;
  })}
        </div>
      </section>

    </div>
  `;
};

export default DayCellSample;
