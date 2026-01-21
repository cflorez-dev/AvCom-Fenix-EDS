export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      
      // check for text content
      const hasText = col.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, li, a');
      if (hasText) {
        col.classList.add('columns-text-col');
      }
    });
  });
}
