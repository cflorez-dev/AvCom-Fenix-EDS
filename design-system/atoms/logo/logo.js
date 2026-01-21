import { h } from '@dropins/tools/preact.js';
import { useEffect, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { waitForHlxCodeBasePath, buildAssetPath } from '../../../scripts/utils/hlx.helper.js';

const html = htm.bind(h);

/**
 * Validates and cleans a URL to avoid double origin
 * @param {string} url - URL to validate
 * @returns {string} Clean URL without origin duplication
 */
function validateAndCleanUrl(url) {
  if (!url) return '';

  // Detect pattern: http://origin/http:/origin/path or http://origin/https:/origin/path
  // Example: http://localhost:3000/http:/localhost:3000/assets/logo.jpg
  // Find the first complete origin
  const firstOriginMatch = url.match(/^(https?:\/\/[^/]+)\//);
  if (firstOriginMatch) {
    const firstOrigin = firstOriginMatch[1];
    const afterFirstOrigin = url.substring(firstOrigin.length + 1);

    // If after the first origin there's a pattern like http:/ or https:/ (without double slash)
    // This indicates a malformed double origin
    const malformedProtocolMatch = afterFirstOrigin.match(/^(https?):\/([^/])/);
    if (malformedProtocolMatch) {
      // Fix http:/ to http:// and return only the second part (the real URL)
      const corrected = afterFirstOrigin.replace(/^(https?):\//, '$1://');
      return corrected.replace(/\/+/g, '/');
    }

    // Also detect correct but duplicated pattern: http://origin/http://origin/path
    const correctProtocolMatch = afterFirstOrigin.match(/^(https?:\/\/[^/]+)/);
    if (correctProtocolMatch) {
      // Extract only the second part (the real URL)
      return afterFirstOrigin.replace(/\/+/g, '/');
    }
  }

  // If there's no double origin, return the URL as is
  return url;
}

/**
 * Generates an optimized AEM URL for an image
 * @param {string} src - Image path (can be relative or absolute)
 * @param {string} width - Desired width
 * @param {string} format - Image format (jpg, png, svg, webp, etc.)
 * @returns {string} Optimized URL with AEM parameters (always absolute with complete origin)
 */
function generateOptimizedImageUrl(src, width = '750', format = 'jpg') {
  if (!src) return '';

  // Validate and clean URL to avoid double origin BEFORE any processing
  const cleanedSrc = validateAndCleanUrl(src);

  const currentOrigin = window.location.origin;

  // If the URL is already absolute and has optimization parameters, return it as is
  const hasOptimizationParams = cleanedSrc.includes('?width=') || cleanedSrc.includes('media_');
  const isAbsolute = cleanedSrc.startsWith('http://')
    || cleanedSrc.startsWith('https://')
    || cleanedSrc.startsWith('//');
  if (hasOptimizationParams && isAbsolute) {
    return validateAndCleanUrl(cleanedSrc);
  }

  // Build absolute URL with AEM optimization parameters
  // AEM will automatically handle conversion to URLs with hash (media_xxx)
  try {
    // If src is already an absolute URL, use it directly
    // If it's relative, build absolute URL using window.location.origin
    let absoluteUrl;
    const isAbsoluteUrl = cleanedSrc.startsWith('http://')
      || cleanedSrc.startsWith('https://')
      || cleanedSrc.startsWith('//');
    if (isAbsoluteUrl) {
      // Already absolute, use directly (already validated above)
      absoluteUrl = cleanedSrc;
    } else {
      // Build absolute URL from origin
      // Ensure src starts with /
      const path = cleanedSrc.startsWith('/') ? cleanedSrc : `/${cleanedSrc}`;
      absoluteUrl = `${currentOrigin}${path}`;
    }

    // Validate again after building to avoid double origin
    absoluteUrl = validateAndCleanUrl(absoluteUrl);

    // IMPORTANT: Detect if it's a local image in /assets/ BEFORE parsing with URL
    // Local images in /assets/ are static files and should NOT have optimizations
    if (absoluteUrl.includes('/assets/')) {
      // Check if it's local (same domain)
      // If the URL starts with the current origin, it's local
      const isLocal = absoluteUrl.startsWith(currentOrigin) || absoluteUrl.startsWith('/');

      if (isLocal) {
        // It's local: return URL without optimizations (already validated and clean)
        return validateAndCleanUrl(absoluteUrl);
      }
      // If it's external but has /assets/, apply optimizations normally
      // (though rare, it could be an external CDN with similar structure)
    }

    // Parsear URL solo si no es local /assets/
    const url = new URL(absoluteUrl);
    const { origin, pathname } = url;

    // Para imágenes que NO están en /assets/ o son externas, aplicar optimizaciones
    // Determinar el formato basado en la extensión del archivo si no se especifica
    let imageFormat = format;
    if (!format || format === 'auto') {
      const ext = pathname.substring(pathname.lastIndexOf('.') + 1).toLowerCase();
      imageFormat = ext === 'svg' ? 'svg' : 'jpg';
    }

    // Return complete URL with origin so it works correctly
    // AEM will automatically convert the path to media_xxx format when accessed
    const optimizedUrl = `${origin}${pathname}?width=${width}&format=${imageFormat}&optimize=medium`;
    // Validate before returning
    return validateAndCleanUrl(optimizedUrl);
  } catch (e) {
    // If there's an error building the URL, build absolute URL manually
    const path = cleanedSrc.startsWith('/') ? cleanedSrc : `/${cleanedSrc}`;
    const absoluteUrl = `${currentOrigin}${path}`;

    // Validate before processing
    const validatedUrl = validateAndCleanUrl(absoluteUrl);

    // If it's from local assets/, return without optimizations
    if (validatedUrl.includes('/assets/')) {
      return validatedUrl;
    }

    const optimizedUrl = `${validatedUrl}?width=${width}&format=${format}&optimize=medium`;
    return validateAndCleanUrl(optimizedUrl);
  }
}

export const Logo = ({
  customClassName = '',
  variant = 'primary',
  mode = 'desktop',
  alt = 'Avianca Logo',
  customImageClassName = '',
  ...rest
}) => {
  const [codeBasePath, setCodeBasePath] = useState('');

  // Wait for window.hlx to be initialized
  useEffect(() => {
    const initializeLogo = async () => {
      const hlxCodeBasePath = await waitForHlxCodeBasePath({
        maxRetries: 30,
        retryDelay: 100,
      });
      setCodeBasePath(hlxCodeBasePath);
    };

    initializeLogo();
  }, []);

  // Build base routes for logos using buildAssetPath
  // This correctly handles all cases: empty, relative or absolute codeBasePath
  // Use .jpg files instead of .svg for better AEM compatibility
  const logoRoutes = {
    primary: {
      desktop: buildAssetPath('assets/logos/logoAvianca-desktop.jpg', codeBasePath),
      mobile: buildAssetPath('assets/logos/logoAvianca-mobile.jpg', codeBasePath),
    },
  };

  const logoSrcBase = logoRoutes[variant][mode] || logoRoutes.primary.desktop;

  // Generate optimized URLs for mobile and desktop (always absolute from origin)
  // Use jpg format for better AEM optimization
  // Validate before passing to template to avoid double origin
  const logoSrcMobile = validateAndCleanUrl(
    generateOptimizedImageUrl(logoRoutes.primary.mobile, '750', 'jpg'),
  );
  const logoSrc = validateAndCleanUrl(
    generateOptimizedImageUrl(logoSrcBase, '750', 'jpg'),
  );

  const pictureClassName = customClassName.trim() || undefined;

  return html`
    <picture class=${pictureClassName}>
      <source
        srcSet=${logoSrcMobile}
        media="(max-width: 767px)"
      />
      <img
        class=${customImageClassName}
        src=${logoSrc}
        alt=${alt}
        ...${rest}
      />
    </picture>
  `;
};

export default Logo;
