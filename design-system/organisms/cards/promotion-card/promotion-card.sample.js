import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { PromotionCard } from './promotion-card.js';

const html = htm.bind(h);

/**
 * PromotionCardSample - Showcase of the PromotionCard component
 * Shows all use cases according to Figma design
 */
export const PromotionCardSample = () => {
  const sampleImage = `${window.hlx?.codeBasePath || ''}/assets/samples/Oferta-San-Andres.png`;

  return html`
    <div className="p-10 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-[var(--spacing-x-large)]">
        Promotion Card Component
      </h1>

      <section className="mb-[var(--spacing-x-large)]">
        <!-- Row 1: 288px card -->
        <h3 className="text-base font-semibold mb-[var(--spacing-small)] text-[var(--color-text-normal-secondary)]">
          Card at 288px width
        </h3>
        <div className="flex gap-[var(--spacing-medium)] mb-[var(--spacing-large)]">
          <div className="w-[288px]">
            <${PromotionCard}
              image=${sampleImage}
              imageAlt="Promotion to Cali"
              destination="San José de Costa Rica"
              label="Per journey from"
              discountChip="-24%"
              currency="COP"
              price="1.200.000"
              complementPrice="1.260.000"
              lifemilesTag="Earn miles"
            />
          </div>
        </div>

        <!-- Row 2: 735px card -->
        <h3 className="text-base font-semibold mb-[var(--spacing-small)] text-[var(--color-text-normal-secondary)]">
          Card at 735px width
        </h3>
        <div className="flex gap-[var(--spacing-medium)] mb-[var(--spacing-large)]">
          <div className="w-[735px]">
            <${PromotionCard}
              image=${sampleImage}
              imageAlt="Promotion to Bogotá"
              destination="Bogotá"
              label="Per journey from"
              discountChip="-30%"
              currency="COP"
              price="900.000"
              comparativeCurrency="USD"
              comparativePrice="250"
              lifemilesTag="Earn miles"
              lifemilesTagVariant="dark"
            />
          </div>
        </div>

        <!-- Row 3: 3 cards in line -->
        <h3 className="text-base font-semibold mb-[var(--spacing-small)] text-[var(--color-text-normal-secondary)]">
          Three cards in a row (natural width)
        </h3>
        <div className="flex gap-[var(--spacing-medium)] flex-nowrap">
          <div className="w-[400px] shrink-0">
            <${PromotionCard}
              image=${sampleImage}
              imageAlt="Promotion to Medellín"
              destination="Medellín"
              label="Per journey from"
              discountChip="-15%"
              currency="COP"
              price="850.000"
              complementPrice="1.000.000"
              lifemilesTag="Earn miles"
            />
          </div>
          <div className="w-[400px] shrink-0">
            <${PromotionCard}
              image=${sampleImage}
              imageAlt="Promotion to Cartagena"
              destination="Cartagena"
              label="Per journey from"
              discountChip="-20%"
              currency="COP"
              price="750.000"
              lifemilesTag="Earn miles"
            />
          </div>
          <div className="w-[400px] shrink-0">
            <${PromotionCard}
              image=${sampleImage}
              imageAlt="Promotion to San Andrés"
              destination="San Andrés"
              label="Per journey from"
              discountChip="-18%"
              currency="COP"
              price="1.100.000"
              complementPrice="1.340.000"
              lifemilesTag="Earn miles"
            />
          </div>
        </div>
      </section>
    </div>
  `;
};

export default PromotionCardSample;
