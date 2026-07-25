import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../icon/icon.js';
import { Tooltip } from '../../tooltip/tooltip.js';

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
 * @param {boolean} [props.truncateOption=false] - Truncate input value and show tooltip on hover when not focused
 * @param {('default'|'members')} [props.variant='default'] - Layout variant.
 *   'members' implements the Members "Reglas de uso" spec:
 *   - Textos desbordados: when the (unselected) label doesn't fit the field's
 *     width, the field widens to fit it instead of wrapping to a second line
 *     or being truncated/hidden. Intended for use inside a formGrid column,
 *     where the field should never shrink below the column width but may
 *     grow past it when the label is long. The value truncates horizontally
 *     (single line, ellipsis) via `truncateOption` while unfocused, revealing
 *     the full text on hover/keyboard focus through a `Tooltip`.
 *   - Input obligatorio: when `required` is true and the field is left empty
 *     after being touched (blurred), it switches to the `error` state and
 *     shows a default "Este campo es obligatorio." helper text (unless a
 *     custom `helperText` is provided).
 *   Note: unlike Select, the "Diferencia entre deshabilitado y solo lectura"
 *   rule does not apply to Input — the Figma spec only illustrates it for
 *   dropdownInput, so `readonly` here keeps the native input behavior
 *   (already focusable, content selectable/copyable) without extra styling.
 * @param {string} [props.tooltipContent] - Contextual help text. When set, renders an
 *   info icon (Figma `<tooltipIcon>`) to the right of, and outside, the
 *   field's border, that reveals a `Tooltip` (variant="hint") above the field
 *   on hover/keyboard focus. Per the "Reglas de uso" spec: not every field
 *   needs this — reserve it for content that complements (not repeats) the
 *   label/placeholder.
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
  truncateOption = false,
  variant = 'default',
  tooltipContent,
  customClassName = '',
  id,
  name,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const tabKeyPressedRef = useRef(false);

  const isMembers = variant === 'members';
  const isInteractive = !disabled && !readonly;
  // members variant: per "Reglas de uso" (Input obligatorio), a required
  // field left empty after being touched (blurred) must switch to the error
  // state and show a default required-field message.
  const showRequiredError = isMembers && required && touched && !inputValue && isInteractive;
  // Determine actual state
  let actualState = state;
  if (disabled) actualState = 'disabled';
  else if (readonly) actualState = 'readonly';
  else if (showRequiredError) actualState = 'error';
  const resolvedHelperText = showRequiredError && !helperText ? 'Este campo es obligatorio.' : helperText;

  // Determine if label should float (when has value or is focused)
  const shouldFloat = inputValue || isFocused;

  // members variant: while unfloated, the label stands in for the value and
  // must be rendered in-flow (not absolutely positioned) so its intrinsic
  // width can drive the field's `w-fit` growth (see "Label corto y claro").
  const showInlineMembersLabel = isMembers && !!label && !shouldFloat;
  // Unlike Select, Input does not get special readonly focus-ring handling
  // under the members variant (see JSDoc note above) — always gate on
  // isInteractive, matching the default (non-members) behavior.
  const showsFocusRing = isInteractive;

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
    if (isMembers && required) {
      setTouched(true);
    }
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
      class="relative ${customClassName}"
      data-name="input"
      data-variant=${variant}
      ...${rest}
    >
      <div class="flex items-center gap-2">
        <div class="relative ${isMembers ? 'w-fit min-w-full' : 'w-full'} min-w-0">
      <!-- Input Container -->
      <div
        onClick=${handleContainerClick}
        class=${`
          relative flex items-center gap-2 ${isMembers ? 'w-fit min-w-full' : 'w-full'} h-[64px]
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
        ${isKeyboardFocused && showsFocusRing && html`
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
        ${label && !showInlineMembersLabel && html`
          <label
            for=${id}
            class=${`
              absolute
              pointer-events-none
              transition-all duration-100 ease-in-out
              font-['Red_Hat_Display'] font-normal tracking-[0px]
              ${labelStateClasses[actualState]}
              ${shouldFloat
    ? `top-[10px] text-xs leading-[18px] ${prefixIconName ? 'left-[calc(var(--padding-16)+1.25rem+var(--spacing-x-small))]' : 'left-[var(--padding-16)]'}`
    : `top-1/2 -translate-y-1/2 text-sm leading-[21px] ${prefixIconName ? 'left-[calc(var(--padding-16)+1.25rem+var(--spacing-x-small))]' : 'left-[var(--padding-16)]'}`
}
            `}
          >
            ${label}${required ? '*' : ''}
          </label>
        `}

        <!-- members variant: unfloated label, in-flow so it can widen the field -->
        ${showInlineMembersLabel && html`
          <span
            class=${`
              whitespace-nowrap
              font-['Red_Hat_Display'] font-normal text-sm leading-[21px] tracking-[0px]
              ${labelStateClasses[actualState]}
            `}
          >
            ${label}${required ? '*' : ''}
          </span>
        `}

        <!-- Content (Input) -->
        <div class="${showInlineMembersLabel ? 'flex flex-col justify-center min-w-0' : 'flex-1 flex flex-col justify-center min-w-0'}">

          <!-- Input Field -->
          ${shouldFloat && html`
            <${Tooltip}
              content=${inputValue}
              disabled=${!truncateOption || !inputValue || isFocused}
              customClassName="block w-full relative -bottom-2 left-0"
              triggerClassName="block w-full"
            >
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
                  w-full bg-transparent border-0 outline-none p-0
                  !text-base !font-bold font-['Red_Hat_Display'] leading-normal
                  ${truncateOption && !isFocused ? 'truncate' : ''}
                  ${actualState === 'disabled' ? 'text-[#C4C8C5] cursor-not-allowed' : actualState === 'readonly' ? 'text-text-normal-secondary cursor-default' : 'text-text-normal-primary'}
                  placeholder:text-text-normal-secondary placeholder:font-normal
                `}
              />
            </${Tooltip}>
          `}

          <!-- Cursor placeholder when active but empty -->
          ${!shouldFloat && isFocused && !inputValue && html`
            <div class="!text-base !font-bold font-['Red_Hat_Display'] text-text-normal-primary">|</div>
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

export default Input;
