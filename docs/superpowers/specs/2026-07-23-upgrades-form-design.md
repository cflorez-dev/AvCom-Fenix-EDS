# Formulario de validación para acceso a Upgrades (AVAEMF2P20-270 / PBI 1281633)

**Fecha:** 2026-07-23 · **Rama:** `feat/270-upgrades-form` (base `origin/avdev`)
**Figma:** [Entregable — Formulario UpGrade 16072026](https://www.figma.com/design/ZCD8smROXO5KHNvo1Vd8z7/-Entregable--Formulario-UpGrade-16072026?node-id=77-3124)

## Objetivo

Adaptar el formulario actual de upgrade de cabina (hoy integrado a Plusgrade, servicio a
descontinuar) para que consuma los servicios de Upgrades de `API_CanalesDigitales` y, cuando exista
al menos un vuelo elegible en Ventana Comercial, redirija automáticamente al flujo Upgrades MMB.
Sin selección de flujo, sin SSCI, sin modales de decisión.

## Arquitectura

### 1. Servicio nuevo: `scripts/services/upgrades/upgrades.service.js`

Reutiliza el patrón APIM existente (`apim-token.service.js` / servicio `digital`), sin cambios de
backend:

1. **Credenciales APIM**: `getApimCredentials('digital')` → `Authorization` (token Azure),
   `Ocp-Apim-Subscription-Key`, `apimBaseUrl` (= `…/API_CanalesDigitales`).
2. **Token Upgrades (Cognito)**: `getApimCredentials('upgrades')` — se agrega `'upgrades'` a
   `VALID_SERVICES` de `apim-token.service.js`. El backend de `AV_TOKEN_ENDPOINT` (decisión de
   seguridad: el `client_secret` de Cognito NUNCA se publica en el frontend) debe exponer el
   servicio con el contrato existente:
   `POST AV_TOKEN_ENDPOINT {"service": "upgrades"}` →
   `{ "token": <access_token Cognito>, "expiresIn": <seg> }`
   (el backend llama a `POST {apim}/v1/upgrades/token` con las creds Cognito server-side).
   Cache/expiración/refresh ya resueltos por el mecanismo actual (`computeExpiresAt` lee el
   claim `exp` del JWT).
   **QA manual mientras el backend no exista**: sembrar en `localStorage` la key
   `avianca_apim_token_upgrades` con `{token, expiresAt}` usando un token obtenido vía Bruno;
   el flujo E2E funciona sin código temporal.
3. **Validación**: `GET {apimBaseUrl}/v1/upgrades/validate` con headers `Authorization`,
   `Ocp-Apim-Subscription-Key`, `AuthorizationUpgrades`, `channel: MMB`, `PNR: <pnr>`.
   Fetch propio (no `apimFetch`) para poder mapear códigos de estado a resultados de negocio.
   Ante `401`: limpiar cachés (digital + upgrades) y reintentar una sola vez.
   El valor del header `channel` es configurable: key `AV_UPGRADES_CHANNEL` en `environment.json`,
   fallback `'MMB'`.

**Decisión de seguridad (usuario, 2026-07-23):** el `client_secret` de Cognito (confidential
client, scope `uat/validate uat/confirm`) NO se publica en el frontend en ninguna forma.
Se descartó `environment.json`; el token se obtiene vía extensión del backend de
`AV_TOKEN_ENDPOINT` (servicio `'upgrades'`, ver §1.2). Probado empíricamente que APIM no inyecta
las credenciales (sin ellas: `{"error":"invalid_client"}`). La E2E completa queda dependiente de
esa extensión; QA manual es posible sembrando el cache de `localStorage`.

### 2. Contrato de `/validate` y mapeo centralizado

Respuesta 200 confirmada (PNR de prueba `AYQQQS`):

```json
{
  "passengers": [{ "firstName": "LINA", "lastName": "MORALES", "refNumber": "2" }],
  "pnr": "AYQQQS",
  "segments": [
    { "serviceClass": "S", "arrival": "EZE", "departure": "BOG", "carrier": "AV",
      "flightNumber": "83", "refNumber": "2", "upgradeStatus": "elegible",
      "departureTimestamp": "28/07/2026T06:59", "arrivalTimestamp": "28/07/2026T15:20" }
  ]
}
```

Valores observados de `upgradeStatus`: `elegible` | `not_elegible` (ortografía del backend, se
respeta tal cual).

**PNR inexistente (confirmado contra QA, 2026-07-23):** HTTP **200** con
`{"passengers": null, "pnr": "ZZZZZZ", "segments": null}` — el servicio no usa 404.

**Token upgrades (confirmado contra QA):** el body de `POST /v1/upgrades/token` es
`{ "access_token": "<jwt>" }`; los headers `client_id`/`client_secret` de Cognito son
obligatorios desde el cliente (sin ellos: 200 con `{"error": "invalid_client"}` — APIM no los
inyecta). Nota: ese endpoint también puede responder 200 con body de error, así que el éxito se
determina por la presencia de `access_token`, no por el status.

Función única `mapValidateResult({ status, body, lastName })` → resultado normalizado:

| Resultado | Condición |
| --- | --- |
| `ELIGIBLE` | HTTP 200, apellido coincide y ≥1 `segments[].upgradeStatus === 'elegible'` |
| `NO_AVAILABILITY` | HTTP 200, apellido coincide, 0 segmentos elegibles |
| `NOT_FOUND` | HTTP 200 con `passengers`/`segments` null o vacíos (PNR inexistente), o con apellido que NO coincide con ningún `passengers[].lastName`; defensivo: HTTP 404 |
| `ERROR` | Cualquier otro fallo (red, 5xx, otros 4xx, JSON inválido) |

- **Validación de apellido (front)**: el servicio solo recibe `PNR`; el apellido ingresado se
  compara contra `passengers[].lastName` normalizando mayúsculas, acentos y espacios
  (`localeCompare`/normalize NFD). Si no coincide → `NOT_FOUND` (modal "Reserva no encontrada",
  cuyo copy ya pide revisar código y apellido).
- El mapeo queda centralizado en esta función; cualquier ajuste de contrato en QA no toca el
  componente.

### 3. Organism `cabin-upgrade-form` (modificado in place)

Los 3 puntos de entrada (`form-header-banner`, `megamenu`, `navbar-mobile`) heredan el flujo nuevo.
Se elimina la integración Plusgrade (`AV_CABIN_UPGRADE_API_URL` / `AV_CABIN_UPGRADE_API_KEY`,
`checkUpgradeEligibility`, `result.offerUrl`, `window.open`).

**Validación de campos** (Figma 77-5865):

- PNR: obligatorio, alfanumérico, **máximo 6 caracteres** (enforced en input), error inline
  "El código de reserva es obligatorio".
- Apellido: obligatorio, solo letras/espacios, helper "Tal y como aparece(n) en la reserva",
  error inline "El apellido es obligatorio".
- Comportamiento actual de trigger y limpieza de error al teclear se conserva.

**Flujo de submit**:

1. Validar campos → errores inline si aplica (sin llamadas).
2. Mostrar loader de página completa (ver §4).
3. `validateUpgrade({ pnr })` (resuelve internamente ambas credenciales) → `mapValidateResult(...)`.
4. Resultado:
   - `ELIGIBLE` → redirección **misma pestaña** (`window.location.assign`) a la URL MMB (§5).
     El loader permanece visible hasta la navegación.
   - `NO_AVAILABILITY` → modal "Servicio con alta demanda" · "El ascenso de cabina no está
     disponible para este vuelo." · CTA "Consultar otra reserva" → cierra modal y limpia el
     formulario.
   - `NOT_FOUND` → modal "Reserva no encontrada" · "Revisa el código de tu reserva y apellido" ·
     CTA "Reintentar" → cierra modal, foco al campo PNR.
   - `ERROR` → modal "¡Ups! Algo salió mal" · "Por favor, intenta de nuevo." · CTA "Reintentar" →
     cierra modal, conserva los valores.

Modales con `ModalAviancaLayout` existente (accesibilidad/foco ya resueltos); cambian icono, título,
descripción y CTA por caso. Iconos por caso según Figma (avión+engranajes / silla con alerta /
avión con alerta) agregados a `icons/modals/` siguiendo el patrón `modals/upgrade-not-available`.

**i18n**: nuevas keys bajo el prefijo existente `cabinUpgradeForm.*` (p. ej.
`cabinUpgradeForm.modalHighDemand.*`, `cabinUpgradeForm.modalNotFound.*`,
`cabinUpgradeForm.modalTechnicalError.*`, `cabinUpgradeForm.helper.apellido`), con fallbacks
hardcodeados en español. Se reutiliza el mecanismo `fetchAEMData(lang)` + fallback `es` actual.

**SSCI**: el organism no contiene lógica SSCI; se verifica que ninguna key i18n ni configuración del
flujo upgrades la referencie. El `formType: 'ssci'` de `form-header-banner` pertenece al formulario
de check-in de otras landings y queda fuera de alcance.

### 4. Molecule nueva: `full-page-loader`

Overlay `fixed inset-0` blanco, cóndor animado + texto "Cargando…" (i18n), `role="status"`,
`aria-live="polite"`, bloqueo de scroll mientras está visible. Figma 77-9620: loader continuo hasta
respuesta; al finalizar se reemplaza por modal de error o por la navegación a MMB. Reutilizable para
futuras transiciones del producto.

### 5. URL de redirección MMB

- Key nueva `AV_UPGRADES_MMB_URL` en `environment.json`; fallback:
  `https://gestiona.avianca.com/{lang}/manage/upgrade-business-class`.
- `{lang}` se resuelve con `getStoredLanguage()` (fallback `es`).
- Query con `URLSearchParams`: `pnr`, `lastname` (valor ingresado), `flow=mmb`.
- La URL solo se construye cuando el resultado es `ELIGIBLE` (CA-06); nunca se construye URL SSCI.

## Testing

Patrón `tests/services/…` existente (Vitest):

- `apim-token.service`: servicio `'upgrades'` aceptado en `VALID_SERVICES` (cache/expiración ya
  cubiertos por los tests existentes).
- `upgrades.service`: headers correctos de validate (Authorization, AuthorizationUpgrades,
  channel, PNR), retry ante 401 limpiando ambos cachés.
- `mapValidateResult`: los 4 resultados + apellido con acentos/mayúsculas + respuestas malformadas.
- Builder de URL MMB: idioma dinámico, encoding de apellidos con espacios/acentos.
- `cabin-upgrade-form`: validaciones de campos (máx 6, obligatorios) y render de cada modal según
  resultado (siguiendo el patrón de tests de `ssci-form`/`mmb-form` si existe).

## Criterios de aceptación cubiertos

CA-01→CA-06 mapeados en §2/§3/§5; CA-07 (accesibilidad) vía `ModalAviancaLayout`, aria de inputs
existente y `role="status"` del loader.

## Fuera de alcance

- SSCI en cualquier forma (validación, URLs, contenidos, modal de selección de flujo).
- Formularios `ssci-form` y `mmb-form` (otros productos).
- Visualización de ascensos previamente adquiridos.
- Cambios en el backend del token endpoint (`AV_TOKEN_ENDPOINT`).
- Textos de Figma "Sin servicio disponible" y "Apellido no coincide": remanentes de la versión
  anterior del entregable; el set final de modales es el de §3.

## Pendientes (coordinación, no bloquean la implementación del front)

- **Backend**: extensión de `AV_TOKEN_ENDPOINT` con el servicio `'upgrades'` (contrato en §1.2).
  Bloquea solo la E2E real; QA manual vía seed de `localStorage`.
- Keys de `environment.json` por ambiente: `AV_UPGRADES_MMB_URL`, `AV_UPGRADES_CHANNEL`
  (opcionales, con fallback) — autores AEM; se documentará en handover.
- Rotar las credenciales QA compartidas en la colección Bruno antes de salida a producción.
