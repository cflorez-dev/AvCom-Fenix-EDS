import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersAccountData } from './members-account-data.js';
import { getAccountLabelsSync } from '../../../scripts/services/members/members-i18n.js';
import { getMembersConfigSync } from '../../../scripts/services/members/members-config.js';
import {
  toCompanionVM, sortCompanions,
} from '../../../scripts/services/members/frequent-flyer.service.js';

const html = htm.bind(h);

// VM FICTICIO (mismo shape que account-profile.service). País/nacionalidad con
// códigos ISO ('col') para que la etiqueta resuelva bonito en el showcase.
const VM = {
  ok: true,
  personal: {
    gender: 'F',
    givenName: 'Ana',
    familyName: 'García',
    fullName: 'Ana García',
    dateOfBirth: '15-May-1990',
    dateOfBirthParts: { day: 15, month: 5, year: 1990 },
    nationality: 'col',
    country: 'col',
    city: 'Bogotá',
    addressLine: 'Calle Falsa 123',
  },
  contact: {
    email: 'ana.garcia.ficticia@example.com',
    prefix: '57',
    phone: '3001234567',
    hadValue: { email: true, prefix: true, phone: true },
  },
  // Emergencia vacía a propósito → chip naranja "incompleto" + chip en el banner.
  emergency: { name: '', prefix: '', phone: '' },
  documents: [
    {
      type: 'P',
      number: 'AV1234567',
      nationality: 'col',
      expiry: '20-Aug-2030',
      expiryParts: { day: 20, month: 8, year: 2030 },
    },
  ],
  profileParams: {
    companyCode: 'LM',
    programCode: 'LMS',
    accountStatus: 'A',
    preferredLanguage: 'ES',
    membershipNumber: '99999999901',
    countryOfResidence: 'col',
    nationality: 'col',
  },
  // Presencia (sin PII) → donut ~75% (naranja): address + nationality en false.
  presence: {
    firstName: true,
    lastName: true,
    dateOfBirth: true,
    nationality: false,
    email: true,
    phone: true,
    address: false,
    documentId: true,
    travelDocument: true,
  },
};

// Lista cruda de acompañantes (contrato get). Un adulto + un niño (etiquetas D34).
let RAW_COMPANIONS = [
  {
    nomineeReferenceNumber: '1',
    customerNumber: '77',
    accountGroupType: 'G',
    givenName: 'Luis',
    familyName: 'Pérez',
    gender: 'M',
    dateOfBirth: '10-Oct-1995',
    countryOfResidence: 'col',
    partnerMembershipNumber: '55550001',
  },
  {
    nomineeReferenceNumber: '2',
    customerNumber: '78',
    accountGroupType: 'G',
    givenName: 'Sofía',
    familyName: 'Pérez',
    gender: 'F',
    dateOfBirth: '05-Mar-2018',
    countryOfResidence: 'col',
  },
];

const jsonResponse = (obj) => new Response(JSON.stringify(obj), {
  status: 200, headers: { 'Content-Type': 'application/json' },
});

// wrapperFn mock STATEFUL: get/add/edit/remove sobre RAW_COMPANIONS en memoria
// (NUNCA el wrapper real). Simula el contrato lmFrequentFlyer (header.code '000').
const wrapperFn = async (name, params) => {
  const { action } = params || {};
  if (action === 'get') {
    return jsonResponse({ header: { code: '000' }, frequentFlyers: RAW_COMPANIONS });
  }
  if (action === 'add') {
    RAW_COMPANIONS = [...RAW_COMPANIONS, {
      nomineeReferenceNumber: String(Date.now()),
      customerNumber: '0',
      accountGroupType: 'G',
      givenName: params.givenName || '',
      familyName: params.familyName || '',
      gender: params.gender || '',
      dateOfBirth: params.dateOfBirth || '',
      countryOfResidence: params.countryOfResidence || '',
      partnerMembershipNumber: params.partnerMembershipNumber || '',
    }];
    return jsonResponse({ header: { code: '000' } });
  }
  if (action === 'edit') {
    RAW_COMPANIONS = RAW_COMPANIONS.map((c) => {
      if (c.nomineeReferenceNumber !== params.nomineeReferenceNumber) return c;
      return {
        ...c,
        givenName: params.givenName,
        familyName: params.familyName,
        gender: params.gender,
        dateOfBirth: params.dateOfBirth,
      };
    });
    return jsonResponse({ header: { code: '000' } });
  }
  if (action === 'remove') {
    RAW_COMPANIONS = RAW_COMPANIONS.filter(
      (c) => c.nomineeReferenceNumber !== params.nomineeReferenceNumber,
    );
    return jsonResponse({ header: { code: '000' } });
  }
  return jsonResponse({ header: { code: 'E.EON.99' } });
};

/**
 * MembersAccountDataSample — flujo completo de la tab Datos con fixtures (1279361):
 * banner naranja + navegación de chips, edición mock de perfil (personal/contacto/
 * emergencia) con bloqueo cross-módulo, documentos, y CRUD REAL de acompañantes
 * (contra el wrapperFn mock stateful). editOpts baja la latencia del mock.
 */
export const MembersAccountDataSample = () => {
  const labels = getAccountLabelsSync();
  const cfg = getMembersConfigSync('es');
  const companions = {
    ok: true,
    companions: sortCompanions(RAW_COMPANIONS.map((c) => toCompanionVM(c))),
  };

  return html`
    <section style=${{ padding: '24px', background: '#EEEFF1' }}>
      <h2 style=${{ marginBottom: '16px' }}>MembersAccountData (organism — tab Datos 1279361)</h2>
      <div style=${{ maxWidth: '1248px' }}>
        <${MembersAccountData}
          cfg=${cfg}
          labels=${labels}
          overrides=${{ vm: VM, companions, wrapperFn }}
          editOpts=${{ latencyMs: 400 }}
        />
      </div>
    </section>
  `;
};

export default MembersAccountDataSample;
