import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../icon/icon.js';

const html = htm.bind(h);

/**
 * Input Component - Text input field with multiple states
 * 
 * @param {Object} props - Component properties
 * @param {string} props.label - Label text for the input (supports * for required indicator)
 * @param {string} [props.placeholder=''] - Placeholder text when input is empty
 * @param {string} [props.value=''] - Current input value
 * @param {Function} [props.onChange] - Callback function when value changes (value) => void
 * @param {string} [props.type='text'] - Input type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
 * @param {string} [props.state='normal'] - Visual state: 'normal' | 'success' | 'error'
 * @param {string} [props.helperText=''] - Helper text displayed below the input
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {boolean} [props.readonly=false] - Whether the input is readonly
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {string} [props.prefixIconName] - Icon name to display on the left (e.g., 'action/plane')
 * @param {string} [props.suffixIconName] - Icon name to display on the right (e.g., 'action/view')
 * @param {Function} [props.onSuffixIconClick] - Callback when suffix icon is clicked
 * @param {boolean} [props.showPasswordToggle=false] - Show password visibility toggle (only for type='password')
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {string} [props.id] - HTML id attribute
 * @param {string} [props.name] - HTML name attribute for forms
 * @param {Object} props.rest - Additional HTML attributes
 * @returns {import('preact').VNode}
 */
export const Input = ({
  label = '',
  placeholder = '',
  value = '',
  onChange,
  type = 'text',
  state = 'normal',
  helperText = '',
  disabled = false,
  readonly = false,
  required = false,
  prefixIconName,
  suffixIconName,
  onSuffixIconClick,
  showPasswordToggle = false,
  customClassName = '',
  id,
  name,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);
  const tabKeyPressedRef = useRef(false);

  // Determine actual state
  const actualState = disabled ? 'disabled' : readonly ? 'readonly' : state;
  const isInteractive = !disabled && !readonly;

  // Determine if label should float (when has value or is focused)
  const shouldFloat = inputValue || isFocused;

  // Determine actual input type (toggle password visibility)
  const actualInputType = type === 'password' && showPassword ? 'text' : type;

  // State-based styling classes - Figma specs, Tailwind only
  const stateClasses = {
    normal: 'outline outline-1 outline-[#969696] hover:outline-border-input-positive',
    success: 'outline outline-1 outline-border-input-positive',
    error: 'outline outline-1 outline-border-input-error',
    disabled: 'outline outline-1 outline-border-input-disabled cursor-not-allowed',
    readonly: 'outline outline-1 outline-border-input-disabled cursor-default',
  };

  const labelStateClasses = {
    normal: 'text-text-normal-secondary',
    success: 'text-border-input-positive',
    error: 'text-[var(--color-alert-error-icon-bg)]',
    disabled: 'text-[#C4C8C5]',
    readonly: 'text-text-normal-secondary',
  };

  const helperStateClasses = {
    normal: 'text-text-normal-secondary',
    success: 'text-border-input-positive',
    error: 'text-[var(--color-alert-error-icon-bg)]',
    disabled: 'text-text-normal-secondary',
    readonly: 'text-text-normal-secondary',
  };

  // Listen for Tab key globally to detect keyboard navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Tab') {
        tabKeyPressedRef.current = true;
      }
    };
    const onMouseDown = () => {
      tabKeyPressedRef.current = false;
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
    };
  }, []);

  // Handle focus - show keyboard ring only if Tab was pressed
  const handleFocus = () => {
    setIsFocused(true);
    if (tabKeyPressedRef.current) {
      setIsKeyboardFocused(true);
    }
    tabKeyPressedRef.current = false;
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    setIsKeyboardFocused(false);
  };

  // Handle input change
  const handleChange = (e) => {
    if (isInteractive) {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    }
  };

  // Toggle password visibility
  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  // Handle suffix icon click
  const handleSuffixClick = () => {
    if (showPasswordToggle && type === 'password') {
      handlePasswordToggle();
    } else if (onSuffixIconClick) {
      onSuffixIconClick();
    }
  };

  // Handle container click to focus input
  const handleContainerClick = () => {
    if (isInteractive && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return html`
    <div
      class="relative w-full ${customClassName}"
      data-name="input"
      ...${rest}
    >
      <!-- Input Container -->
      <div
        onClick=${handleContainerClick}
        class=${`
          relative flex items-center gap-2 w-full h-[64px]
          px-[var(--padding-16)] pt-3 pb-3
          ${actualState === 'disabled' ? 'bg-background-input-disabled' : actualState === 'readonly' ? 'bg-background-input-disabled' : 'bg-background-input-default'}
          rounded-[8px]
          transition-colors duration-200
          outline-offset-[-1px]
          ${stateClasses[actualState]}
          ${isFocused && isInteractive && actualState !== 'error' ? '!outline-border-input-positive' : ''}
          ${isInteractive ? 'cursor-text' : ''}
        `}
      >
        <!-- Focus Ring (keyboard navigation only) -->
        ${isKeyboardFocused && isInteractive && html`
          <div
            class="absolute -inset-[2px] rounded-[9px] outline outline-border-stroke-focus pointer-events-none"
            aria-hidden="true"
          />
        `}
        <!-- Prefix Icon -->
        ${prefixIconName && html`
          <span class="flex-shrink-0 flex items-center ${actualState === 'disabled' ? 'opacity-50' : ''}" aria-hidden="true">
            <${Icon} icon=${prefixIconName} size="m" customClassName=${actualState === 'disabled' ? '[&_path]:fill-[#C4C8C5]' : ''} />
          </span>
        `}

        <!-- Floating Label -->
        ${label && html`
          <label
            for=${id}
            class=${`
              absolute
              pointer-events-none
              transition-all duration-100 ease-in-out
              font-['Red_Hat_Display'] font-normal tracking-[0px]
              ${labelStateClasses[actualState]}
              ${shouldFloat
    ? `top-[10px] text-xs leading-[18px] ${prefixIconName ? 'left-[46px]' : 'left-[var(--padding-16)]'}`
    : `top-1/2 -translate-y-1/2 text-sm leading-[21px] ${prefixIconName ? 'left-[calc(var(--padding-16)+1.25rem+var(--spacing-small))]' : 'left-[var(--padding-16)]'}`
}
            `}
          >
            ${label}${required ? '*' : ''}
          </label>
        `}

        <!-- Content (Input) -->
        <div class="flex-1 flex flex-col justify-center min-w-0">

          <!-- Input Field -->
          ${shouldFloat && html`
            <input
              ref=${inputRef}
              id=${id}
              name=${name}
              type=${actualInputType}
              value=${inputValue}
              placeholder=${placeholder}
              disabled=${disabled}
              readonly=${readonly}
              required=${required}
              onInput=${handleChange}
              onFocus=${handleFocus}
              onBlur=${handleBlur}
              class=${`
                bg-white
                w-full relative -bottom-2 left-[2px] bg-transparent border-0 outline-none p-0
                !text-base font-bold font-['Red_Hat_Display'] leading-normal
                ${actualState === 'disabled' ? 'text-[#C4C8C5] cursor-not-allowed' : actualState === 'readonly' ? 'text-text-normal-secondary cursor-default' : 'text-text-normal-primary'}
                placeholder:text-text-normal-secondary placeholder:font-normal
              `}
            />
          `}

          <!-- Cursor placeholder when active but empty -->
          ${!shouldFloat && isFocused && !inputValue && html`
            <div class="!text-base font-bold font-['Red_Hat_Display'] text-text-normal-primary">|</div>
          `}

          <!-- Hidden input for when not floating -->
          <input
            ref=${!shouldFloat ? inputRef : null}
            id=${!shouldFloat ? id : undefined}
            name=${!shouldFloat ? name : undefined}
            type=${actualInputType}
            value=${inputValue}
            placeholder=${placeholder}
            disabled=${disabled}
            readonly=${readonly}
            required=${required}
            onInput=${handleChange}
            onFocus=${handleFocus}
            onBlur=${handleBlur}
            class=${`
              bg-white
              ${shouldFloat ? 'sr-only' : `absolute inset-0 w-full h-full opacity-0 cursor-pointer font-['Red_Hat_Display']!`}
            `}
          />
        </div>
        <!-- End Content -->

        <!-- Suffix Icon -->
        ${(suffixIconName || (showPasswordToggle && type === 'password')) && html`
          <button
            type="button"
            onClick=${handleSuffixClick}
            disabled=${disabled}
            class=${`
              flex-shrink-0 flex items-center
              ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed'}
              ${actualState === 'disabled' ? 'opacity-50' : ''}
            `}
            aria-label=${showPasswordToggle && type === 'password' ? (showPassword ? 'Hide password' : 'Show password') : 'Suffix icon'}
          >
            <${Icon}
              icon=${suffixIconName || 'action/view'}
              size="s"
              customClassName=${`
                ${actualState === 'disabled' ? '[&_path]:fill-[#C4C8C5]' : actualState === 'readonly' ? '[&_path]:fill-text-normal-secondary' : ''}
              `}
            />
          </button>
        `}
      </div>

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
    </div>
  `;
};

export default Input;
