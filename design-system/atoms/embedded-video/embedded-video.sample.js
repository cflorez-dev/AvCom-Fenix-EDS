/* eslint-disable import/prefer-default-export */
import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { EmbeddedVideo } from './embedded-video.js';

const html = htm.bind(h);

// TODO: It will not be used at the moment, but will be kept in case it is needed later.
/**
 * Samples for EmbeddedVideo component
 */
export const EmbeddedVideoSamples = () => html`
  <div class="flex flex-col gap-[var(--spacing-large)]">
    <!-- YouTube with Thumbnail -->
    <div>
      <h3 class="text-[var(--heading-h600-size)] font-bold mb-[var(--spacing-small)]">
        YouTube Video with Thumbnail
      </h3>
      <div class="h-[300px] w-full max-w-[600px]">
        <${EmbeddedVideo}
          type="youtube"
          url="dQw4w9WgXcQ"
          thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
          autoplay=${false}
        />
      </div>
    </div>

    <!-- YouTube Autoplay (sin thumbnail) -->
    <div>
      <h3 class="text-[var(--heading-h600-size)] font-bold mb-[var(--spacing-small)]">
        YouTube Video Autoplay
      </h3>
      <div class="h-[300px] w-full max-w-[600px]">
        <${EmbeddedVideo}
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          autoplay=${true}
        />
      </div>
    </div>

    <!-- AEM Video -->
    <div>
      <h3 class="text-[var(--heading-h600-size)] font-bold mb-[var(--spacing-small)]">
        AEM Video
      </h3>
      <div class="h-[300px] w-full max-w-[600px]">
        <${EmbeddedVideo}
          type="aem"
          url="/media/sample-video.mp4"
          thumbnail="/media/sample-thumbnail.jpg"
        />
      </div>
    </div>

    <!-- YouTube Short URL -->
    <div>
      <h3 class="text-[var(--heading-h600-size)] font-bold mb-[var(--spacing-small)]">
        YouTube Short URL (youtu.be)
      </h3>
      <div class="h-[300px] w-full max-w-[600px]">
        <${EmbeddedVideo}
          type="youtube"
          url="https://youtu.be/dQw4w9WgXcQ"
          autoplay=${false}
        />
      </div>
    </div>

    <!-- External Video -->
    <div>
      <h3 class="text-[var(--heading-h600-size)] font-bold mb-[var(--spacing-small)]">
        External Video
      </h3>
      <div class="h-[300px] w-full max-w-[600px]">
        <${EmbeddedVideo}
          type="external"
          url="https://www.example.com/video.mp4"
          thumbnail="https://www.example.com/thumbnail.jpg"
        />
      </div>
    </div>
  </div>
`;
