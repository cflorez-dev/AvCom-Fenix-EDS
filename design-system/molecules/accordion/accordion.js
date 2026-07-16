import { h } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * Accordion component
 * @param {Object} props - Component props
 * @param {string} props.title - Accordion title
 * @param {'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'p'} [props.titleLevel='p'] - Semantic heading level
 * @param {boolean} props.defaultOpen - Whether accordion starts open
 * @param {string} props.customClassName - Additional CSS classes
 * @param {string} [props.chevronColor='var(--icon-normal-light)'] - Color del chevron;
 *   el default blanco lo necesita footer-columns (fondo oscuro) — consumidores sobre
 *   fondo claro deben pasar var(--icon-normal-primary)
 * @param {*} props.children - Accordion content
 * @param {Function} props.onToggle - Callback when accordion toggles
 */
export const Accordion = ({
  title = 'Title',
  titleLevel = 'p',
  defaultOpen = false,
  customClassName = '',
  chevronColor = 'var(--icon-normal-light)',
  overflowVisibleWhenOpen = false,
  children,
  onToggle,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px');
  // overflow-visible sólo DESPUÉS de que termina la animación de apertura (el
  // accordion no llega de forma fiable a height 'auto', así que se usa un flag
  // por timeout en vez de onTransitionEnd). Permite que popovers internos (ej.
  // AcceleratorTooltip del FAB Cenit) no queden recortados. Opt-in por prop.
  const [overflowVisible, setOverflowVisible] = useState(defaultOpen && overflowVisibleWhenOpen);

  const handleToggle = (e) => {
    e.preventDefault();
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(e);
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      const contentEl = contentRef.current;

      if (isOpen) {
        // When opening, first set to 'auto' to measure full height
        setHeight('auto');

        // Use requestAnimationFrame to measure height in next frame
        requestAnimationFrame(() => {
          const { scrollHeight } = contentEl;

          // Set measured height to start transition
          setHeight(`${scrollHeight}px`);
        });
      } else {
        // When closing: Set current height then animate to 0px
        setHeight(`${contentEl.scrollHeight}px`);

        setTimeout(() => {
          setHeight('0px');
        }, 0);
      }
    }
  }, [isOpen]);

  // Flag de overflow: al abrir, esperar ~la duración de la transición (300ms)
  // antes de permitir overflow-visible (durante la animación debe seguir
  // hidden para que el reveal recorte); al cerrar, hidden de inmediato.
  useEffect(() => {
    if (!overflowVisibleWhenOpen) return undefined;
    if (!isOpen) { setOverflowVisible(false); return undefined; }
    const t = setTimeout(() => setOverflowVisible(true), 320);
    return () => clearTimeout(t);
  }, [isOpen, overflowVisibleWhenOpen]);

  const onTransitionEnd = () => {
    if (isOpen) {
      // When opening finishes, return to 'auto' to adapt to content changes
      setHeight('auto');
    }
  };

  // Tailwind classes for structure and layout
  const containerClasses = `inline-flex flex-col gap-6 items-start w-full ${customClassName}`;
  const headerClasses = 'self-stretch h-14 inline-flex items-start justify-between cursor-pointer py-4 focus-visible:outline-none';
  const titleClasses = 'flex-1 h-6 !m-0 font-sans font-bold text-text-normal-lighter';
  const iconContainerClasses = `transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`;
  // overflow-hidden durante la animación (clip del max-height). Cuando el
  // accordion está abierto y ASENTADO (height 'auto', fin de transición) y el
  // caller lo pide, overflow-visible → popovers/tooltips internos (ej.
  // AcceleratorTooltip del FAB en el panel Cenit) no quedan recortados.
  const overflowCls = overflowVisible ? 'overflow-visible' : 'overflow-hidden';
  const contentClasses = `flex flex-col gap-3 items-start w-full ${overflowCls} transition-[max-height] duration-300 ease-in-out ${!isOpen && height === '0px' ? 'hidden' : 'flex'}`;

  // Inline styles only for truly dynamic values that can't be classes
  const contentStyles = {
    maxHeight: height,
  };

  // Determine which HTML tag to use for the title
  const TitleTag = titleLevel;

  return html`
    <div
      class=${containerClasses}
      data-name="accordion"
      ...${rest}
    >
      <div
        class=${headerClasses}
        onClick=${handleToggle}
        onKeyDown=${handleKeyDown}
        role="button"
        tabindex="0"
        aria-expanded=${isOpen}
        aria-controls="accordion-content"
      >
        <${TitleTag} class=${titleClasses}>
          ${title}
        </${TitleTag}>
        <div class=${`${iconContainerClasses} h-6 w-6 flex items-center justify-center`}>
          <${Icon}
            icon="navigation/expand-more"
            size="sm"
            color=${chevronColor}
          />
        </div>
      </div>
      
      <div
        ref=${contentRef}
        class=${contentClasses}
        id="accordion-content"
        style=${contentStyles}
        role="region"
        aria-labelledby="accordion-title"
        onTransitionEnd=${onTransitionEnd}
      >
        ${children}
      </div>
    </div>
  `;
};

export default Accordion;
