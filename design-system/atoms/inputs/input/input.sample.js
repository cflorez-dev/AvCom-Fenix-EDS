import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from './input.js';

const html = htm.bind(h);

/**
 * InputSample - Showcase component demonstrating all Input states and variants
 */
export const InputSample = () => {
  const [defaultValue, setDefaultValue] = useState('');
  const [successValue, setSuccessValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [filledValue, setFilledValue] = useState('Contenido del campo');
  const [disabledValue, setDisabledValue] = useState('Contenido del campo');
  const [readonlyValue, setReadonlyValue] = useState('Contenido del campo');
  const [passwordValue, setPasswordValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [truncatedValue, setTruncatedValue] = useState('Avenida Carrera 68 No. 45-23 Piso 9 Oficina 3');
  const [requiredEmptyValue, setRequiredEmptyValue] = useState('');
  const [helperContentValue, setHelperContentValue] = useState('');

  return html`
    <div class="p-8 space-y-12 bg-white">
      <div>
        <h2 class="text-2xl font-bold mb-6 text-[var(--text-normal-primary)]">
          Input Component - All States
        </h2>
        <p class="text-[var(--text-normal-secondary)] mb-8">
          Text input field with multiple states, prefix/suffix icons, and accessibility features.
        </p>
      </div>

      <!-- Default State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Default State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Enter text..."
            value=${defaultValue}
            onChange=${setDefaultValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Members Variant — "Label corto y claro" (Reglas de uso: Textos desbordados) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Label corto y claro
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Si el label no cabe dentro del ancho del campo, el componente amplía su ancho en vez de
          partirlo en dos líneas o truncarlo.
        </p>
        <div class="flex flex-col gap-6 max-w-[320px]">
          <div>
            <p class="text-xs text-[var(--text-normal-secondary)] mb-2">Label corto (no crece)</p>
            <${Input}
              label="Dirección"
              value=${defaultValue}
              onChange=${setDefaultValue}
              variant="members"
              required=${true}
            />
          </div>
          <div>
            <p class="text-xs text-[var(--text-normal-secondary)] mb-2">Label largo (amplía el ancho del campo)</p>
            <${Input}
              label="Dirección de residencia actual aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              value=${defaultValue}
              onChange=${setDefaultValue}
              variant="members"
              required=${true}
            />
          </div>
        </div>
      </div>

      <!-- Members Variant — "Value truncado" (Reglas de uso: Textos desbordados) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Value truncado
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          El valor ingresado puede truncarse horizontalmente (una sola línea, con elipsis) cuando excede
          el ancho del campo mientras no tiene foco. Nunca se desborda en múltiples líneas ni se reduce
          el tamaño de fuente para forzar que quepa. Al hacer hover se revela el texto completo mediante
          un tooltip; al enfocar el campo (click/teclado) se muestra el valor completo para poder editarlo.
        </p>
        <div class="max-w-[320px]">
          <${Input}
            label="Dirección"
            value=${truncatedValue}
            onChange=${setTruncatedValue}
            variant="members"
            truncateOption=${true}
          />
        </div>
      </div>

      <!-- Members Variant — "Input obligatorio" (Reglas de uso) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Input obligatorio
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Todo campo obligatorio se identifica con un asterisco (*) junto al label. Si el campo queda
          vacío tras perder el foco (blur), activa automáticamente el estado <code>error</code> y muestra
          el mensaje "Este campo es obligatorio." en el helper text. Haz click en el campo y luego fuera
          de él sin escribir nada para ver el error.
        </p>
        <div class="max-w-[320px]">
          <${Input}
            label="Teléfono"
            value=${requiredEmptyValue}
            onChange=${setRequiredEmptyValue}
            variant="members"
            required=${true}
          />
        </div>
      </div>

      <!-- Members Variant — "Uso del helper text" (Reglas de uso) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Members Variant — Uso del helper text
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          El helper text ajusta automáticamente su contenido en múltiples líneas (idealmente no más de
          dos), alineado a la izquierda del campo. Cuando el campo activa <code>isError</code>, el helper
          text se muestra en su variante de error (con ícono de alerta), reemplazando al mensaje
          informativo — nunca se muestran ambos a la vez.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="Teléfono"
            value=${helperContentValue}
            onChange=${setHelperContentValue}
            variant="members"
            helperText="Podrá ingresar dentro del mismo campo hasta un máximo de 3 números telefónicos separados por comas."
          />
          <${Input}
            label="Teléfono"
            value=""
            variant="members"
            required=${true}
            state="error"
            helperText="Debe tener máximo 250 caracteres."
          />
        </div>
      </div>

      <!-- Info Tooltip Icon -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Info Tooltip Icon (tooltipContent)
        </h3>
        <p class="text-[var(--text-normal-secondary)] mb-4">
          Ícono de información renderizado fuera del borde del campo (a su derecha), tal como indica el
          diseño; muestra un tooltip al hover o focus por teclado.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="Número de avianca credits"
            value=${defaultValue}
            onChange=${setDefaultValue}
            tooltipContent="Esta información la encontrarás en el correo de confirmación que recibiste de tu avianca credits."
          />
        </div>
      </div>

      <!-- Hover State (CSS handles this) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Hover State
        </h3>
        <p class="text-sm text-[var(--text-normal-secondary)] mb-4">
          Hover over the input below to see the green border
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Hover to see effect"
            value=${defaultValue}
            onChange=${setDefaultValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Focus State (handled by component) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Focus State
        </h3>
        <p class="text-sm text-[var(--text-normal-secondary)] mb-4">
          Click to focus and see the blue focus ring
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Click to focus"
            value=${defaultValue}
            onChange=${setDefaultValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Active State (typing) -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Active State (Typing)
        </h3>
        <p class="text-sm text-[var(--text-normal-secondary)] mb-4">
          Start typing to see the label float and cursor appear
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Type here..."
            value=${defaultValue}
            onChange=${setDefaultValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Success State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Success State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Enter text..."
            value=${successValue}
            onChange=${setSuccessValue}
            state="success"
            helperText="Valid input"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Error State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Error State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Enter text..."
            value=${errorValue}
            onChange=${setErrorValue}
            state="error"
            helperText="This field is required"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Filled State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Filled State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Enter text..."
            value=${filledValue}
            onChange=${setFilledValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Disabled State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Disabled State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Enter text..."
            value=${disabledValue}
            onChange=${setDisabledValue}
            disabled=${true}
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Readonly State -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Read only State
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="label"
            placeholder="Enter text..."
            value=${readonlyValue}
            onChange=${setReadonlyValue}
            readonly=${true}
            helperText="Helper Text"
            required=${true}
            prefixIconName="action/plane"
            suffixIconName="action/view"
          />
        </div>
      </div>

      <!-- Password Input with Toggle -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Password Input with Toggle
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="Password"
            placeholder="Enter password..."
            type="password"
            value=${passwordValue}
            onChange=${setPasswordValue}
            state="normal"
            helperText="Click eye icon to show/hide password"
            required=${true}
            showPasswordToggle=${true}
          />
        </div>
      </div>

      <!-- Email Input -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Email Input
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="Email"
            placeholder="Enter email..."
            type="email"
            value=${emailValue}
            onChange=${setEmailValue}
            state="normal"
            helperText="We'll never share your email"
            required=${true}
          />
        </div>
      </div>

      <!-- Without Icons -->
      <div>
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Without Icons
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <${Input}
            label="Name"
            placeholder="Enter your name..."
            value=${defaultValue}
            onChange=${setDefaultValue}
            state="normal"
            helperText="Helper Text"
            required=${true}
          />
        </div>
      </div>

      <!-- Accessibility Info -->
      <div class="border-t pt-8">
        <h3 class="text-lg font-semibold mb-4 text-[var(--text-normal-primary)]">
          Features
        </h3>
        <ul class="list-disc list-inside space-y-2 text-[var(--text-normal-secondary)]">
          <li>Floating label animation when focused or filled</li>
          <li>Prefix and suffix icon support</li>
          <li>Password visibility toggle</li>
          <li>Multiple input types (text, password, email, number, tel, url)</li>
          <li>States: normal, success, error, disabled, readonly</li>
          <li>Keyboard navigation support</li>
          <li>ARIA attributes for accessibility</li>
          <li>Focus ring for keyboard navigation</li>
        </ul>
      </div>
    </div>
  `;
};

export default InputSample;
