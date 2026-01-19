import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { HeadingDropdownSelector } from './heading-dropdown-selector.js';

const html = htm.bind(h);

export const HeadingDropdownSelectorSample = () => {
  const [selectedValue1, setSelectedValue1] = useState('Value');
  const [selectedValue2, setSelectedValue2] = useState('Bogotá');
  const [selectedValue3, setSelectedValue3] = useState('Opción 1');

  return html`
    <div style=${{
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '40px',
  }}>
      <div>
        <h3>Default</h3>
        <${HeadingDropdownSelector} 
          label="Label" 
          value=${selectedValue1}
          onChange=${setSelectedValue1}
        />
      </div>
      
      <div>
        <h3>With Custom Labels</h3>
        <${HeadingDropdownSelector} 
          label="Destino" 
          value=${selectedValue2}
          options=${['Bogotá', 'Medellín', 'Cali', 'Cartagena', 'Barranquilla', 'Bucaramanga', 'Santa Marta', 'Pereira']}
          onChange=${setSelectedValue2}
        />
      </div>
      
      <div>
        <h3>With Callback</h3>
        <${HeadingDropdownSelector} 
          label="Selecciona" 
          value=${selectedValue3}
          options=${['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4', 'Opción 5', 'Opción 6', 'Opción 7', 'Opción 8']}
          onChange=${(value) => {
    console.log('Value changed:', value);
    setSelectedValue3(value);
  }}
        />
      </div>
    </div>
  `;
};

export default HeadingDropdownSelectorSample;
