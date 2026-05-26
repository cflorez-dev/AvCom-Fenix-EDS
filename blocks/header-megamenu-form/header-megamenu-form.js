/**
 * Header Megamenu Form block
 *
 * Data-only block used by header-navbar to render a form inside the megamenu
 * banner slot. Replaces any CMS block when present.
 * The parent section is hidden from the normal page flow by header-navbar.js,
 * so this block needs no visual rendering of its own.
 */
// eslint-disable-next-line no-unused-vars
export default function decorate(block) {
  // Intentionally empty — consumed by header-navbar via parseMegamenuSection()
}
