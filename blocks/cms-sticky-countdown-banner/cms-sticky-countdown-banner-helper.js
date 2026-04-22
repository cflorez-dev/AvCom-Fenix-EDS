/**
 * Extracts props from CMS Sticky Countdown Banner block.
 *
 * @param {Element} block - Block element with 13 rows:
 *  0-title, 1-subtitle, 2-startDateTime, 3-endDateTime, 4-dismissible,
 *  5-backgroundColor, 6-textColor, 7-counterTextColor,
 *  8-counterBackgroundColor, 9-buttonColor, 10-ariaRole,
 *  11-targetCountries, 12-targetLanguages
 * @returns {Object} Mapped properties object
 */
export function extractCmsStickyCountdownBannerProps(block) {
  if (!block) return {};

  const rows = [...block.children];
  const props = {};
  const propNames = [
    'title',
    'subtitle',
    'startDateTime',
    'endDateTime',
    'dismissible',
    'backgroundColor',
    'textColor',
    'counterTextColor',
    'counterBackgroundColor',
    'buttonColor',
    'ariaRole',
    'targetCountries',
    'targetLanguages',
  ];

  rows.forEach((row, index) => {
    const cell = row.querySelector('div');
    const propName = propNames[index] || `prop${index + 1}`;

    if (!cell || cell.innerHTML.trim() === '') {
      props[propName] = null;
      return;
    }

    // Color values (rows 5-9) might be in link format
    if (index >= 5 && index <= 9) {
      const link = cell.querySelector('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          props[propName] = href;
          return;
        }
        props[propName] = link.textContent.trim();
        return;
      }
    }

    const p = cell.querySelector('p');
    if (p) {
      props[propName] = p.textContent.trim();
      return;
    }

    const fallback = cell.textContent.trim();
    props[propName] = fallback || null;
  });

  return props;
}

/**
 * Validates props before rendering.
 * @param {Object} props - Extracted props object
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateCmsStickyCountdownBannerProps(props) {
  const errors = [];

  if (!props || typeof props !== 'object') {
    return { isValid: false, errors: ['Props object is invalid'] };
  }

  if (!props.endDateTime || props.endDateTime.trim() === '') {
    errors.push('End date and time is required');
  }

  if (props.endDateTime) {
    const endDate = new Date(props.endDateTime);
    if (Number.isNaN(endDate.getTime())) {
      errors.push('End date and time has invalid format');
    }
  }

  if (props.startDateTime && props.startDateTime.trim() !== '') {
    const startDate = new Date(props.startDateTime);
    if (Number.isNaN(startDate.getTime())) {
      errors.push('Start date and time has invalid format');
    }
  }

  if (props.startDateTime && props.endDateTime) {
    const startDate = new Date(props.startDateTime);
    const endDate = new Date(props.endDateTime);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      if (startDate >= endDate) {
        errors.push('Start date must be before end date');
      }
    }
  }

  const colorFields = [
    { name: 'backgroundColor', value: props.backgroundColor },
    { name: 'textColor', value: props.textColor },
    { name: 'counterTextColor', value: props.counterTextColor },
    { name: 'counterBackgroundColor', value: props.counterBackgroundColor },
    { name: 'buttonColor', value: props.buttonColor },
  ];

  colorFields.forEach((field) => {
    if (field.value && !field.value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      errors.push(`${field.name} must be in hex format (e.g., #000000 or #FFF)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
