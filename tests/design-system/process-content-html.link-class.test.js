import { describe, it, expect } from 'vitest';
import { processContentHTML } from '../../design-system/helpers/process-content-html.js';

// Los mosaics (cms-mosaic-cards, mosaic-cards-v2) llaman antes a
// applyLinkButtonStylesToLinks, así que el <a> ya llega con un class que contiene
// font-['Red_Hat_Display'] — con apóstrofos dentro del valor del atributo.
// El regex de merge de clases cortaba en el primer apóstrofo: truncaba class en
// "font-[" y dejaba el resto de clases colgando fuera de las comillas, donde el
// parser HTML las convierte en atributos sueltos y no aplican. Se perdían así
// hover:/active: de color y underline.
const CLASE_PREVIA = "inline-flex font-['Red_Hat_Display'] "
  + 'text-text-link-informative-default '
  + 'hover:text-text-link-informative-active active:text-text-link-informative-active '
  + 'hover:underline active:underline';

const tagA = (html) => html.match(/<a\s[^>]*>/)[0];
const claseDe = (html) => tagA(html).match(/class="([^"]*)"/)[1];

describe('processContentHTML: merge de clases en <a> ya estilizado', () => {
  it('conserva las clases de hover/active cuando el class previo trae comillas simples', () => {
    const entrada = `<p><a href="/es" class="${CLASE_PREVIA}">prueba</a></p>`;

    const salida = processContentHTML(entrada, 'informative');
    const clases = claseDe(salida).split(/\s+/);

    expect(clases).toContain('hover:text-text-link-informative-active');
    expect(clases).toContain('active:text-text-link-informative-active');
    expect(clases).toContain('hover:underline');
    expect(clases).toContain('active:underline');
  });

  it('no trunca font-[\'Red_Hat_Display\'] ni deja clases fuera del atributo', () => {
    const entrada = `<p><a href="/es" class="${CLASE_PREVIA}">prueba</a></p>`;

    const salida = processContentHTML(entrada, 'informative');

    // El bug producía class="... font-[ ..." y dejaba Red_Hat_Display'] suelto
    expect(claseDe(salida)).not.toMatch(/font-\[\s/);
    expect(claseDe(salida).split(/\s+/)).toContain("font-['Red_Hat_Display']");
    // Todo atributo del <a> debe tener la forma nombre="valor"
    const atributos = tagA(salida).replace(/^<a\s+/, '').replace(/>$/, '');
    expect(atributos.replace(/[a-z-]+="[^"]*"\s*/gi, '')).toBe('');
  });

  it('conserva las clases propias que van después de font-[\'…\'] en el class previo', () => {
    // applyLinkButtonStylesToLinks deja `group/link` y `rich-text-link` al final;
    // al cortar en el apóstrofo, el merge las descartaba y el <u> hijo perdía su
    // ancla group-hover/link.
    const previa = "inline-flex font-['Red_Hat_Display'] group/link rich-text-link";
    const salida = processContentHTML(`<p><a href="/es" class="${previa}">prueba</a></p>`, 'informative');
    const clases = claseDe(salida).split(/\s+/);

    expect(clases).toContain('group/link');
    expect(clases).toContain('rich-text-link');
  });

  it('sigue añadiendo las clases de LinkButton cuando el <a> no trae class', () => {
    const salida = processContentHTML('<p><a href="/es">prueba</a></p>', 'informative');
    const clases = claseDe(salida).split(/\s+/);

    expect(clases).toContain('p-[2px]');
    expect(clases).toContain('hover:text-text-link-informative-active');
  });
});
