/* eslint-disable import/no-extraneous-dependencies */
import { overrideGQLOperations } from '@dropins/build-tools/gql-extend.js';

// Puedes extender operaciones GraphQL de dropins aquí si es necesario
// Por ahora dejamos vacío ya que no usamos commerce dropins
overrideGQLOperations([
  // Ejemplo:
  // {
  //   npm: '@dropins/storefront-cart',
  //   operations: [
  //     `fragment CUSTOM_FRAGMENT on Cart {
  //       custom_field
  //     }`
  //   ],
  // },
]);
