/* eslint-disable */
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { sanitizeSVG, ensureDOMPurify } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

// ============================================================================
// Module-level SVG cache
// ----------------------------------------------------------------------------
// Each <Icon> used to fetch `/icons/<name>.svg` inside a useEffect on every
// mount and render an empty placeholder until the request resolved. Because the
// booking-box step modals (city / date / passenger selectors) mount their
// header back/close icons and field icons fresh on every open, the user saw a
// perceptible icon "load delay" each time (bugs #2 / #11).
//
// We cache the RAW svg text once per icon name at module scope so that:
//   • the first component to need an icon fetches it (or uses a preload),
//   • every subsequent render reads it synchronously and paints the real icon
//     on the FIRST frame — no placeholder flash, no refetch.
// The (cheap) string post-processing is done per render since it depends on the
// `color` prop; only the network round-trip is shared.
const rawSvgCache = new Map(); // name -> raw svg text
const failedIcons = new Set(); // names that 404'd (avoid refetch loops)
const inFlight = new Map(); // name -> Promise (dedupe concurrent fetches)

const fetchRawSvg = (name) => {
  if (rawSvgCache.has(name)) return Promise.resolve(rawSvgCache.get(name));
  if (failedIcons.has(name)) return Promise.reject(new Error('icon failed'));
  if (inFlight.has(name)) return inFlight.get(name);

  const p = fetch(`/icons/${name}.svg`)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((text) => {
      rawSvgCache.set(name, text);
      inFlight.delete(name);
      return text;
    })
    .catch((err) => {
      failedIcons.delete(name);
      inFlight.delete(name);
      failedIcons.add(name);
      throw err;
    });

  inFlight.set(name, p);
  return p;
};

// Normalize the raw svg so it adapts to the container and (optionally) recolors.
const processSvg = (rawText, color) => {
  let svgText = rawText
    .replace(/\s*width="[^"]*"/g, '')
    .replace(/\s*height="[^"]*"/g, '')
    .replace('<svg', '<svg width="100%" height="100%"');

  if (color) {
    svgText = svgText
      .replace(/fill="#[^"]*"/g, `fill="${color}"`)
      .replace(/fill='#[^']*'/g, `fill='${color}'`);
  }

  return svgText;
};

/**
 * Warm the module cache for a set of icon names before they are rendered.
 * Call this once (e.g. when a block that uses many icons decorates) so the
 * first paint of every icon is synchronous. Best-effort: failures are swallowed
 * and simply fall back to the per-component fetch.
 *
 * @param {string[]} names - Icon names without extension (e.g. "navigation/close").
 */
export const preloadIcons = (names = []) => {
  if (typeof window === 'undefined') return;
  names.forEach((name) => {
    if (!name || rawSvgCache.has(name) || inFlight.has(name)) return;
    fetchRawSvg(name).catch(() => {});
  });
};

/**
 * Icon - Reusable component for rendering system SVG icons
 *
 * @param {Object} props - Component properties
 * @param {string} props.icon - Icon name without extension (e.g., "action/add", "flags/colombia-flag")
 * @param {'xs'|'xsm'|'sm'|'s'|'m'|'xl'|'l'} [props.size='m'] - Icon size: "xs" (8x8), "xsm" (10x10), "sm" (12x12), "s" (16x16), "m" (20x20), "xl" (24x24), "l" (40x40)
 * @param {number} [props.customSize] - Custom size in pixels (overrides size prop). Example: customSize={12} renders 12x12px icon
 * @param {string} [props.color] - Icon color using CSS variables (e.g., "var(--color-success)"). If omitted, uses original SVG color
 * @param {string} [props.customClassName=''] - Additional Tailwind classes
 * @param {string} [props.ariaLabel] - Accessibility label (if omitted, uses aria-hidden)
 * @param {Object} [props.rest] - Additional props spread to container
 * @returns {import('preact').VNode} Icon component
 */
export const Icon = ({
  icon,
  size = 'm',
  customSize,
  color,
  customClassName = '',
  ariaLabel,
  ...rest
}) => {
  // Bump to force a re-render once an async fetch populates the cache.
  const [, setLoadedTick] = useState(0);
  const [error, setError] = useState(() => failedIcons.has(icon));

  // sanitizeSVG() fails closed (renders nothing) if DOMPurify hasn't finished
  // loading from the CDN yet (scripts.js kicks that off async and never awaits
  // it). Icons rendered before that load completes would otherwise stay blank
  // forever, since nothing else re-triggers a render for them. Re-render once
  // DOMPurify becomes available so the icon paints as soon as it's safe to.
  useEffect(() => {
    if (window.DOMPurify) return undefined;
    let mounted = true;
    ensureDOMPurify().then(() => {
      if (mounted) setLoadedTick((n) => n + 1);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch only when the icon isn't already cached. When it IS cached the raw
  // text is read synchronously below, so the icon paints on the first frame
  // with no placeholder.
  useEffect(() => {
    let mounted = true;

    if (rawSvgCache.has(icon)) {
      if (error) setError(false);
      return undefined;
    }

    if (failedIcons.has(icon)) {
      setError(true);
      return undefined;
    }

    fetchRawSvg(icon)
      .then(() => {
        if (mounted) {
          setError(false);
          setLoadedTick((n) => n + 1);
        }
      })
      .catch(() => {
        if (mounted) {
          // eslint-disable-next-line no-console
          console.warn(`Icon "${icon}" no encontrado en /icons/${icon}.svg`);
          setError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [icon]);

  // Read (possibly cached) raw svg and process synchronously for this render.
  const rawSvg = rawSvgCache.get(icon);
  const svgContent = rawSvg !== undefined ? processSvg(rawSvg, color) : null;

  // Map sizes to Tailwind classes
  const sizeClasses = {
    xs: 'w-2 h-2', // 8x8px
    xsm: 'w-2.5 h-2.5', // 10x10px
    sm: 'w-3 h-3', // 12x12px
    s: 'w-4 h-4', // 16x16px
    m: 'w-5 h-5', // 20x20px
    xl: 'w-6 h-6', // 24x24px
    l: 'w-10 h-10', // 40x40px
  };

  // Component base classes
  const baseClasses = 'inline-flex shrink-0';

  // Only treat customSize as a real pixel value when it is a number (or numeric string).
  // Booleans (customSize={true}) are kept as a legacy "let parent control sizing" flag.
  const customPx = typeof customSize === 'number' || (typeof customSize === 'string' && customSize.trim() !== '' && !Number.isNaN(Number(customSize)))
    ? Number(customSize)
    : null;

  // Only skip the size Tailwind class when a real numeric pixel size is provided.
  // customSize={true} (legacy "parent controls size") falls back to the size prop classes.
  const classes = customPx !== null
    ? `${baseClasses} ${customClassName}`.trim()
    : `${baseClasses} ${sizeClasses[size] || sizeClasses.m} ${customClassName}`.trim();

  // Inline pixel sizing only when customSize is a real number.
  const sizeStyle = customPx !== null
    ? { width: `${customPx}px`, height: `${customPx}px` }
    : null;

  // Accessibility properties
  const accessibilityProps = ariaLabel
    ? { 'aria-label': ariaLabel, role: 'img' }
    : { 'aria-hidden': 'true' };

  // If still loading (uncached) or error, show placeholder
  if (!svgContent || error) {
    return html`
      <span
        class="${classes}"
        style=${sizeStyle}
        data-name="icon-placeholder"
        ...${accessibilityProps}
      />
    `;
  }

  return html`
    <span
      class="${classes}"
      style=${sizeStyle}
      dangerouslySetInnerHTML=${{ __html: sanitizeSVG(svgContent) }}
      data-name="icon"
      data-icon-name=${icon}
      ...${accessibilityProps}
      ...${rest}
    />
  `;
};
