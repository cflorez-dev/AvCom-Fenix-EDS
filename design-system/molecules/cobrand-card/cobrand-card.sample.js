import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { CobrandCard } from './cobrand-card.js';
import { CobrandSlider } from './cobrand-slider.js';

const html = htm.bind(h);

const LABELS = {
  cobrandSeeMore: 'Conoce todos los beneficios',
  cobrandPagination: '{n} de {m}',
  cobrandAdd: 'Agregar tarjeta',
  cobrandRequest: 'Solicitar nueva tarjeta',
};

const FULL_CARD = {
  name: 'Avianca Lifemiles Visa',
  bank: 'Bancolombia',
  imageUrl: '',
  chip: null,
  benefits: [
    { text: 'Tiquetes en canales de Avianca', value: '2 millas por cada USD' },
    { text: 'Millas extra en vuelos con Avianca', value: '+10% millas' },
    { text: 'Descuento en ingreso a salas VIP', value: '50% descuento' },
  ],
  seeMoreUrl: '/es/tarjetas/beneficios',
  milesPeriod: 3230,
  generic: false,
};

/**
 * Sample del CobrandCard (1271694 paso 8): completa (con línea de millas) ·
 * sin millas (gate v1: línea oculta) · 1 beneficio · textos largos (2 líneas)
 * · sin imagen (placeholder) · chip con colores custom del sheet.
 * Redimensionar viewport: horizontal ≥1024 / apilada abajo.
 */
export const CobrandCardSample = () => html`
  <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
    <h2>CobrandCard (molécula — 1271694)</h2>

    <p style=${{ color: '#666', margin: 0 }}>Completa (con línea de millas — cuando LM entregue la fuente):</p>
    <${CobrandCard} card=${FULL_CARD} labels=${LABELS} milesLabel="Total acumulado en 2026" />

    <p style=${{ color: '#666', margin: 0 }}>Sin millas (gate v1 real: milesPeriod null → línea OCULTA):</p>
    <${CobrandCard} card=${{ ...FULL_CARD, milesPeriod: null }} labels=${LABELS} milesLabel="Total acumulado en 2026" />

    <p style=${{ color: '#666', margin: 0 }}>1 beneficio + chip con colores custom del sheet:</p>
    <${CobrandCard}
      card=${{
    ...FULL_CARD,
    milesPeriod: null,
    chip: { text: '', bg: '#7B2D8B', color: '#FFFFFF' },
    benefits: [{ text: 'Tiquetes en canales de Avianca', value: '2 millas por cada USD' }],
  }}
      labels=${LABELS}
    />

    <p style=${{ color: '#666', margin: 0 }}>Textos largos (máx 2 líneas) + sin imagen (placeholder punteado):</p>
    <${CobrandCard}
      card=${{
    ...FULL_CARD,
    milesPeriod: null,
    name: 'Avianca Lifemiles Visa Infinite Signature Black Edition Premium',
    bank: 'Banco de Bogotá — emisor exclusivo para clientes preferenciales',
    benefits: [
      { text: 'Acumulación adicional en todas tus compras nacionales e internacionales durante todo el año', value: '3 millas por cada USD' },
      { text: 'Acceso ilimitado a salas VIP en aeropuertos seleccionados', value: 'Ilimitado' },
    ],
  }}
      labels=${LABELS}
    />
    <p style=${{ color: '#666', margin: 0 }}>
      Slider (paso 9) — 3 tarjetas: paginación "n de m" + flechas (disabled en
      extremos) + acciones del sheet (solicitar oculta por POS):
    </p>
    <${CobrandSlider}
      cards=${[
    { ...FULL_CARD, milesPeriod: null },
    {
      ...FULL_CARD, milesPeriod: null, name: 'Avianca Lifemiles Mastercard Black', bank: 'Banco de Bogotá',
    },
    {
      ...FULL_CARD, milesPeriod: null, name: 'Avianca Lifemiles Amex', bank: 'BAC Credomatic', benefits: [FULL_CARD.benefits[0]],
    },
  ]}
      actions=${{
    add: true, request: false, addLabel: '', requestLabel: '', addUrl: '/es/tarjetas/agregar', requestUrl: '',
  }}
      labels=${LABELS}
      milesLabel="Total acumulado en 2026"
    />

    <p style=${{ color: '#666', margin: 0 }}>Slider — 1 tarjeta: SIN paginación ni flechas; ambas acciones:</p>
    <${CobrandSlider}
      cards=${[{ ...FULL_CARD, milesPeriod: null }]}
      actions=${null}
      labels=${LABELS}
      milesLabel="Total acumulado en 2026"
    />
  </section>
`;

export default CobrandCardSample;
