# MultiTab Block

Horizontal tab navigation component for organizing content modularly without vertical scroll.

## Features

- ✅ Horizontal tab navigation with active indicator
- ✅ Optional icons in tab labels (before/after positioning)
- ✅ Scroll horizontal on mobile with smooth auto-scroll to active tab
- ✅ Keyboard navigation (Arrow keys, Home, End)
- ✅ Accepts any cms-block as tab content (rich text, cards, tables, accordions, etc.)
- ✅ Feature flags (dates, languages, enable/disable)
- ✅ SEO-friendly with proper ARIA attributes
- ✅ Compatible with Universal Editor (Hide & Render Sibling pattern)

## Structure

```
MultiTab Block (controller)
  └── Sibling Sections with metadata (tab items)
        └── Content (any cms-block)
```

## Block Configuration (Metadata)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `group-id` | string | auto-generated | Unique identifier for tab group. Tab sections must match this ID. |
| `default-tab` | string | - | Optional: ID of tab to open by default (e.g., 'tab-group-0'). If empty, first tab opens. |
| `enable-from` | date | - | Optional: Start date in ISO format (YYYY-MM-DD). Block hidden before this date. |
| `enable-to` | date | - | Optional: End date in ISO format (YYYY-MM-DD). Block hidden after this date. |
| `target-languages` | string | - | Optional: Comma-separated language codes (e.g., 'en,es,pt'). Block visible only for these languages. |
| `show` | boolean | true | Enable or disable the entire block. |

## Section Configuration (Metadata)

Each section following the MultiTab block with matching `multitab-group` becomes a tab.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `multitab-group` | string | **required** | Group ID (must match block's group-id). |
| `multitab-label` | string | Tab N | Tab label text displayed in navigation. |
| `multitab-icon` | string | - | Optional: Icon path (e.g., "action/check", "navigation/arrow-forward"). |
| `multitab-icon-position` | string | before | Icon position: "before" or "after" label. |
| `multitab-default-open` | boolean | false | Set "true" to open this tab by default (overridden by block's default-tab). |

## Usage Example

### In Universal Editor

**1. Create MultiTab Block:**
```
MultiTab Block
  Metadata:
    - group-id: "process-tabs"
    - default-tab: "tab-process-tabs-0"
    - show: "true"
```

**2. Create Tab Sections:**
```
Section 1
  Metadata:
    - multitab-group: "process-tabs"
    - multitab-label: "Step 1: Register"
    - multitab-icon: "action/check"
    - multitab-icon-position: "before"
  
  Content:
    - Rich Text Block
    - Image
    - Button

Section 2
  Metadata:
    - multitab-group: "process-tabs"
    - multitab-label: "Step 2: Verify"
    - multitab-icon: "action/verified"
  
  Content:
    - Informative Cards Rail
    - Rich Text Block

Section 3
  Metadata:
    - multitab-group: "process-tabs"
    - multitab-label: "Step 3: Complete"
    - multitab-icon: "action/done"
    - multitab-icon-position: "after"
  
  Content:
    - Promotional Cards Rail
```

## Styling

### CSS Classes

- `.multitab-container` - Main container
- `[role="tablist"]` - Tab navigation bar
- `[role="tab"]` - Individual tab button
- `.multitab-panel` - Tab content panel
- `[role="tabpanel"]` - Accessible panel wrapper

### Tailwind Usage

Tab buttons use Tailwind classes for spacing, colors, and transitions:
- Layout: `inline-flex`, `items-center`, `gap-[var(--spacing-x-small)]`
- Spacing: `px-[var(--spacing-medium)]`, `py-[var(--spacing-small)]`
- Typography: `text-[16px]`, `font-normal`, `leading-normal`
- States: `hover:text-[var(--text-link-informative-default)]`
- Border: `border-b-2`, `border-transparent`

### Custom CSS

Additional styles in [multitab.css](multitab.css):
- `.multitab-panel` - Padding and fade-in animation
- Scrollbar styling for webkit browsers
- Responsive adjustments for mobile

## Accessibility

### ARIA Attributes

- `role="tablist"` - Tab navigation container
- `role="tab"` - Each tab button
- `role="tabpanel"` - Each content panel
- `aria-selected="true|false"` - Active tab state
- `aria-controls="panel-id"` - Links tab to panel
- `aria-labelledby="btn-id"` - Links panel to tab
- `tabindex="0|-1"` - Focus management

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Arrow Left` | Move to previous tab (wraps to last) |
| `Arrow Right` | Move to next tab (wraps to first) |
| `Home` | Move to first tab |
| `End` | Move to last tab |
| `Tab` | Move focus to panel content |

## Technical Details

### Hide & Render Sibling Pattern

This block uses the **Hide & Render Sibling** pattern to preserve Universal Editor compatibility:

1. Original block content is **hidden** (not removed) via `block.style.display = 'none'`
2. New multitab UI is rendered as a **sibling** element after the section
3. Tab section contents are **moved** into tab panels
4. Original sections are **hidden** (not removed) via `section.style.display = 'none'`

This ensures Universal Editor can still access and edit child items.

### Auto-scroll Behavior

Active tab automatically scrolls into view:
- On initial page load (100ms delay)
- On tab switch (smooth animation)
- Uses `scrollIntoView({ behavior: 'smooth', inline: 'center' })`

### Mobile Responsive

- Tab navigation scrolls horizontally on mobile
- Smooth scroll with scroll-snap support
- Custom scrollbar styling (webkit browsers)
- Reduced padding on small screens

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support, webkit scrollbar styling)
- ✅ Mobile browsers (horizontal scroll, touch-friendly)

## Performance

- Minimal JavaScript footprint
- CSS animations hardware-accelerated
- Lazy rendering (only active panel visible)
- Icon components render on-demand via Preact

## Integration

### With Design System

Uses atoms from design system:
- `Icon` component for optional tab icons
- CSS variables for consistent theming
- Tailwind classes for responsive layout

### With Other Blocks

Tab content accepts **any cms-block**:
- Rich Text
- Cards (Informative, Promotional, Mosaic)
- Accordions
- Images
- Buttons
- Forms
- Carousels
- etc.

## Troubleshooting

### Tabs not appearing
- Verify `multitab-group` metadata matches block's `group-id`
- Check sections are direct siblings after MultiTab block
- Ensure `show` is not set to "false"

### Icons not rendering
- Verify icon path is correct (e.g., "action/check")
- Check Icon component is available in design-system/atoms/icon/
- Verify icon file exists in assets/icons/

### Universal Editor issues
- Ensure npm run build:json has been executed
- Verify component-definition.json uses "model" (not "filter")
- Check component appears in component-filters.json
- Clear browser cache and reload

## Related Components

- [accordion-group](../accordion-group/) - Vertical collapsible content
- [cms-informative-cards-carousel](../cms-informative-cards-carousel/) - Horizontal carousel with dots
- [breadcrumb](../breadcrumb/) - Hierarchical navigation
