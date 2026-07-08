import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersHeroSkeleton } from './members-hero-skeleton.js';

const html = htm.bind(h);

/**
 * Showcase del skeleton de carga del MembersHero. Lo envolvemos con el mismo
 * contenedor (bg + padding + rounded) que pinta el organism `members-hero` en
 * su rama `data-state="loading"` — así el preview es 1:1 contra Figma
 * (518:23125 / 518:23193 / 518:23258).
 *
 * El barrido lateral SOLO corre si el `<style>` `.members-hero__sk` está
 * cargado. En `/design-system` el `<link rel="stylesheet" href=".../members-hero.css">`
 * no se inyecta automáticamente; este sample añade un `<style>` mínimo inline
 * para que la animación se vea también en el showcase.
 */
const SHOWCASE_STYLE = `
@keyframes members-hero-sweep-preview {
  0%   { background-position: 155.56% 0; }
  100% { background-position: -55.56% 0; }
}
.members-hero-skeleton-preview .members-hero__sk {
  background-color: #e9e9e9;
  background-image: linear-gradient(
    90deg,
    rgb(255 255 255 / 0%) 0%,
    rgb(247 251 252 / 25%) 18.75%,
    rgb(255 255 255 / 50%) 39.583%,
    rgb(255 255 255 / 40%) 59.896%,
    rgb(247 251 252 / 25%) 80.729%,
    rgb(255 255 255 / 0%) 100%
  );
  background-size: 155.56% 100%;
  background-repeat: no-repeat;
  background-position: 155.56% 0;
  animation: members-hero-sweep-preview 1.8s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .members-hero-skeleton-preview .members-hero__sk { animation: none; }
}
`;

export const MembersHeroSkeletonSample = () => html`
  <div class="flex flex-col gap-6">
    <style dangerouslySetInnerHTML=${{ __html: SHOWCASE_STYLE }} />
    <div class="members-hero-skeleton-preview">
      <div class="rounded-2xl overflow-hidden bg-[#d5d5d5] p-4 md:p-6 lg:p-8">
        <${MembersHeroSkeleton} />
      </div>
    </div>
  </div>
`;

export default MembersHeroSkeletonSample;
