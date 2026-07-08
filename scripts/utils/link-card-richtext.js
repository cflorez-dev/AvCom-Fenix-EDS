import { getLinkButtonStyles } from '../../design-system/atoms/link-button/link-button.js';

/**
 * Applies LinkButton (informative) styles to all `<a>` tags inside `container`,
 * matching the behavior of cms-rich-text so links inside richtext descriptions
 * (rendered through link-card-vertical / link-card-horizontal) look like the
 * LinkButton atom.
 *
 * Mutates `container` in place by overriding the `class` attribute on each
 * `<a>` and on its `<u>` descendants. Idempotent (uses a Set to dedupe).
 *
 * @param {Element} container - element containing the `<a>` tags to decorate
 * @returns {void}
 */
export function applyLinkButtonStylesToLinks(container) {
  if (!container) return;

  const linkButtonClasses = getLinkButtonStyles({
    variant: 'link',
    size: 'default',
    colorVariant: 'informative',
    iconOnly: false,
    disabled: false,
    customClassName: '',
  });

  const linkElements = container.querySelectorAll('a');
  if (linkElements.length === 0) return;

  linkElements.forEach((linkElement) => {
    // Apply hover/active/focus font-weight bump to <u> children
    const uElements = linkElement.querySelectorAll('u');
    uElements.forEach((uElement) => {
      const uClassesToAdd = [
        'group-hover/link:font-[700]',
        'group-active/link:font-[700]',
        'group-focus-visible/link:font-[700]',
      ];
      const existingUClasses = (uElement.className || '').split(/\s+/).filter(Boolean);
      const mergedUClasses = [...new Set([...existingUClasses, ...uClassesToAdd])]
        .filter(Boolean)
        .join(' ');
      uElement.setAttribute('class', mergedUClasses);
    });

    const existingClasses = (linkElement.className || '').split(/\s+/).filter(Boolean);
    const linkButtonClassesArray = linkButtonClasses.split(/\s+/);
    const mergedClasses = [...new Set([
      ...existingClasses,
      ...linkButtonClassesArray,
      'p-[2px]',
      'group/link',
      'rich-text-link',
    ])].filter(Boolean).join(' ');

    linkElement.setAttribute('class', mergedClasses);
  });
}
