// Función para cargar dinámicamente los módulos
async function loadDesignSystemComponents() {
  try {
    // Importar módulos de forma dinámica usando importmaps
    const [{ h, render }, { DsArquitecture }] = await Promise.all([
      import('@dropins/tools/preact.js'),
      import('./ds-arquitecture/ds-arquitecture.js'),
    ]);

    return { h, render, DsArquitecture };
  } catch (error) {
    console.error('Error loading design system components:', error);
    throw error;
  }
}

export default async function decorate(block) {
  block.innerHTML = '<div>Cargando Design System...</div>';

  try {
    const { h, render, DsArquitecture } = await loadDesignSystemComponents();

    block.innerHTML = '';
    const container = document.createElement('div');
    block.appendChild(container);

    render(
      h(
        'div',
        { className: 'design-system-demo' },
        h(DsArquitecture, {}),
      ),
      container,
    );
  } catch (error) {
    block.innerHTML = `
      <div style="padding: 20px; background: #fee; border: 1px solid #c00; border-radius: 4px;">
        <h2 style="color: #c00;">Error cargando Design System</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${error.stack}</pre>
      </div>
    `;
    console.error('Error in design-system-block:', error);
  }
}
