import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersDataPair } from '../../atoms/members-data-pair/members-data-pair.js';
import { MembersCopyMembership } from '../../atoms/members-copy-membership/members-copy-membership.js';

const html = htm.bind(h);

/**
 * MembersDataGrid — bloque de datos del socio del hero expandido (1263924).
 * Layout VERIFICADO contra el comp 518:27631 (nodo I518:27634;878:26750
 * "Shortcuts Section"), que MANDA sobre el plan §3:
 *
 *  - **Columna izquierda**: fila "balance" (Tienes | Fecha de vencimiento, con
 *    divisor vertical entre ambos) ARRIBA + las quick actions DEBAJO (slot
 *    `quickActions`).
 *  - **Divisor vertical** entre columnas (#6c6c6c).
 *  - **Columna derecha**: Estatus Lifemiles (+ "Vence:") y Número de socio (con
 *    botón copiar).
 *
 * Valores en h5 (20px SemiBold), labels static2 (14px, blancos — el contraste lo
 * da el tamaño, no el color). Reusable: el Dashboard hermano 1263921 usa el mismo
 * bloque (recibe todo por props + el slot de quick actions).
 *
 * Responsive (annotations 518:23098 / 518:23102):
 *  - <680 (mobile): vertical (1 col); la fila balance se mantiene horizontal
 *    con ambos pairs `flex-1` para repartir el ancho disponible.
 *  - ≥680 (desktop): 2 columnas con divisor vertical; el nº de socio queda en la 2ª col.
 *
 * Valores YA formateados por locale los pasa el caller (P3).
 *
 * ## Props (strings ya formateadas / i18n del caller)
 * - `milesLabel`, `milesValue`, `expiryLabel`, `expiryValue`
 * - `statusLabel`, `statusValue`, `statusExpiryText`
 * - `membershipLabel`, `membershipNumber`, `copyAriaLabel`, `copiedLabel`
 * - `quickActions`: vnode — slot que se renderiza bajo la fila balance (col izq).
 * - `tone`: 'light'|'dark' — paleta. Default 'light' (gradient oscuro).
 * - `dividerColor`: string CSS color (ej. `#C771AE`) — override del color del
 *   divisor vertical por tier. Si está vacío, cae a la paleta del `tone`
 *   (`#d9d9d9` dark / `#6c6c6c` light).
 * - `customClassName`
 */
export const MembersDataGrid = ({
  milesLabel = '',
  milesValue = '',
  expiryLabel = '',
  expiryValue = '',
  statusLabel = '',
  statusValue = '',
  statusExpiryText = '',
  membershipLabel = '',
  membershipNumber = null,
  copyAriaLabel = 'Copiar número de socio',
  copiedLabel = 'Copiado',
  quickActions = null,
  tone = 'light',
  dividerColor = '',
  customClassName = '',
  ...rest
}) => {
  const membershipLabelColor = tone === 'dark' ? 'text-[#5a5a5a]' : 'text-white';
  // Si el caller pasa `dividerColor` (hex del tier), lo usamos inline; si no,
  // fallback al color por `tone` vía clase Tailwind (comportamiento legacy).
  const dividerToneClass = tone === 'dark' ? 'bg-[#d9d9d9]' : 'bg-[#6c6c6c]';
  const dividerClass = dividerColor ? '' : dividerToneClass;
  const dividerStyle = dividerColor ? { backgroundColor: dividerColor } : undefined;

  return html`
    <div
      class=${`flex flex-col gap-5 min-[640px]:flex-row min-[640px]:gap-6 min-[640px]:items-stretch min-[640px]:max-h-[171px] ${customClassName}`}
      data-name="members-data-grid"
      ...${rest}
    >
      <!-- Columna izquierda: fila balance ARRIBA + quick actions ABAJO.
           Composición de la fila balance varía por breakpoint:
            - mobile (<680): Tienes (+sublabel Vence) | divisor | Estatus (+sublabel Vence)
              (Figma 518:24516 Balance Container — fila única horizontal con AMBOS pairs).
            - desktop (≥680): Tienes | divisor | Fecha de vencimiento
              (Figma 518:24090 Balance Container; el Estatus baja a la columna derecha).
           Anchos en desktop: col-left toma su ANCHO INTRÍNSECO (min-[640px]:flex-none),
           para que el divisor central quede pegado al borde derecho de su contenido
           con el gap-6 limpio. Sin esto, ambas cols serían flex-1 (50/50) y
           col-left dejaría ˜80px vacíos antes del divisor (asimetría visual). -->
      <div class="flex-1 min-w-0 flex flex-col gap-6 min-[640px]:flex-none min-[640px]:gap-[20px] md:max-w-[361px]" data-name="members-data-col-left">
        <!-- Fila balance: ver doc arriba.
             - Mobile (Figma 617:44589 Balance Container): items-start, gap 32px,
               rounded-[16px], backdrop-blur-[10px], self-stretch. Los dos pairs
               usan 'shrink-0 whitespace-nowrap' para hug INTRÍNSECO (Figma layout:
               contenido alineado a la izquierda con espacio vacío a la derecha,
               divider pegado a la col Tienes). NO usar 'flex-1' — estira las cols
               y centra el divider, desviándose del Figma.
             - Desktop (Figma 518:24090): items-stretch, gap 24/32px, sin radius/blur;
               los pairs mantienen ancho intrínseco (min-[640px]:flex-none). -->
        <div
          class="flex items-start gap-8 self-stretch rounded-[16px] backdrop-blur-[10px] min-[640px]:items-stretch min-[640px]:gap-6 min-[640px]:rounded-none min-[640px]:backdrop-blur-none lg:gap-8"
          data-name="members-data-row"
        >
          <div class="shrink-0 flex flex-col gap-0.5 min-[640px]:flex-none min-[640px]:gap-0 whitespace-nowrap">
            <${MembersDataPair} tone=${tone} valueSize="lg" label=${milesLabel} value=${milesValue} />
            ${expiryValue && html`
              <span class="block min-[640px]:hidden text-sm font-normal leading-[19px] text-[#d9d9d9] whitespace-nowrap">
                Vence: ${expiryValue}
              </span>
            `}
          </div>

          <!-- Mobile (<680): divisor + Estatus pair INLINE en el row (Figma 518:24516).
               Oculto en desktop (≥680), donde Estatus baja a la col derecha. -->
          <span
            class=${`block min-[640px]:hidden w-px self-stretch rounded-[2px] shrink-0 ${dividerClass}`}
            style=${dividerStyle}
            aria-hidden="true"
          ></span>
          <div class="shrink-0 flex min-[640px]:hidden whitespace-nowrap">
            <${MembersDataPair}
              tone=${tone}
              valueSize="lg"
              label=${statusLabel}
              value=${statusValue}
              sublabel=${statusExpiryText}
            />
          </div>

          <!-- Desktop (≥680): divisor + Fecha venc (Figma 518:24090).
               Oculto en mobile, donde la fecha es sublabel del Tienes. -->
          <span
            class=${`hidden min-[640px]:block w-px self-stretch rounded-[2px] shrink-0 ${dividerClass}`}
            style=${dividerStyle}
            aria-hidden="true"
          ></span>
          <div class="hidden min-[640px]:flex min-w-0">
            <${MembersDataPair} tone=${tone} valueSize="lg" label=${expiryLabel} value=${expiryValue} />
          </div>
        </div>

        <!-- Quick actions DENTRO de col izq (Figma 518:27631).
             min-[640px]:mt-auto empuja las quick-actions al borde inferior
             de col-left (que en desktop iguala su alto al de col-right por
             items-stretch). Sin esto, queda espacio en blanco al fondo. -->
        <div class="min-[640px]:mt-auto min-[640px]:mr-[17px]">${quickActions}</div>
      </div>

      <!-- Divisor vertical central (separa col izq | col der, SOLO desktop ≥680) -->
      <span
        class=${`hidden min-[640px]:block w-px self-stretch rounded-[2px] shrink-0 ${dividerClass}`}
        style=${dividerStyle}
        aria-hidden="true"
      ></span>

      <!-- Columna derecha (desktop ≥680): Estatus ARRIBA + Nº socio ABAJO.
           En mobile esta columna está vacía: el Estatus vive en la fila balance
           y el Nº socio vive inline bajo el saludo (members-hero-expanded).
           Ocultamos el WRAPPER completo (no solo los hijos) para que el
           gap-5 del flex-col padre no genere espacio sobrante en mobile. -->
      <div class="hidden min-[640px]:flex flex-1 min-w-0 flex-col gap-6 min-[640px]:justify-start min-[640px]:ml-[8px]" data-name="members-data-col-right">
        <div class="hidden min-[640px]:flex">
          <${MembersDataPair}
            tone=${tone}
            valueSize="lg"
            label=${statusLabel}
            value=${statusValue}
            sublabel=${statusExpiryText}
          />
        </div>
        ${membershipNumber && html`
          <div class="hidden min-[640px]:flex flex-col gap-0.5 min-w-0" data-name="members-data-membership">
            <span class=${`text-sm font-normal leading-[21px] ${membershipLabelColor}`}>
              ${membershipLabel}
            </span>
            <${MembersCopyMembership}
              membershipNumber=${membershipNumber}
              size="lg"
              copyAriaLabel=${copyAriaLabel}
              copiedLabel=${copiedLabel}
            />
          </div>
        `}
      </div>
    </div>
  `;
};

export default MembersDataGrid;
