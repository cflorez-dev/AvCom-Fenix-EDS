/**
 * Loads an SVG file and returns it as an inline SVG element
 * @param {string} svgPath - Path to the SVG file
 * @returns {Promise<HTMLElement>} Promise that resolves to the SVG element
 */
async function loadSVGIcon(svgPath) {
  try {
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${svgPath}`);
    }
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');

    if (!svgElement) {
      throw new Error(`No SVG element found in: ${svgPath}`);
    }

    // Set accessibility attributes
    svgElement.setAttribute('aria-hidden', 'true');
    svgElement.setAttribute('focusable', 'false');
    // Ensure SVG can inherit color
    svgElement.setAttribute('style', 'color: inherit;');
    // Change fill and stroke to currentColor for theme compatibility
    const paths = svgElement.querySelectorAll('path');
    paths.forEach((path) => {
      // Handle fill - convert any fill color to currentColor
      const fill = path.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'currentColor') {
        path.setAttribute('fill', 'currentColor');
      }
      // Handle stroke - convert any stroke color to currentColor
      const stroke = path.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'currentColor') {
        path.setAttribute('stroke', 'currentColor');
      }
    });

    return svgElement;
  } catch (error) {
    // Return a fallback empty SVG
    const fallback = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fallback.setAttribute('width', '24');
    fallback.setAttribute('height', '24');
    fallback.setAttribute('aria-hidden', 'true');
    return fallback;
  }
}

export default loadSVGIcon;
