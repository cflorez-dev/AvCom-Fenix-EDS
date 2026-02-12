import { h } from '@dropins/tools/preact.js';
import { useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SimpleLoader } from '../simple-loader/simple-loader.js';

const html = htm.bind(h);

/**
 * Button - Componente de botón de Avianca basado en diseño Figma
 *
 * ## Props
 * - `variant`: `"primary" | "secondary" | "tertiary" | "danger" | "transparent"` –
 *   Variante visual del botón (por defecto: `"primary"`).
 * - `size`: `"xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "icon"` –
 *   Tamaño del botón (por defecto: `"md"`).
 * - `iconOnly`: `boolean` – Modo solo icono (por defecto: `false`).
 * - `loading`: `boolean` – Muestra un spinner de carga (por defecto: `false`).
 * - `borderActiveColor`: `string` – Color CSS variable para el border en estado active (opcional).
 * - `borderFocusColor`: `string` – Color CSS variable para el border en estado focus (opcional).
 * - `href`: `string` – URL para navegar. Si se pasa, renderiza un `<a>` en lugar de `<button>`.
 * - `target`: `string` – Target del enlace (ej: '_blank'). Solo aplica si hay `href`.
 * - `rel`: `string` – Rel del enlace (ej: 'nofollow'). Solo aplica si hay `href`.
 * - `customClassName`: Clases CSS adicionales.
 * - `children`: Contenido dentro del botón (texto o iconos como child nodes).
 * - `...rest`: Otras propiedades válidas como `onClick`, `disabled`, etc.
 */

export const Button = ({
  customClassName = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconOnly = false,
  loading = false,
  borderActiveColor = null,
  borderFocusColor = null,
  href = null,
  target = null,
  rel = null,
  children,
  ...rest
}) => {
  const variantStyles = {
    primary: {
      basesClases: `
        ${disabled ? 'bg-background-brand-primary-disable' : 'bg-background-brand-primary-default'}
        ${disabled ? 'border-border-brand-primary-disable' : 'border-border-brand-primary-default'}
      `,
      basesClaesIneractions: `
        ${disabled === false && `
          hover:bg-background-brand-primary-hover
          hover:border-border-brand-primary-hover
          active:bg-background-brand-primary-active
          active:!border-border-brand-primary-active
        `}
      `,
      basesClasesChild: `${disabled ? 'text-text-brand-disable' : 'text-text-brand-primary'}`,
      basesClasesChildInteractions: `${disabled === false && 'group-hover:text-text-brand-primary'}`,
    },
    secondary: {
      basesClases: `
        ${disabled ? 'bg-background-brand-secondary-disable' : 'bg-background-brand-secondary-default'}
        ${disabled ? 'border-border-brand-secondary-disable' : 'border-border-brand-secondary-default'}
      `,
      basesClaesIneractions: `
        ${disabled === false && `
          hover:bg-background-brand-secondary-hover
          hover:border-border-brand-secondary-hover
          active:bg-background-brand-secondary-active
          active:!border-border-brand-secondary-active
        `}
      `,
      basesClasesChild: `${disabled ? 'text-text-brand-disable' : 'text-text-brand-secondary'}`,
      basesClasesChildInteractions: `${disabled === false && 'group-hover:text-text-brand-secondary'}`,
    },
    tertiary: {
      basesClases: `
        ${disabled ? 'bg-background-brand-secondary-disable' : 'bg-background-brand-secondary-default'}
        ${disabled ? 'border-background-brand-secondary-disable' : 'border-background-brand-secondary-default'}
      `,
      basesClaesIneractions: `
        ${disabled === false && `
          hover:bg-background-brand-secondary-hover
          hover:border-background-brand-secondary-hover
          active:bg-background-brand-secondary-active
          active:!border-border-brand-secondary-active
        `}
      `,
      basesClasesChild: `${disabled ? 'text-text-brand-disable' : 'text-text-brand-secondary'}`,
      basesClasesChildInteractions: `${disabled === false && 'group-hover:text-text-brand-secondary leading-[1.188rem]'}`,
    },
    danger: {
      basesClases: `
        ${disabled ? 'bg-background-brand-primary-disable' : 'bg-background-brand-highlight-default'}
        ${disabled ? 'border-border-brand-primary-disable' : 'border-border-brand-highlight-default'}
      `,
      basesClaesIneractions: `
        ${disabled === false && `
          hover:bg-background-brand-highlight-hover
          hover:border-border-brand-highlight-hover
          active:bg-background-brand-highlight-active
          active:!border-border-brand-highlight-active
        `}
      `,
      basesClasesChild: `${disabled ? 'text-text-brand-disable' : 'text-text-brand-primary'}`,
      basesClasesChildInteractions: `${disabled === false && 'group-hover:text-text-brand-primary'}`,
    },
    transparent: {
      basesClases: `
        bg-transparent
        border-none
      `,
      basesClaesIneractions: `
        ${disabled === false && `
          hover:bg-zinc-300
          active:bg-zinc-400
        `}
      `,
      basesClasesChild: `${disabled ? 'text-text-brand-disable' : 'text-text-brand-secondary'}`,
      basesClasesChildInteractions: `${disabled === false && 'group-hover:text-text-brand-secondary'}`,
    },
  };

  const isDarkLoaderVariation = variant === 'secondary' || variant === 'tertiary' || variant === 'transparent';

  const sizeStyles = {
    xxxs: {
      height: 'h-4',
      padding: 'px-2',
      fontSize: 'text-xs',
      widthIconOnly: 'w-4',
    },
    xxs: {
      height: 'h-6',
      padding: 'px-2',
      fontSize: 'text-xs',
      widthIconOnly: 'w-6',
    },
    xs: {
      height: 'h-8',
      padding: 'px-4',
      fontSize: 'text-sm',
      widthIconOnly: 'w-[32px]',
    },
    sm: {
      height: 'h-9',
      padding: 'px-4',
      fontSize: 'text-sm',
      widthIconOnly: 'w-[36px]',
    },
    md: {
      height: 'h-12',
      padding: 'px-6',
      fontSize: 'text-xl',
      widthIconOnly: 'w-[52px]',
    },
    lg: {
      height: 'h-14',
      padding: 'px-6',
      fontSize: 'text-xl',
      widthIconOnly: 'w-[56px]',
    },
    icon: {
      height: 'h-6',
      padding: 'px-2',
      fontSize: 'text-xs',
      widthIconOnly: 'w-6',
    },
  };

  const choosenVariantStyles = variantStyles[variant];
  const chosenSizeStyles = sizeStyles[size];

  const basesClases = `
      group
      relative
      z-2
      ${disabled === false && 'cursor-pointer'}
      inline-flex
      justify-center
      align-center
      items-center 
      transition-all 
      rounded-[32px] 
      ${variant === 'transparent' ? 'border-none' : 'border border-[2px]'}
      ${iconOnly ? 'p-0' : chosenSizeStyles.padding}
      gap-2
      ${chosenSizeStyles.height}
      ${choosenVariantStyles.basesClases}
      ${iconOnly ? `${chosenSizeStyles.widthIconOnly} 'w-full'` : ''}
      focus-visible:outline-none
      focus-visible:ring-0
      focus-visible:ring-offset-0
      focus-visible:shadow-none
      `;

  const basesClaesIneractions = `
    ${choosenVariantStyles.basesClaesIneractions}
      
  `;

  const basesClasesChild = `
    text-center
    flex
    justify-start
    align-center
    ${chosenSizeStyles.fontSize}
    font-bold
    ${choosenVariantStyles.basesClasesChild}
  `;
  const basesClasesChildInteractions = `
  ${choosenVariantStyles.basesClasesChildInteractions}
  `;

  const buttonRef = useRef(null);

  // Build CSS custom properties object for dynamic border colors
  const customStyles = {};
  if (borderActiveColor && !disabled) {
    const cssVarName = borderActiveColor.startsWith('var(')
      ? borderActiveColor
      : borderActiveColor.startsWith('--')
        ? `var(${borderActiveColor})`
        : `var(--${borderActiveColor})`;
    customStyles['--button-border-active'] = cssVarName;
  }
  if (borderFocusColor && !disabled) {
    const cssVarName = borderFocusColor.startsWith('var(')
      ? borderFocusColor
      : borderFocusColor.startsWith('--')
        ? `var(${borderFocusColor})`
        : `var(--${borderFocusColor})`;
    customStyles['--button-border-focus'] = cssVarName;
  }

  const outlineClasses = `
    absolute transition-all  
    max-w-full max-h-full w-full h-full 
    outline rounded-[32px] outline-offset-[-4px] z-1  
    outline-2  group-focus-visible:outline-border-stroke-focus 
    group-focus-visible:outline-offset-[4px]
    hidden group-focus-visible:block
  `;

  const combinedClasses = `${basesClases} ${basesClaesIneractions} ${customClassName}`;

  const innerContent = html`
    <div class="${outlineClasses}"></div>
    <span class="${`${basesClasesChild} ${basesClasesChildInteractions}`}">
      ${children}
    </span>
    ${loading && html`
      <${SimpleLoader} size="small" onDark=${!isDarkLoaderVariation} />
    `}
  `;

  // If href is provided and not disabled, render as <a> element
  if (href && !disabled) {
    return html`
      <a
        ref=${buttonRef}
        data-button
        href=${href}
        target=${target}
        rel=${rel}
        class="${combinedClasses}"
        style=${customStyles}
        ...${rest}
      >
        ${innerContent}
      </a>
    `;
  }

  // Default: render as <button> element
  return html`
    <button 
      ref=${buttonRef}
      data-button
      disabled=${disabled}
      class="${combinedClasses}"
      style=${customStyles}
      ...${rest}
    >
      ${innerContent}
    </button>
  `;
};

export default Button;
