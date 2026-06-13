<script lang="ts">
  import { sizePresets, sizeThemePresets, generateBeamCSS, getPulseDriverConfig } from './styles';
  import { registerPulseInstance } from './pulseDriver';
  import type { BorderBeamProps, BorderBeamTheme } from './types';
  import type { Snippet } from 'svelte';

  interface Props extends BorderBeamProps {
    /** Content to wrap with the border beam effect. */
    children?: Snippet;
    /** Any extra DOM attributes are forwarded to the wrapper div. */
    [key: string]: unknown;
  }

  let {
    size = 'md',
    colorVariant = 'colorful',
    theme = 'dark',
    staticColors = false,
    duration,
    active = true,
    borderRadius: customBorderRadius,
    brightness: brightnessProp,
    saturation,
    hueRange = 30,
    strength = 1,
    class: className,
    style,
    onActivate,
    onDeactivate,
    children,
    ...rest
  }: Props = $props();

  // ── Stable per-instance id ──────────────────────────────────────────────
  const beamId = nextBeamId();

  function resolveTheme(t: BorderBeamTheme, systemTheme: 'dark' | 'light'): 'dark' | 'light' {
    return t === 'auto' ? systemTheme : t;
  }

  function getInitialSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // ── Reactive state (mirrors the React useState hooks) ───────────────────
  let systemTheme = $state<'dark' | 'light'>(getInitialSystemTheme());
  let isActive = $state(active);
  let isFading = $state(false);
  let isVisible = $state(true);
  let detectedRadius = $state<number | null>(null);
  let pulseGlowScale = $state<{ x: number; y: number }>({ x: 1, y: 1 });

  let wrapperEl = $state<HTMLDivElement | null>(null);

  // ── Track the system color scheme for theme="auto" ──────────────────────
  $effect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      systemTheme = e.matches ? 'dark' : 'light';
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  });

  // ── Auto-detect child border radius when no explicit value is provided ──
  $effect(() => {
    // re-run when these change (matches React's [customBorderRadius, children])
    customBorderRadius;
    children;

    if (customBorderRadius != null) return;
    const el = wrapperEl;
    if (!el) return;

    const detect = () => {
      const child = el.firstElementChild as HTMLElement | null;
      if (!child) return;
      const computed = getComputedStyle(child);
      const raw = parseFloat(computed.borderTopLeftRadius);
      if (!isNaN(raw) && raw > 0) {
        detectedRadius = raw;
      }
    };

    detect();

    const observer = new MutationObserver(detect);
    observer.observe(el, { childList: true, subtree: false });
    return () => observer.disconnect();
  });

  // ── Sync the external `active` prop into the fade state machine ─────────
  $effect(() => {
    if (active && !isActive && !isFading) {
      isActive = true;
    } else if (!active && isActive && !isFading) {
      isFading = true;
    }
  });

  // ── Pause paint-heavy animations while scrolled offscreen ───────────────
  $effect(() => {
    const el = wrapperEl;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) isVisible = entry.isIntersecting;
      },
      { rootMargin: '256px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  });

  // ── pulse-outside: scale the halo geometry to the measured element ──────
  $effect(() => {
    // re-run on size / children change (matches React's [size, children])
    children;

    if (size !== 'pulse-outside') {
      pulseGlowScale = { x: 1, y: 1 };
      return;
    }

    const el = wrapperEl;
    if (!el) return;

    const REF_WIDTH = 350;
    const REF_HEIGHT = 140;
    const MIN_SCALE = 0.35;
    const MAX_SCALE = 4;
    const clamp = (value: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));

    const measure = () => {
      const child = el.firstElementChild as HTMLElement | null;
      if (!child) return;
      const rect = child.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = +clamp(rect.width / REF_WIDTH).toFixed(3);
      const y = +clamp(rect.height / REF_HEIGHT).toFixed(3);
      if (pulseGlowScale.x !== x || pulseGlowScale.y !== y) {
        pulseGlowScale = { x, y };
      }
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;

    const child = el.firstElementChild as HTMLElement | null;
    if (!child) return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(child);
    return () => resizeObserver.disconnect();
  });

  function handleAnimationEnd(e: AnimationEvent) {
    const animationName = e.animationName;
    if (animationName.includes('fade-out')) {
      isActive = false;
      isFading = false;
      onDeactivate?.();
    } else if (animationName.includes('fade-in')) {
      onActivate?.();
    }
  }

  // ── Derived configuration ───────────────────────────────────────────────
  const resolvedTheme = $derived(resolveTheme(theme, systemTheme));
  const themeConfig = $derived(sizeThemePresets[size][resolvedTheme]);
  const sizeConfig = $derived(sizePresets[size]);
  const isPulse = $derived(size === 'pulse-inner' || size === 'pulse-outside');

  const finalBorderRadius = $derived(customBorderRadius ?? detectedRadius ?? sizeConfig.borderRadius);
  const finalDuration = $derived(duration ?? (size === 'line' ? 3.1 : isPulse ? 2.3 : 1.96));
  const finalSaturation = $derived(saturation ?? themeConfig.saturation);
  const finalBrightness = $derived(brightnessProp ?? themeConfig.brightness ?? 1.3);
  const finalHueRange = $derived(size === 'line' ? Math.min(hueRange, 13) : hueRange);
  const finalStaticColors = $derived(colorVariant === 'mono' ? true : staticColors);

  const cssStyles = $derived(
    generateBeamCSS({
      id: beamId,
      borderRadius: finalBorderRadius,
      borderWidth: sizeConfig.borderWidth,
      duration: finalDuration,
      strokeOpacity: themeConfig.strokeOpacity,
      innerOpacity: themeConfig.innerOpacity,
      bloomOpacity: themeConfig.bloomOpacity,
      innerShadow: themeConfig.innerShadow,
      size,
      colorVariant,
      staticColors: finalStaticColors,
      brightness: finalBrightness,
      saturation: finalSaturation,
      hueRange: finalHueRange,
      theme: resolvedTheme,
      hairlineOpacity: themeConfig.hairlineOpacity,
    })
  );

  // Runtime config for the JS breathing driver (null for non-pulse sizes).
  const driverConfig = $derived(
    isPulse
      ? getPulseDriverConfig(size, resolvedTheme, finalDuration, finalHueRange, finalStaticColors, beamId)
      : null
  );

  // ── Drive the pulse breathing from the shared, fps-capped rAF loop ──────
  $effect(() => {
    const config = driverConfig;
    if (!config) return;
    if (!(isActive || isFading) || !isVisible) return;

    const el = wrapperEl;
    if (!el) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    return registerPulseInstance(el, config);
  });

  // ── Merged inline style (custom properties + user style) ────────────────
  const mergedStyle = $derived.by(() => {
    const parts: string[] = [];
    if (style) parts.push(style.trim().replace(/;?\s*$/, ''));
    parts.push(`--beam-strength: ${Math.max(0, Math.min(1, strength))}`);
    if (size === 'pulse-outside') {
      parts.push(`--pulse-glow-sx: ${pulseGlowScale.x}`);
      parts.push(`--pulse-glow-sy: ${pulseGlowScale.y}`);
    }
    return parts.join('; ') + ';';
  });

  // ── Data attributes (presence-based, like the React component) ──────────
  const dataActive = $derived(isActive && !isFading ? '' : undefined);
  const dataFading = $derived(isFading ? '' : undefined);
  const dataPaused = $derived(isActive && !isFading && !isVisible ? '' : undefined);
</script>

<!--
  The generated CSS is injected as a plain <style> tag via {@html} (mirrors the
  React component's `<style>{cssStyles}</style>`). A component-scoped <style>
  block can't be used because the rules are generated dynamically per instance
  and reference a per-instance id.

  DOM order matches React exactly: wrapped content first, then the bloom child,
  so the ::before / ::after pseudo layers and z-index stacking line up.
-->
{@html `<style>${cssStyles}</style>`}
<div
  {...rest}
  bind:this={wrapperEl}
  data-beam={beamId}
  data-active={dataActive}
  data-fading={dataFading}
  data-paused={dataPaused}
  class={className}
  style={mergedStyle}
  onanimationend={handleAnimationEnd}
>
  {@render children?.()}
  <div data-beam-bloom></div>
</div>

<script lang="ts" module>
  let beamIdCounter = 0;
  export function nextBeamId(): string {
    beamIdCounter += 1;
    return `bb-${beamIdCounter}`;
  }
</script>
