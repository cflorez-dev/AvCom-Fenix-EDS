# Avianca Frontend Site - AI Coding Agent Guide

## Architecture Overview

This is an **AEM Edge Delivery Services (EDS)** project for Avianca using **Adobe Universal Editor**. Content is authored in AEM Cloud and delivered through Edge Delivery. The project implements a custom **Design System** using **Preact components** with **Atomic Design** principles.

### Key Architectural Decisions

- **AEM EDS Architecture**: Content comes from AEM Cloud (`author-p34631-e1321407.adobeaemcloud.com`), served through Edge Delivery. The `/content/Avianca-home-site/` path is mapped to root in `paths.json`.
- **Vendorized Dropins**: Adobe dropins (`@dropins/tools`) MUST be committed to `scripts/__dropins__/` because AEM EDS serves files directly from GitHub—`node_modules/` is not available in production.
- **Preact + HTM**: Using Preact (not React) via `@dropins/tools/preact.js` with HTM (not JSX) for templating. No build step for component code.
- **Tailwind v4 + CSS Variables**: Hybrid styling approach—Tailwind classes for layout/spacing, CSS variables from `styles/variables/` for design tokens (colors, typography, spacing values).

## Critical Developer Workflows

### Build & Development

```bash
# Development with hot-reload (AEM server + Tailwind watch)
npm run dev

# Production build (MUST run before committing)
npm run build
# This does 3 things:
# 1. Compiles component JSON models
# 2. Copies dropins from node_modules to scripts/__dropins__
# 3. Compiles Tailwind CSS

# IMPORTANT: Always commit scripts/__dropins__/ changes!
# Production 404s occur if dropins aren't committed.
```

### Local Preview

```bash
aem up  # Starts local server at http://localhost:3000
# Uses mountpoint from fstab.yaml to pull content from AEM Cloud
```

## Component Development Patterns

### Atomic Design Structure

- **Atoms** (`design-system/atoms/`): Indivisible primitives (buttons, inputs, icons)
- **Molecules** (`design-system/molecules/`): Simple combinations (dropdowns, modals, cards). If it's just a container rendering `children`, it's a molecule.
- **Organisms** (`design-system/organisms/`): Complex multi-section components (headers, footers)
- **Blocks** (`blocks/`): AEM-integrated components that use the `decorate(block)` pattern

### Component Template (Preact + HTM)

```javascript
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ComponentName - JSDoc with all props documented
 */
export const ComponentName = ({
  variant = 'default',
  customClassName = '',
  children,
  ...rest
}) => {
  // Tailwind for layout/structure
  const baseClasses = 'inline-flex items-center gap-[var(--spacing-tiny)]';
  
  // Inline styles ONLY for dynamic values (colors, custom shadows)
  const variantStyles = {
    default: {
      backgroundColor: 'var(--bg-page-light)',
      color: 'var(--text-normal-primary)',
    },
  };

  return html`
    <div
      class=${`${baseClasses} ${customClassName}`}
      data-name="componentName"
      style=${variantStyles[variant]}
      ...${rest}
    >
      ${children}
    </div>
  `;
};
```

### AEM Block Pattern

```javascript
// blocks/my-block/my-block.js
export default function decorate(block) {
  // Manipulate block DOM directly
  // For Preact components: import { h, render } from '@dropins/tools/preact.js'
  // and render into block
}
```

## Styling Conventions

### CSS Variables (Design Tokens)

Located in `styles/variables/`:

- **Colors**: `var(--brand-primary)`, `var(--text-normal-primary)`, `var(--bg-page-light)`
- **Spacing**: `var(--spacing-tiny)` (4px), `var(--spacing-x-small)` (8px), `var(--spacing-medium)` (16px)
- **Typography**: `var(--heading-h400-size)`, `var(--paragraph-p200-weight)`
- **Border Radius**: `var(--border-radius-large)` (16px)
- **Transitions**: `var(--transition-fast)`, `var(--ease-in-out)`

### Styling Rules

✅ **DO**:
- Use Tailwind classes for layout: `flex`, `items-center`, `px-4`, `rounded-lg`
- Use CSS variables in Tailwind: `px-[var(--spacing-x-small)]`
- Inline styles only for variant-specific colors/shadows
- Single quotes for strings
- `data-name` attribute on component root
- Support `customClassName` and `...rest` props

❌ **DON'T**:
- Create separate CSS files for components (except blocks that need `.css`)
- Hardcode colors or spacing values
- Use nested ternaries (ESLint will reject)
- Use double quotes

## Import Patterns

```javascript
// Preact (NOT React)
import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';

// HTM (NOT JSX)
import htm from 'htm';
const html = htm.bind(h);

// AEM utilities
import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

// Always use .js extensions in imports (ESLint enforced)
import { Button } from '../button/button.js';
```

## File Naming & Structure

- **Kebab-case** for folders and files: `heading-dropdown-selector/heading-dropdown-selector.js`
- **PascalCase** for exports: `export const HeadingDropdownSelector`
- Each design system component needs:
  - `{name}.js` - Component implementation
  - `{name}.sample.js` - Usage examples (for design system preview)

## ESLint Configuration

Based on Airbnb style guide with:
- `import/extensions: ['error', { js: 'always' }]` - MUST include `.js` in imports
- `linebreak-style: ['error', 'unix']` - Unix line endings only
- No nested ternaries allowed

Run `npm run lint:fix` before committing.

## Testing/Preview

View design system components at: `http://localhost:3000/design-system-block`

Components are registered in `blocks/design-system-block/ds-arquitecture/{atoms|molecules|organisms}.samples.js`

## Common Pitfalls

1. **404 in production for `@dropins/tools/preact.js`**: Run `npm run build` and commit `scripts/__dropins__/`
2. **HTM syntax errors**: Remember it's `` html`<div>${value}</div>` ``, not JSX
3. **Preact vs React**: Hooks come from `@dropins/tools/preact-hooks.js`, not React
4. **Import extensions**: Always include `.js` or ESLint fails
5. **CSS variables in Tailwind**: Use bracket notation: `px-[var(--spacing-small)]`

## Integration Points

- **AEM Universal Editor**: Content model defined in `component-models.json`, `component-definition.json`
- **Fragments**: Auto-loaded via `a[href*="/fragments/"]` pattern in `scripts.js`
- **Icons**: Decorated automatically via `decorateIcons()` from `aem.js`
- **Query Index**: Configuration in `helix-query.yaml` for search/indexing

## Key Files Reference

- `scripts/scripts.js` - Main entry point, decorateMain() pipeline
- `scripts/aem.js` - AEM EDS utilities (decorateBlocks, loadSection, etc.)
- `fstab.yaml` - Content mountpoint configuration
- `paths.json` - AEM path mappings
- `package.json` - Scripts: `dev`, `build`, `lint`
- `.github/agents/custom-component-creator.md` - Detailed component creation guide
