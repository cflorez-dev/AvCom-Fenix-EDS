/* eslint-disable import/prefer-default-export */
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

// TODO: It will not be used at the moment, but will be kept in case it is needed later.
/**
 * Extracts YouTube video ID from various URL formats
 * @param {string} url - YouTube URL or video ID
 * @returns {string} YouTube video ID
 */
function extractYouTubeId(url) {
  if (!url) return '';

  // If already an ID (11 characters), return as-is
  if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
    return url;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  const matchedId = patterns
    .map((pattern) => url.match(pattern))
    .find((match) => match && match[1]);

  return matchedId ? matchedId[1] : url;
}

/**
 * EmbeddedVideo - Renders YouTube, AEM, or external videos with thumbnail placeholder
 * @param {string} type - Video type: 'youtube' | 'aem' | 'external'
 * @param {string} url - Video URL or YouTube ID
 * @param {string} thumbnail - Placeholder image URL (optional)
 * @param {boolean} autoplay - Auto-play video on load
 * @param {string} customClassName - Additional CSS classes
 * @param {object} rest - Additional props
 */
export const EmbeddedVideo = ({
  type = 'youtube',
  url = '',
  thumbnail = '',
  autoplay = false,
  customClassName = '',
  ...rest
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);

  useEffect(() => {
    setIsPlaying(autoplay);
  }, [autoplay]);

  const getEmbedUrl = () => {
    if (type === 'youtube') {
      const youtubeId = extractYouTubeId(url);
      const autoplayParam = isPlaying ? '1' : '0';
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplayParam}&rel=0`;
    }

    if (type === 'aem' || type === 'external') {
      return url;
    }

    return url;
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const baseClasses = 'relative w-full h-full overflow-hidden rounded-[inherit]';

  return html`
    <div
      class="${baseClasses} ${customClassName}"
      data-name="embeddedVideo"
      data-video-type="${type}"
      ...${rest}
    >
      ${!isPlaying && thumbnail ? html`
        <!-- Thumbnail with Play Button -->
        <div class="absolute inset-0 w-full h-full cursor-pointer" onClick=${handlePlayClick}>
          <img
            src=${thumbnail}
            class="w-full h-full object-cover"
            alt="Video thumbnail"
            loading="lazy"
          />

          <!-- Play Button Overlay -->
          <div class="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)] transition-all hover:bg-[rgba(0,0,0,0.4)]">
            <div class="flex items-center justify-center w-16 h-16 min-[1248px]:w-20 min-[1248px]:h-20 rounded-full bg-[var(--background-brand-primary-default)] hover:bg-[var(--background-brand-primary-hover)] transition-all">
              <!-- Play Icon SVG -->
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                class="ml-1"
              >
                <path
                  d="M8 5v14l11-7z"
                  fill="var(--text-normal-lighter)"
                />
              </svg>
            </div>
          </div>
        </div>
      ` : null}

      ${isPlaying || !thumbnail ? html`
        <!-- Video Player -->
        ${type === 'youtube' || type === 'external' ? html`
          <iframe
            src=${getEmbedUrl()}
            class="absolute inset-0 w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="Embedded video"
          />
        ` : html`
          <video
            src=${url}
            class="absolute inset-0 w-full h-full object-cover"
            controls
            autoplay=${autoplay}
            title="Video player"
          >
            <track kind="captions" />
          </video>
        `}
      ` : null}
    </div>
  `;
};
