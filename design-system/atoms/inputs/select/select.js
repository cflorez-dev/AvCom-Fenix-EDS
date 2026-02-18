/* eslint-disable */ /* Reason: focus only on the changes made  */
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../icon/icon.js';

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
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {string} [props.id] - HTML id attribute
 * @param {string} [props.name] - HTML name attribute for forms
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
  labelClassName = '',
  customDropdownClassName = '',
  customClassName = '',
  id,
  name,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [pressedIndex, setPressedIndex] = useState(-1);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownMaxHeightValue = dropdownMaxHeight !== undefined && dropdownMaxHeight !== null
    ? (typeof dropdownMaxHeight === 'number' ? `${dropdownMaxHeight}px` : String(dropdownMaxHeight))
    : null;

  // Determine actual state
  const actualState = disabled ? 'disabled' : readonly ? 'readonly' : state;
  const isInteractive = !disabled && !readonly;

  // Find selected option label
  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Determine if label should float (when has value or is focused)
  const shouldFloat = selectedValue || isOpen;

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
    error: 'text-red-700',
    disabled: 'text-text-input-disabled-label',
    readonly: 'text-text-normal-secondary',
  };

  const helperStateClasses = {
    normal: 'text-text-normal-secondary',
    success: 'text-border-input-positive',
    error: 'text-red-700',
    disabled: 'text-text-normal-secondary',
    readonly: 'text-text-normal-secondary',
  };

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

  return html`
    <div
      class="relative w-full ${customClassName}"
      data-name="select"
      ref=${selectRef}
      ...${rest}
    >
      <!-- Select Input Container -->
      <div
        role="combobox"
        aria-expanded=${isOpen}
        aria-haspopup="listbox"
        aria-controls=${id ? `${id}-listbox` : undefined}
        aria-labelledby=${id ? `${id}-label` : undefined}
        aria-disabled=${disabled}
        tabIndex=${isInteractive ? 0 : -1}
        onClick=${toggleDropdown}
        onKeyDown=${handleKeyDown}
        class=${`
          group
          ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed'}
          relative flex flex-col justify-center w-full
          px-[var(--padding-16)] pt-[var(--spacing-small)] pb-[var(--spacing-small)]
          ${actualState === 'disabled' ? 'bg-background-input-disabled' : 'bg-background-input-default'}
          rounded-[8px]
          transition-colors duration-200
          h-16
          ${stateClasses[actualState]}
          ${isInteractive ? 'focus-visible:outline-none' : ''}
          ${isOpen && isInteractive && actualState !== 'error' ? '!border-border-input-positive' : ''}
        `}
      >
        <!-- Focus outline div -->
        ${isInteractive && html`
          <div class="${outlineClasses}"></div>
        `}
        <!-- Floating Label -->
        ${label && html`
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
        <div class="flex items-center gap-2 w-full h-full">
          <!-- Icon or Flag -->
          ${hasPrefixIconValue && html`
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

          <!-- Selected Value -->
          ${selectedOption && html`
            <span
              class=${`
                relative -bottom-2 flex-1 text-left
                text-base font-bold font-['Red_Hat_Display'] leading-auto
                ${actualState === 'disabled' ? 'text-text-input-disabled' : 'text-text-normal-primary'}
              `}
            >
              ${displayText}
            </span>
          `}

          <!-- Spacer when no value -->
          ${!selectedOption && html`
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
              w-4 h-4 flex-shrink-0 ml-[var(--spacing-small)]
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
            py-2
            absolute z-50 w-full
            ${!dropdownMaxHeightValue ? 'max-h-64' : ''}
            bg-white
            rounded-[var(--border-radius-large)]
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
                  <span>${option.label}</span>
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

      <!-- Helper Text -->
      ${helperText && html`
        <div class="flex items-start mt-[var(--spacing-x-small)] font-['Red_Hat_Display'] font-normal text-sm leading-5 tracking-[0px] ${helperStateClasses[actualState]}">
          ${actualState === 'error' && html`
            <svg
              class="w-4 h-4 mr-1 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="9" fill="currentColor" />
              <text x="10" y="14" text-anchor="middle" fill="white" font-size="12" font-weight="bold">i</text>
            </svg>
          `}
          <span>${helperText}</span>
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
};

export default Select;
