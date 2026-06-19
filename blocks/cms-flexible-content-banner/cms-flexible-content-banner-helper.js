/**
 * Maps block HTML data to a structured configuration object for the
 * CMS Flexible Content Banner.
 *
 * Expected structure: 29 divs containing (in order). This order MUST match
 * `models/_component-models.json` for the `cms-flexible-content-banner` model.
 *
 * Content
 *   Div 0:  Title (text)
 *   Div 1:  Description (richtext)
 * Layout
 *   Div 2:  Text position ('left' | 'right')
 *   Div 3:  Image mode ('image-background' | 'split')
 * Images
 *   Div 4:  Image desktop (picture / reference)  — used at ≥ 1024 px
 *   Div 5:  Image mobile  (picture / reference)  — used at < 768 px
 *   Div 6:  Image tablet  (picture / reference)  — used at 768–1023 px in split mode
 *   Div 7:  Image alt text
 * Color + background
 *   Div 8:  Color scheme ('light' | 'dark')
 *   Div 9:  Solid background type ('solid' | 'gradient')
 *   Div 10: Solid background color
 *   Div 11: Gradient start color
 *   Div 12: Gradient end color
 *   Div 13: Gradient start stop position (e.g. '0%')
 *   Div 14: Gradient end stop position (e.g. '100%')
 *   Div 15: Gradient direction
 * CTA 1
 *   Div 16: CTA 1 text
 *   Div 17: CTA 1 URL
 *   Div 18: CTA 1 link type
 *   Div 19: CTA 1 variant (primary | primary-dark | secondary | secondary-dark — 1:1 with the Button atom)
 * CTA 2
 *   Div 20: CTA 2 text
 *   Div 21: CTA 2 URL
 *   Div 22: CTA 2 link type
 *   Div 23: CTA 2 variant (same 4 options as CTA 1)
 * CTA layout
 *   Div 24: CTA alignment desktop ('left' | 'right')
 *   Div 25: CTA orientation mobile ('horizontal' | 'horizontal-fullwidth' | 'vertical')
 * Misc
 *   Div 26: Loading mode ('lazy' | 'eager')
 * Targeting
 *   Div 27: Target Countries (comma-separated)
 *   Div 28: Target Languages (comma-separated)
 *
 * The image object-position is no longer authorable — it's hardcoded in the
 * organism: in image-background mode the subject is moved to the opposite
 * side of the text; in split mode it stays centered.
 *
 * @param {Element} block The cms-flexible-content-banner block element
 * @returns {Object} Mapped configuration object with all banner properties
 */
export function mapFlexibleContentBannerData(block) {
  if (!block) {
    return getDefaultConfig();
  }

  const divs = Array.from(block.querySelectorAll(':scope > div'));

  // Picture elements per breakpoint.
  const pictureDesktop = extractPictureElement(divs[4]);
  const pictureMobile = extractPictureElement(divs[5]);
  const pictureTablet = extractPictureElement(divs[6]);

  return {
    title: extractTextValue(divs[0]) || '',
    description: extractRichtextValue(divs[1]) || '',
    textPosition: extractTextValue(divs[2]) || 'right',
    imageMode: extractTextValue(divs[3]) || 'split',
    imageDesktop: pictureDesktop?.src || '',
    imageMobile: pictureMobile?.src || '',
    imageTablet: pictureTablet?.src || '',
    pictureDesktop,
    pictureMobile,
    pictureTablet,
    imageAlt: extractTextValue(divs[7]) || pictureDesktop?.alt || pictureMobile?.alt || pictureTablet?.alt || '',
    colorScheme: extractTextValue(divs[8]) || 'dark',
    solidBackgroundType: extractTextValue(divs[9]) || 'solid',
    backgroundColor: extractLinkValue(divs[10]) || '#1b1b1b',
    gradientColorStart: extractLinkValue(divs[11]) || '',
    gradientColorEnd: extractLinkValue(divs[12]) || '',
    gradientStartPosition: extractTextValue(divs[13]) || '0%',
    gradientEndPosition: extractTextValue(divs[14]) || '100%',
    gradientDirection: extractTextValue(divs[15]) || 'to bottom',
    cta1Text: extractTextValue(divs[16]) || '',
    cta1Url: extractLinkValue(divs[17]) || '',
    cta1LinkType: extractTextValue(divs[18]) || 'dofollow',
    cta1Variant: extractTextValue(divs[19]) || 'primary',
    cta2Text: extractTextValue(divs[20]) || '',
    cta2Url: extractLinkValue(divs[21]) || '',
    cta2LinkType: extractTextValue(divs[22]) || 'dofollow',
    cta2Variant: extractTextValue(divs[23]) || 'secondary',
    ctaAlignmentDesktop: extractTextValue(divs[24]) || 'left',
    ctaOrientationMobile: extractTextValue(divs[25]) || 'horizontal',
    loading: extractTextValue(divs[26]) || pictureDesktop?.loading || pictureMobile?.loading || 'lazy',
    targetCountries: extractTextValue(divs[27]) || '',
    targetLanguages: extractTextValue(divs[28]) || '',
  };
}

/**
 * Extracts text content from nested div > div > p structure.
 * Falls back to inner div textContent if no <p> is present (e.g. select values).
 */
function extractTextValue(div) {
  if (!div) return '';
  const innerDiv = div.querySelector(':scope > div');
  if (innerDiv) {
    const paragraph = innerDiv.querySelector('p');
    if (paragraph) return paragraph.textContent.trim();
    return innerDiv.textContent.trim();
  }
  return '';
}

/**
 * Extracts richtext HTML for the description field.
 * AEM serialises richtext with inline tags inside the first nested <div>.
 * We preserve the innerHTML and trust the block decorator to sanitize with
 * DOMPurify before rendering.
 */
function extractRichtextValue(div) {
  if (!div) return '';
  const innerDiv = div.querySelector(':scope > div');
  if (!innerDiv) return '';
  const html = innerDiv.innerHTML.trim();
  return html;
}

/**
 * Extracts picture element data (sources and img) for responsive images.
 * Falls back to building a synthetic <picture> when AEM renders the asset as
 * an <a href="…image.ext"> link instead of a real <picture>.
 */
function extractPictureElement(div) {
  if (!div) return null;
  const picture = div.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (!img) return null;

    const sources = Array.from(picture.querySelectorAll('source')).map((source) => ({
      type: source.getAttribute('type'),
      srcset: source.getAttribute('srcset'),
      media: source.getAttribute('media'),
    }));

    return {
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
      loading: img.getAttribute('loading') || 'lazy',
      sources,
      pictureElement: picture.cloneNode(true),
    };
  }

  const link = div.querySelector('a[href]');
  if (link) {
    const href = link.getAttribute('href') || '';
    if (/\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i.test(href)) {
      const syntheticPicture = div.ownerDocument.createElement('picture');
      const syntheticImg = div.ownerDocument.createElement('img');
      syntheticImg.setAttribute('src', href);
      syntheticImg.setAttribute('loading', 'lazy');
      syntheticPicture.append(syntheticImg);
      return {
        src: href,
        alt: '',
        loading: 'lazy',
        sources: [],
        pictureElement: syntheticPicture,
      };
    }
  }

  return null;
}

/**
 * Extracts link href, color values, or plain text URLs from a positional row.
 */
function extractLinkValue(div) {
  if (!div) return '';
  const innerDiv = div.querySelector(':scope > div');
  if (!innerDiv) return '';

  const link = innerDiv.querySelector('a');
  if (link) {
    const { textContent, href } = link;
    const linkText = textContent.trim();

    if (linkText.startsWith('#')) return linkText;
    if (linkText.startsWith('www.')) return `https://${linkText}`;
    if (linkText.startsWith('http://') || linkText.startsWith('https://')) return linkText;

    if (href) {
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin
          || url.hostname.includes('adobeaemcloud.com')
          || url.hostname.includes('hlx.page')
          || url.hostname.includes('hlx.live')) {
          return url.pathname + url.search + url.hash;
        }
        return href;
      } catch {
        return href;
      }
    }
    return linkText;
  }

  const paragraph = innerDiv.querySelector('p');
  if (paragraph) {
    const text = paragraph.textContent.trim();
    if (text.startsWith('#')) return text;
    if (text.startsWith('www.')) return `https://${text}`;
    if (text.startsWith('http://') || text.startsWith('https://')) return text;
    if (text.startsWith('/') || text.startsWith('#')) return text;
    return text;
  }
  return '';
}

/**
 * Returns the default configuration object for the CMS Flexible Content Banner.
 */
function getDefaultConfig() {
  return {
    title: '',
    description: '',
    textPosition: 'right',
    imageMode: 'split',
    imageDesktop: '',
    imageMobile: '',
    imageTablet: '',
    pictureDesktop: null,
    pictureMobile: null,
    pictureTablet: null,
    imageAlt: '',
    colorScheme: 'dark',
    solidBackgroundType: 'solid',
    backgroundColor: '#1b1b1b',
    gradientColorStart: '',
    gradientColorEnd: '',
    gradientStartPosition: '0%',
    gradientEndPosition: '100%',
    gradientDirection: 'to bottom',
    cta1Text: '',
    cta1Url: '',
    cta1LinkType: 'dofollow',
    cta1Variant: 'primary',
    cta2Text: '',
    cta2Url: '',
    cta2LinkType: 'dofollow',
    cta2Variant: 'secondary',
    ctaAlignmentDesktop: 'left',
    ctaOrientationMobile: 'horizontal',
    loading: 'lazy',
    targetCountries: '',
    targetLanguages: '',
  };
}
