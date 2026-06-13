# border-beam-svelte

Animated border beam effect for **Svelte 5**. A lightweight component that adds a
traveling or breathing glow animation around any element — cards, buttons, inputs,
or search bars.

**🔗 Live demo: https://zphhhhh.github.io/border-beam-svelte/**

This is a faithful port of the [`border-beam`](https://github.com/Jakubantalik/border-beam)
React component. It reuses the original's framework-agnostic CSS engine verbatim,
so the visual output (every size, color variant, theme, and animation) matches
the React version exactly.

## Install

```bash
npm install border-beam-svelte
```

## Quick start

```svelte
<script>
  import { BorderBeam } from 'border-beam-svelte';
</script>

<BorderBeam>
  <div style="padding: 32px; border-radius: 16px; background: #1d1d1d;">
    Your content here
  </div>
</BorderBeam>
```

The component wraps your content (passed via the default slot / `children` snippet)
and overlays the animated beam effect. It auto-detects the `border-radius` of the
first child element.

## Types

Built-in presets control the glow style and motion. They fall into two families.

### Rotate (traveling beam)

```svelte
<BorderBeam size="md"><Card /></BorderBeam>      <!-- Full border glow (default) -->
<BorderBeam size="sm"><IconButton /></BorderBeam> <!-- Compact glow for small elements -->
<BorderBeam size="line"><SearchBar /></BorderBeam> <!-- Bottom-only traveling glow -->
```

### Pulse (breathing glow, no rotation)

```svelte
<BorderBeam size="pulse-inner"><Card /></BorderBeam>   <!-- Contained breathing border glow -->
<BorderBeam size="pulse-outside"><Card /></BorderBeam> <!-- Outward-blooming halo -->
```

> **`pulse-outside` requires an opaque wrapped child.** The colorful core and halo
> render *behind* your content (`z-index: -1`) and bloom outward, so only the part
> that spills beyond the element shows. The wrapper uses `overflow: visible`, so
> make sure the surrounding layout has room for the halo to spill.

## Color variants

```svelte
<BorderBeam colorVariant="colorful" />  <!-- Rainbow spectrum (default) -->
<BorderBeam colorVariant="mono" />      <!-- Grayscale -->
<BorderBeam colorVariant="ocean" />     <!-- Blue-purple tones -->
<BorderBeam colorVariant="sunset" />    <!-- Orange-yellow-red tones -->
```

## Theme

```svelte
<BorderBeam theme="dark" />   <!-- Dark background (default) -->
<BorderBeam theme="light" />  <!-- Light background -->
<BorderBeam theme="auto" />   <!-- Detects system preference -->
```

## Play / pause

Toggle the animation on and off with smooth fade transitions:

```svelte
<script>
  let active = $state(true);
</script>

<BorderBeam {active} onDeactivate={() => console.log('faded out')}>
  <Card />
</BorderBeam>
```

## Props

| Prop           | Type                                                              | Default          | Description |
|----------------|-------------------------------------------------------------------|------------------|-------------|
| `children`     | `Snippet`                                                         | —                | Content to wrap (default slot) |
| `size`         | `'sm' \| 'md' \| 'line' \| 'pulse-outside' \| 'pulse-inner'`      | `'md'`           | Size/type preset |
| `colorVariant` | `'colorful' \| 'mono' \| 'ocean' \| 'sunset'`                     | `'colorful'`     | Color palette |
| `theme`        | `'dark' \| 'light' \| 'auto'`                                     | `'dark'`         | Background adaptation |
| `strength`     | `number`                                                          | `1`              | Effect opacity (0–1), only affects the beam layers |
| `duration`     | `number`                                                          | `1.96`/`3.1`/`2.3` | Animation cycle in seconds (rotate / line / pulse) |
| `active`       | `boolean`                                                         | `true`           | Whether the animation is playing |
| `borderRadius` | `number`                                                          | auto-detected    | Custom border radius in px |
| `brightness`   | `number`                                                          | per-type (`1.3`) | Glow brightness multiplier |
| `saturation`   | `number`                                                          | `1.2`            | Glow saturation multiplier |
| `hueRange`     | `number`                                                          | `30`             | Hue rotation range in degrees |
| `staticColors` | `boolean`                                                         | `false`          | Disable hue-shift animation |
| `class`        | `string`                                                          | —                | Additional class on the wrapper |
| `style`        | `string`                                                          | —                | Additional inline styles on the wrapper |
| `onActivate`   | `() => void`                                                      | —                | Called when fade-in completes |
| `onDeactivate` | `() => void`                                                      | —                | Called when fade-out completes |

Any other DOM attributes are forwarded to the wrapper `<div>`.

## How it works

`BorderBeam` renders a wrapper `<div>` with an injected per-instance `<style>` and:

- **`::after`** — the beam stroke (rotate: conic gradient masked to the border; pulse: the colored perimeter ring / hairline)
- **`::before`** — inner glow layer (pulse-outside pushes this outward behind the content)
- **`[data-beam-bloom]`** — outer bloom/glow child div

All effect layers are absolutely positioned and use `pointer-events: none`. The
rotate and line types animate via CSS `@property` keyframes. The pulse types drive
their breathing from a single shared, frame-rate-capped (~30fps) `requestAnimationFrame`
loop that writes plain CSS custom properties — and automatically pause when the
instance is inactive, offscreen, or the user prefers reduced motion.

## Requirements

- Svelte 5+
- Modern browser with CSS `@property` support (Chrome 85+, Safari 15.4+, Firefox 128+)

## Development

```bash
bun install
bun run dev        # demo at http://localhost:5179
bun run build:lib  # build distributable to dist/
bun run check      # type-check
```

## License

MIT
