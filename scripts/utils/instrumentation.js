/**
 * Moves a list of attributes from one element to another.
 *
 * @param {Element} from - Source element
 * @param {Element} to - Target element
 * @param {string[]} attributes - Attribute names to move
 */
export function moveAttributes(from, to, attributes = []) {
  if (!from || !to || !attributes.length) return;

  attributes.forEach((attr) => {
    if (from.hasAttribute(attr)) {
      to.setAttribute(attr, from.getAttribute(attr));
      from.removeAttribute(attr);
    }
  });
}

/**
 * Moves Universal Editor instrumentation attributes from source to target.
 *
 * @param {Element} from - Source element
 * @param {Element} to - Target element
 */
export function moveInstrumentation(from, to) {
  if (!from || !to) return;

  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}
