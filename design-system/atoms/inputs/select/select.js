/* eslint-disable */ /* Reason: focus only on the changes made  */
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../icon/icon.js';
import { Tooltip } from '../../tooltip/tooltip.js';
import { ListItem } from '../../list-item/list-item.js';

const html = htm.bind(h);

/**
 * Select Component - Custom dropdown selector with multiple states
 *
 * @param {Object} props - Component properties
 * @param {string} props.label - Label text for the select (supports * for required indicator)
 * @param {string} [props.placeholder=''] - Placeholder text when no option is selected
 * @param {Array<{value: string, label: string}>} props.options - Array of options to display
 * @param {string} [props.value=''] - Currently selected value
 * @param {Function} [props.onChange] - Callback function when selection changes (value) => void
 * @param {string} [props.state='normal'] - Visual state: 'normal' | 'success' | 'error' | 'disabled' | 'readonly'
 * @param {string} [props.helperText=''] - Helper text displayed below the select
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 * @param {boolean} [props.readonly=false] - Whether the select is readonly
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {string} [props.iconName] - Icon name to display on the left (e.g., 'action/plane'). If not provided, no icon is shown unless options have flags.
 * @param {boolean} [props.hasPrefixIcon] - Whether the select has a prefix icon (auto-detected if not provided). Set to false to explicitly hide the prefix icon.
 * @param {string|number} [props.dropdownMaxHeight] - Maximum height for the dropdown (e.g., '218px', '256px', or number in pixels). Default: '256px' (max-h-64)
 * @param {boolean} [props.truncateOption=false] - Truncate selected/option text and show tooltip when true
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {string} [props.id] - HTML id attribute
 * @param {string} [props.name] - HTML name attribute for forms
 * @param {('light'|'darksite'|'darksite-dark'|'darksite-light')} [props.theme='light'] - Visual theme.
 *   'darksite' and 'darksite-dark' render the compact pill trigger + dark dropdown
 *   variant (Figma language selector spec), built on top of the `ListItem` atom.
 *   'darksite-light' renders the compact pill trigger with light styling (#B6B6B6
 *   border, #1B1B1B text) + white dropdown panel, for darksite headers with
 *   light/white background.
 * @param {('default'|'members'|'segment')} [props.variant='default'] - Layout variant.
 *   'members' implements the Members "Reglas de uso" spec:
 *   - Textos desbordados: when the (unselected) label doesn't fit the field's
 *     width, the field widens to fit it instead of wrapping to a second line
 *     or being truncated/hidden. Intended for use inside a formGrid column,
 *     where the field should never shrink below the column width but may
 *     grow past it when the label is long. The selected value truncates
 *     horizontally (single line, ellipsis) via `truncateOption`, revealing
 *     the full text on hover/keyboard focus through a `Tooltip`.
 *   - Input obligatorio: when `required` is true and the field is left empty
 *     after being touched (blurred without a selection), it switches to the
 *     `error` state and shows a default "Este campo es obligatorio." helper
 *     text (unless a custom `helperText` is provided).
 *   - Diferencia entre deshabilitado y solo lectura: `readonly` stays
 *     keyboard-focusable and shows the focus ring (only `disabled` blocks
 *     focus, opens the dropdown, or changes the selected value).
 *   'segment' renders a borderless, backgroundless mini-select meant to live
 *   inside a shared bordered container built by the consumer (Figma
 *   `<inlineDateField>` / `datePicker` 1291:53013 — used by the
 *   `InlineDateField` molecule for its Día/Mes/Año segments). In this mode:
 *   `label` is ignored (no floating label), `placeholder` is rendered inline
 *   in its place (secondary color) when nothing is selected, height is fixed
 *   at 32px, and horizontal padding is 8px mobile-first / 12px from `md:` up
 *   (Figma "Device" spec: `inlineDateFieldMobile` vs. desktop/tablet).
 * @param {string} [props.tooltipContent] - Contextual help text. When set, renders an
 *   info icon (Figma `<tooltipIcon>`) to the right of, and outside, the
 *   field's border, that reveals a `Tooltip` (variant="hint") above the field
 *   on hover/keyboard focus. Per the "Reglas de uso" spec: not every field
 *   needs this — reserve it for content that complements (not repeats) the
 *   label/placeholder.
 * @param {Object} props.rest - Additional HTML attributes
 * @returns {import('preact').VNode}
 */
export const Select = ({
  label = '',
  placeholder = '',
  options = [],
  value = '',
  onChange,
  state = 'normal',
  helperText = '',
  disabled = false,
  readonly = false,
  required = false,
  iconName,
  hasPrefixIcon,
  dropdownMaxHeight,
  truncateOption = false,
  labelClassName = '',
  customDropdownClassName = '',
  customClassName = '',
  id,
  name,
  theme = 'light',
  variant = 'default',
  tooltipContent,
  ...rest
}) => {
  const isDarksite = theme === 'darksite' || theme === 'darksite-dark' || theme === 'darksite-light';
  const isDarksiteLight = theme === 'darksite-light';
  const isMembers = variant === 'members';
  const isSegment = variant === 'segment';
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [pressedIndex, setPressedIndex] = useState(-1);
  const [touched, setTouched] = useState(false);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownMaxHeightValue = dropdownMaxHeight !== undefined && dropdownMaxHeight !== null
    ? (typeof dropdownMaxHeight === 'number' ? `${dropdownMaxHeight}px` : String(dropdownMaxHeight))
    : null;

  // Determine actual state
  const isInteractive = !disabled && !readonly;
  // members variant: per "Reglas de uso" (Input obligatorio), a required
  // field left empty after being touched (blurred without a selection) must
  // switch to the error state and show a default required-field message.
  const showRequiredError = isMembers && required && touched && !selectedValue && isInteractive;
  const actualState = disabled ? 'disabled' : readonly ? 'readonly' : showRequiredError ? 'error' : state;
  const resolvedHelperText = showRequiredError && !helperText ? 'Este campo es obligatorio.' : helperText;
  // members variant: per "Reglas de uso" (Diferencia entre deshabilitado y
  // solo lectura), a readonly field must stay keyboard-focusable and show
  // the focus ring — only `disabled` blocks focus entirely. `isInteractive`
  // is still used (unchanged) to gate opening the dropdown / changing the
  // value, since readonly content must remain selectable but not editable.
  const isFocusable = isMembers ? !disabled : isInteractive;

  // Find selected option label
  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Determine if label should float (when has value or is focused)
  const shouldFloat = selectedValue || isOpen;

  // members variant: while unfloated, the label stands in for the value and
  // must be rendered in-flow (not absolutely positioned) so its intrinsic
  // width can drive the field's `w-fit` growth (see "Label corto y claro").
  const showInlineMembersLabel = isMembers && !!label && !shouldFloat;

  // Determine if there's a prefix icon (flag or icon)
  // Auto-detect if hasPrefixIcon is not explicitly provided
  // If hasPrefixIcon is explicitly false, don't show any icon
  const hasPrefixIconValue = hasPrefixIcon === false 
    ? false 
    : hasPrefixIcon !== undefined 
      ? hasPrefixIcon 
      : !!(iconName || (selectedOption && (selectedOption.flag || selectedOption.flagPath)) || 
             options.some(opt => opt.flag || opt.flagPath));

  // State-based styling classes - Figma specs, Tailwind only
  const stateClasses = {
    normal: 'border-1 border-border-input-default hover:border-border-input-positive',
    success: 'border-1 border-border-input-positive',
    error: 'border-1 border-border-input-error',
    disabled: 'border-1 border-border-input-disabled cursor-not-allowed',
    readonly: 'border-1 border-border-input-disabled cursor-default bg-background-input-disabled',
  };

  const labelStateClasses = {
    normal: 'text-text-normal-secondary',
    success: 'text-border-input-positive',
    error: 'text-[var(--color-alert-error-icon-bg)]',
    disabled: 'text-text-input-disabled-label',
    readonly: 'text-text-normal-secondary',
  };

  const helperStateClasses = {
    normal: 'text-text-normal-secondary',
    success: 'text-border-input-positive',
    error: 'text-[var(--color-alert-error-icon-bg)]',
    disabled: 'text-text-normal-secondary',
    readonly: 'text-text-normal-secondary',
  };

  // variant="segment": text-only state colors (no border/background of its
  // own — the shared container drawn by the consumer owns those). Figma
  // datePicker states (1291:53616 default / 53645 disabled / 53682 error):
  // disabled keeps the SAME gray as normal secondary text (#5A5A5A), not the
  // more washed-out `labelStateClasses.disabled` token used elsewhere.
  const segmentPlaceholderColor = {
    normal: 'text-text-normal-secondary',
    error: 'text-[var(--color-alert-error-icon-bg)]',
    disabled: 'text-text-normal-secondary',
    readonly: 'text-text-normal-secondary',
  }[actualState] || 'text-text-normal-secondary';

  const segmentValueColor = {
    normal: 'text-text-normal-primary',
    error: 'text-[var(--color-alert-error-icon-bg)]',
    disabled: 'text-text-normal-secondary',
    readonly: 'text-text-normal-primary',
  }[actualState] || 'text-text-normal-primary';

  // Outline classes for focus-visible state
  const outlineClasses = `
    absolute transition-all
    top-0 left-0 right-0 bottom-0 w-full h-full
    outline rounded-[8px] outline-offset-[-4px] z-1
    outline-2 group-focus-visible:outline-border-stroke-focus
    group-focus-visible:outline-offset-[4px]
    hidden group-focus-visible:block
    pointer-events-none
  `;

  // members variant: mark as touched on blur so a required-and-empty field
  // can switch to the error state (Reglas de uso: Input obligatorio).
  const handleSelectBlur = () => {
    if (isMembers && required) {
      setTouched(true);
    }
  };

  // Same focus-visible treatment, sized for a segment's smaller 4px radius.
  const outlineClassesSegment = `
    absolute transition-all
    top-0 left-0 right-0 bottom-0 w-full h-full
    outline rounded-[4px] outline-offset-[-2px] z-1
    outline-2 group-focus-visible:outline-border-stroke-focus
    hidden group-focus-visible:block
    pointer-events-none
  `;

  // Toggle dropdown
  const toggleDropdown = () => {
    if (isInteractive) {
      setIsOpen(!isOpen);
      setFocusedIndex(-1);
    }
  };

  const getOptionElements = () => {
    if (!dropdownRef.current) return [];
    return Array.from(dropdownRef.current.querySelectorAll('[role="option"]'));
  };

  // Select option
  const selectOption = (option) => {
    if (isInteractive) {
      setSelectedValue(option.value);
      setIsOpen(false);
      if (onChange) {
        onChange(option.value);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isInteractive) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          selectOption(options[focusedIndex]);
        } else {
          toggleDropdown();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case 'Tab':
        if (isOpen) {
          // Ignore bubbled Tab events from option elements.
          if (e.target !== e.currentTarget) {
            break;
          }

          const optionElements = getOptionElements();
          const hasOptions = optionElements.length > 0;
          if (!hasOptions) {
            setIsOpen(false);
            setFocusedIndex(-1);
            break;
          }

          // Move focus to first option if none focused, or move to next option
          if (focusedIndex < 0) {
            e.preventDefault();
            setFocusedIndex(0);
            // Focus the first option element
            setTimeout(() => {
              optionElements[0]?.focus();
            }, 0);
          } else if (!e.shiftKey && focusedIndex < options.length - 1) {
            // Tab forward: move to next option
            e.preventDefault();
            const nextIndex = focusedIndex + 1;
            setFocusedIndex(nextIndex);
            setTimeout(() => {
              optionElements[nextIndex]?.focus();
            }, 0);
          } else if (e.shiftKey && focusedIndex > 0) {
            // Shift+Tab: move to previous option
            e.preventDefault();
            const prevIndex = focusedIndex - 1;
            setFocusedIndex(prevIndex);
            setTimeout(() => {
              optionElements[prevIndex]?.focus();
            }, 0);
          } else if (!e.shiftKey && focusedIndex === options.length - 1) {
            // Last option with Tab: close dropdown and allow default Tab behavior
            setIsOpen(false);
            setFocusedIndex(-1);
          } else if (e.shiftKey && focusedIndex === 0) {
            // First option with Shift+Tab: return focus to select input
            setIsOpen(false);
            setFocusedIndex(-1);
            setTimeout(() => {
              if (selectRef.current) {
                const selectInput = selectRef.current.querySelector('[role="combobox"]');
                if (selectInput) {
                  selectInput.focus();
                }
              }
            }, 0);
          }
        }
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && dropdownRef.current) {
      const optionElements = getOptionElements();
      const focusedElement = optionElements[focusedIndex];
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Update selected value when prop changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  // Darksite theme: compact pill trigger (globe icon + label, no chevron) and
  // a dark dropdown built on top of ListItem (Figma language selector spec).
  if (isDarksite) {
    const handleDarksiteOptionKeyDown = (e, option) => {
      const optionElements = getOptionElements();
      const currentIndex = optionElements.indexOf(e.currentTarget);

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectOption(option);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        selectRef.current?.querySelector('[role="combobox"]')?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < optionElements.length - 1) {
          optionElements[currentIndex + 1]?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          optionElements[currentIndex - 1]?.focus();
        }
      }
    };

    return html`
      <div
        class="relative inline-block ${customClassName}"
        data-name="select"
        data-theme=${theme}
        ref=${selectRef}
        ...${rest}
      >
        <div
          role="combobox"
          aria-expanded=${isOpen}
          aria-haspopup="listbox"
          aria-controls=${id ? `${id}-listbox` : undefined}
          aria-label=${label || placeholder || 'Seleccionar idioma'}
          aria-disabled=${disabled}
          tabIndex=${isInteractive ? 0 : -1}
          onClick=${toggleDropdown}
          onKeyDown=${handleKeyDown}
          class=${`
            inline-flex items-center justify-center gap-2 py-[7.5px] px-[12px]
            rounded-full bg-transparent
            border border-solid ${isDarksiteLight ? 'border-[#B6B6B6]' : 'border-[var(--color-language-dark-button-border)]'}
            transition-colors
            ${isInteractive ? (isDarksiteLight ? 'cursor-pointer hover:bg-[rgba(0,0,0,0.04)]' : 'cursor-pointer hover:bg-[rgba(255,255,255,0.08)]') : 'cursor-not-allowed opacity-50'}
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-language-dark-focus-border)] focus-visible:outline-offset-[-1px]
          `}
        >
          <span class="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33334 8 1.33334C4.3181 1.33334 1.33334 4.3181 1.33334 8C1.33334 11.6819 4.3181 14.6667 8 14.6667Z" stroke=${isDarksiteLight ? '#1B1B1B' : 'var(--color-language-dark-text)'} stroke-width="1.2"/>
              <path d="M1.33334 8H14.6667" stroke=${isDarksiteLight ? '#1B1B1B' : 'var(--color-language-dark-text)'} stroke-width="1.2"/>
              <path d="M8 1.33334C9.66695 3.15851 10.6136 5.52738 10.6667 8C10.6136 10.4727 9.66695 12.8415 8 14.6667C6.33305 12.8415 5.38643 10.4727 5.33334 8C5.38643 5.52738 6.33305 3.15851 8 1.33334Z" stroke=${isDarksiteLight ? '#1B1B1B' : 'var(--color-language-dark-text)'} stroke-width="1.2"/>
            </svg>
          </span>
          <span
            class="text-[14px] font-normal leading-[19px] whitespace-nowrap"
            style=${`font-family: var(--font-family-primary); color: ${isDarksiteLight ? '#1B1B1B' : 'var(--color-language-dark-text)'};`}
          >
            ${displayText}
          </span>
        </div>

        <!-- Darksite Dropdown Options -->
        ${isOpen && isInteractive && html`
          <div
            id=${id ? `${id}-listbox` : undefined}
            role="listbox"
            aria-labelledby=${id ? `${id}-label` : undefined}
            ref=${dropdownRef}
            class="absolute z-50 top-[calc(100%+8px)] right-0 w-[260px] rounded-2xl overflow-hidden py-2 flex flex-col"
            style=${`background: ${isDarksiteLight ? '#FFFFFF' : 'var(--color-language-dark-panel-bg)'}; box-shadow: 0 2px 20px 2px var(--color-language-dark-panel-shadow);`}
          >
            ${options.map((option) => html`
              <${ListItem}
                key=${option.value}
                theme=${isDarksiteLight ? 'default' : 'darksite'}
                role="option"
                label=${option.label}
                selected=${selectedValue === option.value}
                showSelectedIcon=${true}
                onClick=${() => selectOption(option)}
                onKeyDown=${(e) => handleDarksiteOptionKeyDown(e, option)}
              />
            `)}
          </div>
        `}

        <!-- Hidden native select for form integration -->
        ${name && html`
          <select
            id=${id}
            name=${name}
            value=${selectedValue}
            disabled=${disabled}
            required=${required}
            class="sr-only"
            tabIndex="-1"
            aria-hidden="true"
          >
            <option value="">${placeholder}</option>
            ${options.map(option => html`
              <option key=${option.value} value=${option.value}>
                ${option.label}
              </option>
            `)}
          </select>
        `}
      </div>
    `;
  }

  return html`
    <div
      class="relative ${customClassName}"
      data-name="select"
      data-variant=${variant}
      ...${rest}
    >
      <div class="flex items-center gap-2">
        <div
          class="relative ${isMembers ? 'w-fit min-w-full' : 'w-full'} min-w-0"
          ref=${selectRef}
        >
      <!-- Select Input Container -->
      <div
        role="combobox"
        aria-expanded=${isOpen}
        aria-haspopup="listbox"
        aria-controls=${id ? `${id}-listbox` : undefined}
        aria-labelledby=${id ? `${id}-label` : undefined}
        aria-disabled=${disabled}
        aria-readonly=${readonly}
        tabIndex=${isFocusable ? 0 : -1}
        onClick=${toggleDropdown}
        onKeyDown=${handleKeyDown}
        onBlur=${handleSelectBlur}
        class=${isSegment ? `
          group relative flex items-center
          ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed'}
          h-8 min-w-[70px]
          px-[var(--spacing-x-small)] md:px-[var(--spacing-small)]
          rounded-[4px]
          transition-colors duration-200
          ${isInteractive ? 'focus-visible:outline-none' : ''}
        ` : `
          group
          ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${isMembers && actualState === 'readonly' ? '!cursor-default' : ''}
          relative flex flex-col justify-center ${isMembers ? 'w-fit min-w-full' : 'w-full'}
          px-[var(--padding-16)] pt-[var(--spacing-small)] pb-[var(--spacing-small)]
          ${actualState === 'disabled' ? 'bg-background-input-disabled' : 'bg-background-input-default'}
          ${isMembers && actualState === 'readonly' ? '!bg-background-input-disabled' : ''}
          rounded-[8px]
          transition-colors duration-200
          h-16
          ${stateClasses[actualState]}
          ${isFocusable ? 'focus-visible:outline-none' : ''}
          ${isOpen && isInteractive && actualState !== 'error' ? '!border-border-input-positive' : ''}
        `}
      >
        <!-- Focus outline div -->
        ${isFocusable && html`
          <div class="${isSegment ? outlineClassesSegment : outlineClasses}"></div>
        `}
        <!-- Floating Label (segment has no label of its own — see inline placeholder below) -->
        ${!isSegment && label && !showInlineMembersLabel && html`
          <label
            for=${id}
            class=${`
              absolute
              pointer-events-none
              transition-all duration-200 ease-in-out
              font-['Red_Hat_Display'] font-normal tracking-[0px]
              ${labelStateClasses[actualState]}
              ${shouldFloat
                ? `top-2 text-xs leading-4 ${hasPrefixIconValue ? 'left-[46px]' : 'left-5'}`
                : `top-1/2 -translate-y-1/2 text-sm leading-5 ${hasPrefixIconValue ? 'left-[calc(var(--padding-16)+1.25rem+var(--spacing-small))]' : 'left-[var(--padding-16)]'}`
              }
              ${labelClassName}
            `}
          >
            ${label}${required ? '*' : ''}
          </label>
        `}

        <!-- Content Row -->
        <div class=${`flex items-center gap-2 ${isSegment ? '' : `${isMembers ? 'w-fit min-w-full' : 'w-full'} h-full`}`}>
          <!-- Icon or Flag -->
          ${!isSegment && hasPrefixIconValue && html`
            <span class="flex-shrink-0 flex items-center ${actualState === 'disabled' ? 'opacity-50' : ''}" aria-hidden="true">
              ${selectedOption && selectedOption.flagPath ? html`
                <img
                  src=${selectedOption.flagPath}
                  alt=""
                  class="w-5 h-[15px] object-contain block"
                />
              ` : selectedOption && selectedOption.flag ? html`
                <span class="text-xl">${selectedOption.flag}</span>
              ` : iconName ? html`
                <${Icon} icon=${iconName} size="m" />
              ` : null}
            </span>
          `}

          <!-- members variant: unfloated label, in-flow so it can widen the field -->
          ${showInlineMembersLabel && html`
            <span
              class=${`
                whitespace-nowrap
                font-['Red_Hat_Display'] font-normal text-sm leading-5 tracking-[0px]
                ${labelStateClasses[actualState]}
                ${labelClassName}
              `}
            >
              ${label}${required ? '*' : ''}
            </span>
          `}

          <!-- Selected Value -->
          ${selectedOption && html`
            <div class=${isSegment ? 'relative flex-1 min-w-0 text-left block' : 'relative -bottom-2 flex-1 w-0 min-w-0 text-left block'}>
              <${Tooltip}
                content=${displayText}
                disabled=${!truncateOption}
                customClassName="block w-full"
                triggerClassName="block w-full"
              >
                <span
                  class=${`
                    block w-full
                    text-base font-bold font-['Red_Hat_Display'] leading-auto
                    ${truncateOption ? 'truncate' : ''}
                    ${isSegment ? segmentValueColor : (actualState === 'disabled' ? 'text-text-input-disabled' : 'text-text-normal-primary')}
                  `}
                >
                  ${displayText}
                </span>
              </${Tooltip}>
            </div>
          `}

          <!-- Inline placeholder when no value (segment only — e.g. "Día") -->
          ${!selectedOption && isSegment && html`
            <span class=${`
              flex-1 min-w-0 text-left block truncate
              text-base font-normal font-['Red_Hat_Display'] leading-auto
              ${segmentPlaceholderColor}
            `}>
              ${placeholder}
            </span>
          `}

          <!-- Spacer when no value (default/members, unless the inline members label already fills the space) -->
          ${!selectedOption && !isSegment && !showInlineMembersLabel && html`
            <span class="flex-1"></span>
          `}

          <!-- Chevron Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            class=${`
              w-4 h-4 flex-shrink-0 ${isSegment ? '' : 'ml-2'}
              transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}
              ${actualState === 'disabled' ? 'opacity-50' : ''}
            `}
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M11.06 5.72656L8 8.7799L4.94 5.72656L4 6.66656L8 10.6666L12 6.66656L11.06 5.72656Z"
              fill="${actualState === 'disabled' ? '#999999' : '#1B1B1B'}"
            />
          </svg>
        </div>
      </div>

      <!-- Dropdown Options -->
      ${isOpen && isInteractive && html`
        <div
          id=${id ? `${id}-listbox` : undefined}
          role="listbox"
          aria-labelledby=${id ? `${id}-label` : undefined}
          ref=${dropdownRef}
          style=${dropdownMaxHeightValue ? { maxHeight: dropdownMaxHeightValue } : undefined}
          class=${`
            absolute z-50 w-full
            ${!dropdownMaxHeightValue ? 'max-h-64' : ''}
            bg-white
            rounded-[var(--border-radius-large)]
            overflow-hidden
            py-2
            shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)]
            ${customDropdownClassName}
          `}
        ><div class="max-h-[12.813rem] overflow-y-auto">
          ${options.map((option, index) => {
            const handleOptionKeyDown = (e) => {
              if (e.key === 'Tab') {
                e.stopPropagation();
                const optionElements = getOptionElements();
                const currentIndex = optionElements.indexOf(e.currentTarget);
                if (currentIndex === -1) {
                  return;
                }

                if (!e.shiftKey && currentIndex < options.length - 1) {
                  e.preventDefault();
                  // Tab forward: move to next option
                  const nextIndex = currentIndex + 1;
                  setFocusedIndex(nextIndex);
                  setTimeout(() => {
                    optionElements[nextIndex]?.focus();
                  }, 0);
                } else if (e.shiftKey && currentIndex > 0) {
                  e.preventDefault();
                  // Shift+Tab: move to previous option
                  const prevIndex = currentIndex - 1;
                  setFocusedIndex(prevIndex);
                  setTimeout(() => {
                    optionElements[prevIndex]?.focus();
                  }, 0);
                } else if (!e.shiftKey && currentIndex === options.length - 1) {
                  // Last option with Tab: close dropdown
                  setIsOpen(false);
                  setFocusedIndex(-1);
                } else if (e.shiftKey && currentIndex === 0) {
                  e.preventDefault();
                  // First option with Shift+Tab: return focus to select input
                  setIsOpen(false);
                  setFocusedIndex(-1);
                  setTimeout(() => {
                    if (selectRef.current) {
                      const selectInput = selectRef.current.querySelector('[role="combobox"]');
                      if (selectInput) {
                        selectInput.focus();
                      }
                    }
                  }, 0);
                }
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                selectOption(option);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                setFocusedIndex(-1);
                setTimeout(() => {
                  if (selectRef.current) {
                    const selectInput = selectRef.current.querySelector('[role="combobox"]');
                    if (selectInput) {
                      selectInput.focus();
                    }
                  }
                }, 0);
              }
            };

            const handleOptionMouseDown = () => {
              setPressedIndex(index);
            };

            const handleOptionMouseUp = () => {
              setPressedIndex(-1);
            };

            const handleOptionMouseLeave = () => {
              setPressedIndex(-1);
            };

            const handleOptionTouchStart = () => {
              setPressedIndex(index);
            };

            const handleOptionTouchEnd = () => {
              setPressedIndex(-1);
            };

            const isPressed = pressedIndex === index;
            const isLast = index === options.length - 1;

            return html`
              <div
                key=${option.value}
                role="option"
                aria-selected=${selectedValue === option.value}
                tabIndex=${focusedIndex === index ? 0 : -1}
                onClick=${() => selectOption(option)}
                onKeyDown=${handleOptionKeyDown}
                onFocus=${() => setFocusedIndex(index)}
                onMouseDown=${handleOptionMouseDown}
                onMouseUp=${handleOptionMouseUp}
                onMouseLeave=${handleOptionMouseLeave}
                onTouchStart=${handleOptionTouchStart}
                onTouchEnd=${handleOptionTouchEnd}
                class=${`
                  relative flex items-center justify-between
                  px-[var(--padding-16)] py-[var(--spacing-small)]
                  cursor-pointer transition-colors duration-150
                  font-['Red_Hat_Display'] text-base leading-normal tracking-[0px]
                  ${isLast ? 'rounded-bl-[8px] rounded-br-[8px]' : ''}
                  ${selectedValue === option.value ? 'font-bold' : 'font-normal'}
                  border-2 border-transparent focus-visible:border-[var(--color-border-stroke-focus)]
                  focus-visible:outline-none
                  ${focusedIndex === index && !isPressed ? 'bg-[var(--bg-page-light)]' : ''}
                  ${isPressed ? 'bg-[var(--state-hover-darken)] text-[var(--text-brand-light)]' : 'text-text-normal-primary hover:bg-[var(--bg-hover-light)]'}
                `}
              >
                <span class="flex items-center gap-4">
                  ${option.flagPath && html`
                    <img
                      src=${option.flagPath}
                      alt=""
                      class="w-6 h-6 object-fill flex-shrink-0 block"
                    />
                  `}
                  ${option.flag && !option.flagPath && html`
                    <span class="text-xl flex-shrink-0">${option.flag}</span>
                  `}
                  <span>
                    ${option.label}
                  </span>
                </span>
                ${selectedValue === option.value && html`
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="flex-shrink-0">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.59 15.58L4.42 11.41L3 12.82L8.59 18.41L20.59 6.41L19.18 5L8.59 15.58Z" fill="#1EA93C"/>
                  </svg>
                `}
                ${selectedValue === option.value && html`
                  <div
                    class="w-[4px] h-9 left-0 top-1/2 -translate-y-1/2 absolute bg-border-input-positive"
                  ></div>
                `}
              </div>
            `;
          })}
        </div></div>
      `}

      <!-- Hidden native select for form integration -->
      ${name && html`
        <select
          id=${id}
          name=${name}
          value=${selectedValue}
          disabled=${disabled}
          required=${required}
          class="sr-only"
          tabIndex="-1"
          aria-hidden="true"
        >
          <option value="">${placeholder}</option>
          ${options.map(option => html`
            <option key=${option.value} value=${option.value}>
              ${option.label}
            </option>
          `)}
        </select>
      `}
        </div>

        <!-- Info Tooltip Icon: rendered OUTSIDE the field's border, to its
             right, per Figma "Reglas de uso" (Tooltip) -->
        ${tooltipContent && html`
          <${Tooltip} variant="hint" content=${tooltipContent} position="top" customClassName="flex-shrink-0">
            <button
              type="button"
              aria-label="Más información"
              class="flex items-center justify-center w-4 h-4 flex-shrink-0"
            >
              <${Icon} icon="alert/info" size="s" />
            </button>
          </${Tooltip}>
        `}
      </div>

      <!-- Helper Text -->
      ${resolvedHelperText && html`
        <div class="flex items-start gap-1 mt-[var(--spacing-x-small)] font-['Red_Hat_Display'] font-normal text-sm leading-5 tracking-[0px] ${helperStateClasses[actualState]}">
          ${actualState === 'error' && html`
            <span class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true">
              <${Icon} icon="alert/Error" size="s" color="currentColor" />
            </span>
          `}
          <span>${resolvedHelperText}</span>
        </div>
      `}
    </div>
  `;
};

export default Select;
