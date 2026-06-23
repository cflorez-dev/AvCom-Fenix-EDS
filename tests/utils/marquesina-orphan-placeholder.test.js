// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const selectorPath = '../../scripts/services/header/language-country-selector.js';
const targetFilterPath = '../../scripts/utils/target-filter.js';

/**
 * Regression test for the "empty gap above the sticky header on scroll" bug.
 *
 * `bootstrapMarqueeHeight()` reserves a 55px `.marquesina-global-container`
 * placeholder (and `--marquee-height`) as soon as a `.marquesina.block` exists.
 * When that marquesina's SECTION is hidden by targeting, the block's decorate()
 * never runs, so the placeholder used to be orphaned forever: a permanent gap
 * above the sticky header (header is positioned `top: var(--marquee-height)`).
 * applySectionTargeting() must now collapse that orphan.
 */
function buildHiddenMarquesinaScenario() {
  document.documentElement.style.setProperty('--marquee-height', '55px');

  const placeholder = document.createElement('div');
  placeholder.className = 'marquesina-global-container';
  placeholder.style.minHeight = '55px';
  document.body.appendChild(placeholder);

  const section = document.createElement('div');
  section.className = 'section marquesina-container';
  const block = document.createElement('div');
  block.className = 'marquesina block';
  section.appendChild(block);
  document.body.appendChild(section);

  return { placeholder, section };
}

describe('marquesina orphan placeholder collapse', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = '';
    document.documentElement.style.removeProperty('--marquee-height');
    // Visitor in Colombia / Spanish will NOT match an es/ec or fr-targeted section.
    vi.doMock(selectorPath, () => ({
      getStoredCountry: vi.fn().mockReturnValue('col'),
      getStoredLanguage: vi.fn().mockReturnValue('es'),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('collapses the orphaned marquesina placeholder when its section is hidden by targeting', async () => {
    const { applySectionTargeting } = await import(targetFilterPath);
    const { section } = buildHiddenMarquesinaScenario();

    // Target a country the current visitor (CO) is not in; section is hidden.
    const shown = applySectionTargeting(section, { 'target-countries': 'us' });

    expect(shown).toBe(false);
    expect(section.classList.contains('hidden-by-targeting')).toBe(true);

    // Collapse is debounced (150ms).
    vi.advanceTimersByTime(200);

    expect(document.querySelector('.marquesina-global-container')).toBeNull();
    expect(
      document.documentElement.style.getPropertyValue('--marquee-height'),
    ).toBe('0px');
  });

  it('keeps the placeholder when a sibling marquesina section is still live', async () => {
    const { applySectionTargeting } = await import(targetFilterPath);
    const { section: hiddenSection } = buildHiddenMarquesinaScenario();

    // A second marquesina whose section is NOT targeting-hidden (will render later).
    const liveSection = document.createElement('div');
    liveSection.className = 'section marquesina-container';
    liveSection.dataset.sectionStatus = 'initialized';
    const liveBlock = document.createElement('div');
    liveBlock.className = 'marquesina block';
    liveSection.appendChild(liveBlock);
    document.body.appendChild(liveSection);

    applySectionTargeting(hiddenSection, { 'target-countries': 'us' });
    vi.advanceTimersByTime(200);

    // Sibling marquesina may still render; placeholder must survive.
    expect(document.querySelector('.marquesina-global-container')).not.toBeNull();
    expect(
      document.documentElement.style.getPropertyValue('--marquee-height'),
    ).toBe('55px');
  });
});
