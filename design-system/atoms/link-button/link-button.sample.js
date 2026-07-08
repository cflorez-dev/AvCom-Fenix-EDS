import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LinkButton } from './link-button.js';

const html = htm.bind(h);

/**
 * LinkButtonSample - Showcase del componente LinkButton
 * Muestra todos los tamaños y estados disponibles según diseño Figma
 */
export const LinkButtonSample = () => html`
  <div class="p-10 max-w-[1200px] mx-auto">

    <!-- Variants -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Variants</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} variant="link" size="default">Default Link</${LinkButton}>
        <${LinkButton} variant="outlined" size="default">Outlined Link</${LinkButton}>
      </div>
    </section>

    <!-- Color Variants - Link -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Color Variants - Link</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} variant="link" size="default" colorVariant="informative">Informative</${LinkButton}>
        <${LinkButton} variant="link" size="default" colorVariant="promotional">Promotional</${LinkButton}>
        <${LinkButton} variant="link" size="default" colorVariant="caution">Caution</${LinkButton}>
      </div>
    </section>

    <!-- Color Variants - Outlined -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Color Variants - Outlined</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} variant="outlined" size="default" colorVariant="informative">Informative</${LinkButton}>
        <${LinkButton} variant="outlined" size="default" colorVariant="promotional">Promotional</${LinkButton}>
        <${LinkButton} variant="outlined" size="default" colorVariant="caution">Caution</${LinkButton}>
      </div>
    </section>

    <!-- Sizes - Link -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Sizes - Link (underline)</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} variant="link" size="compact">Compact (14px)</${LinkButton}>
        <${LinkButton} variant="link" size="default">Default (16px)</${LinkButton}>
        <${LinkButton} variant="link" size="medium">Medium (20px)</${LinkButton}>
        <${LinkButton} variant="link" size="large">Large (28px)</${LinkButton}>
        <${LinkButton} variant="link" size="huge">Huge (32px)</${LinkButton}>
      </div>
    </section>

    <!-- Sizes - Outlined -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Sizes - Outlined (border)</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} variant="outlined" size="compact">Compact (14px)</${LinkButton}>
        <${LinkButton} variant="outlined" size="default">Default (16px)</${LinkButton}>
        <${LinkButton} variant="outlined" size="medium">Medium (20px)</${LinkButton}>
        <${LinkButton} variant="outlined" size="large">Large (28px)</${LinkButton}>
        <${LinkButton} variant="outlined" size="huge">Huge (32px)</${LinkButton}>
      </div>
    </section>

    <!-- With icons -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">With icons</h2>
      <div class="flex gap-4 flex-wrap items-center">
        <${LinkButton} size="default">
          <span class="text-xl">→</span>
          Icon before
        </${LinkButton}>
        <${LinkButton} size="default">
          Icon after
          <span class="text-xl">→</span>
        </${LinkButton}>
        <${LinkButton} size="large">
          <span class="text-3xl">✓</span>
          Large with icon
        </${LinkButton}>
      </div>
    </section>

    <!-- Icon only mode -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Icon only mode</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} size="compact" iconOnly=${true}>
          <span class="text-sm">☰</span>
        </${LinkButton}>
        <${LinkButton} size="default" iconOnly=${true}>
          <span class="text-xl">☰</span>
        </${LinkButton}>
        <${LinkButton} size="medium" iconOnly=${true}>
          <span class="text-2xl">☰</span>
        </${LinkButton}>
        <${LinkButton} size="large" iconOnly=${true}>
          <span class="text-3xl">☰</span>
        </${LinkButton}>
        <${LinkButton} size="huge" iconOnly=${true}>
          <span class="text-3xl">+</span>
        </${LinkButton}>
      </div>
    </section>

    <!-- States -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">States</h2>
      <div class="flex gap-4 flex-wrap items-center mb-4">
        <${LinkButton} variant="link" size="default">Link Normal</${LinkButton}>
        <${LinkButton} variant="link" size="default" disabled=${true}>Link Disabled</${LinkButton}>
        <${LinkButton} variant="outlined" size="default">Outlined Normal</${LinkButton}>
        <${LinkButton} variant="outlined" size="default" disabled=${true}>Outlined Disabled</${LinkButton}>
      </div>
      <p class="mt-4 text-sm text-gray-600">
        Note: Hover, Active and Focus states are activated when interacting with the links
      </p>
    </section>

    <!--
      Members variant (sin subrayado)
      ─────────────────────────────────────────────────────────────────────────
      Usar variant="members" en el bloque de navegación Members (header / modal).
      Figma: node 104-10337 — Entregable OMNI Members 01062026
      Estados: Default → Hover → Pressed · Focus ring activo con teclado · Disabled
    -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Members variant (sin subrayado)</h2>
      <p class="text-sm text-gray-500 mb-4">
        Figma node 104-10337 — usar en bloques de navegación Members.
        Focus ring se mantiene para navegación por teclado (Tab / Enter).
      </p>
      <!-- Estados: Default / Hover / Disabled -->
      <div class="flex gap-6 items-center flex-wrap mb-4">
        <div class="flex flex-col items-start gap-1">
          <span class="text-[11px] text-gray-400 font-mono">default</span>
          <${LinkButton} variant="members" size="compact">Cerrar</${LinkButton}>
        </div>
        <div class="flex flex-col items-start gap-1">
          <span class="text-[11px] text-gray-400 font-mono">disabled</span>
          <${LinkButton} variant="members" size="compact" disabled=${true}>Cerrar</${LinkButton}>
        </div>
        <div class="flex flex-col items-start gap-1">
          <span class="text-[11px] text-gray-400 font-mono">default (16px)</span>
          <${LinkButton} variant="members" size="default">Ver todos los destinos</${LinkButton}>
        </div>
        <div class="flex flex-col items-start gap-1">
          <span class="text-[11px] text-gray-400 font-mono">default (20px)</span>
          <${LinkButton} variant="members" size="medium">Ver todos los destinos</${LinkButton}>
        </div>
      </div>
      <!-- colorVariants disponibles -->
      <div class="flex gap-6 items-center flex-wrap">
        <${LinkButton} variant="members" size="default" colorVariant="informative">Informative</${LinkButton}>
        <${LinkButton} variant="members" size="default" colorVariant="promotional">Promotional</${LinkButton}>
        <${LinkButton} variant="members" size="default" colorVariant="caution">Caution</${LinkButton}>
      </div>
    </section>

    <!-- As link (href) -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">As link (href)</h2>
      <div class="flex gap-4 items-center flex-wrap">
        <${LinkButton} variant="link" size="default" href="#example">Default Link</${LinkButton}>
        <${LinkButton} variant="outlined" size="default" href="#example">Outlined Link</${LinkButton}>
      </div>
    </section>

    <!-- All sizes disabled -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Disabled state</h2>
      <div class="flex gap-4 flex-wrap items-center mb-4">
        <h3 class="w-full text-lg font-semibold">Link variant:</h3>
        <${LinkButton} variant="link" size="compact" disabled=${true}>Compact</${LinkButton}>
        <${LinkButton} variant="link" size="default" disabled=${true}>Default</${LinkButton}>
        <${LinkButton} variant="link" size="medium" disabled=${true}>Medium</${LinkButton}>
        <${LinkButton} variant="link" size="large" disabled=${true}>Large</${LinkButton}>
        <${LinkButton} variant="link" size="huge" disabled=${true}>Huge</${LinkButton}>
      </div>
      <div class="flex gap-4 flex-wrap items-center">
        <h3 class="w-full text-lg font-semibold">Outlined variant:</h3>
        <${LinkButton} variant="outlined" size="compact" disabled=${true}>Compact</${LinkButton}>
        <${LinkButton} variant="outlined" size="default" disabled=${true}>Default</${LinkButton}>
        <${LinkButton} variant="outlined" size="medium" disabled=${true}>Medium</${LinkButton}>
        <${LinkButton} variant="outlined" size="large" disabled=${true}>Large</${LinkButton}>
        <${LinkButton} variant="outlined" size="huge" disabled=${true}>Huge</${LinkButton}>
      </div>
    </section>

  </div>
`;

export default LinkButtonSample;
