/* eslint-disable */
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

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
  const [svgContent, setSvgContent] = useState(null);
  const [error, setError] = useState(false);

  // Load SVG dynamically
  useEffect(() => {
    let mounted = true;

    const loadSvg = async () => {
      try {
        // Fetch SVG from /icons/ root
        const response = await fetch(`/icons/${icon}.svg`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let svgText = await response.text();

        // Remove width and height attributes from SVG to respect container size
        svgText = svgText.replace(/\s*width="[^"]*"/g, '');
        svgText = svgText.replace(/\s*height="[^"]*"/g, '');

        // Ensure it has width and height at 100% to adapt to container
        svgText = svgText.replace('<svg', '<svg width="100%" height="100%"');

        // Only replace fill if color prop is passed
        if (color) {
          svgText = svgText.replace(/fill="#[^"]*"/g, `fill="${color}"`);
          svgText = svgText.replace(/fill='#[^']*'/g, `fill='${color}'`);
        }

        if (mounted) {
          setSvgContent(svgText);
          setError(false);
        }
      } catch (err) {
        if (mounted) {
          // eslint-disable-next-line no-console
          console.warn(`Icon "${icon}" no encontrado en /icons/${icon}.svg`);
          setError(true);
        }
      }
    };

    loadSvg();

    return () => {
      mounted = false;
    };
  }, [icon, color]); // Re-run if color changes
 
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

  // If customSize is provided, don't add any base classes (let parent container control everything)
  // Otherwise use baseClasses + size prop
  const classes = customSize 
    ? customClassName
    : `${baseClasses} ${sizeClasses[size] || sizeClasses.m} ${customClassName}`.trim();

  // Accessibility properties
  const accessibilityProps = ariaLabel
    ? { 'aria-label': ariaLabel, role: 'img' }
    : { 'aria-hidden': 'true' };

  // If loading or error, show placeholder
  if (!svgContent || error) {
    return html`
      <span
        class="${classes}"
        data-name="icon-placeholder"
        ...${accessibilityProps}
      />
    `;
  }

  return html`
    <span
      class="${classes}"
      dangerouslySetInnerHTML=${{ __html: svgContent }}
      data-name="icon"
      data-icon-name=${icon}
      ...${accessibilityProps}
      ...${rest}
    />
  `;
};
