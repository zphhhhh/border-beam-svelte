<script lang="ts">
  import { BorderBeam, type BorderBeamColorVariant, type BorderBeamTheme } from '$lib';

  let colorVariant = $state<BorderBeamColorVariant>('colorful');
  let theme = $state<Exclude<BorderBeamTheme, 'auto'>>('dark');
  let active = $state(true);
  let strength = $state(1);

  const variants: BorderBeamColorVariant[] = ['colorful', 'mono', 'ocean', 'sunset'];

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
  }

  // Shared props spread into every demo instance.
  const shared = $derived({ colorVariant, theme, active, strength });
</script>

<div class="wrap">
  <header class="hero">
    <div>
      <h1>Border Beam <span style="opacity:.4">/ Svelte</span></h1>
      <p>
        Animated border beam effect for Svelte 5. A faithful port of the
        <code>border-beam</code> React component — same CSS engine, same presets,
        traveling beams and breathing glows around any element.
      </p>
    </div>
    <button class="pill" onclick={toggleTheme}>
      {theme === 'dark' ? '☾ Dark' : '☀ Light'}
    </button>
  </header>

  <div class="toolbar">
    <div class="group">
      <span class="label">Color</span>
      {#each variants as v}
        <button class="pill" data-on={colorVariant === v} onclick={() => (colorVariant = v)}>
          {v}
        </button>
      {/each}
    </div>
    <div class="group">
      <span class="label">Play</span>
      <button class="pill" data-on={active} onclick={() => (active = !active)}>
        {active ? '⏸ Pause' : '▶ Play'}
      </button>
    </div>
    <div class="group">
      <span class="label">Strength</span>
      <input type="range" min="0" max="1" step="0.05" bind:value={strength} />
      <span class="cap">{strength.toFixed(2)}</span>
    </div>
  </div>

  <div class="grid">
    <div class="section-title">Rotate — traveling beam</div>

    <div class="cell">
      <div class="stage">
        <BorderBeam size="md" {...shared}>
          <div class="card">
            <div class="title">Border (md)</div>
            <div class="body">Full traveling glow around a card. Auto-detects the child's border radius.</div>
          </div>
        </BorderBeam>
      </div>
      <span class="cap">size="md"</span>
    </div>

    <div class="cell">
      <div class="stage">
        <BorderBeam size="sm" {...shared}>
          <div class="icon-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </div>
        </BorderBeam>
      </div>
      <span class="cap">size="sm"</span>
    </div>

    <div class="cell">
      <div class="stage">
        <BorderBeam size="line" {...shared}>
          <div class="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input placeholder="Search…" />
          </div>
        </BorderBeam>
      </div>
      <span class="cap">size="line"</span>
    </div>

    <div class="section-title">Pulse — breathing glow</div>

    <div class="cell">
      <div class="stage">
        <BorderBeam size="pulse-inner" {...shared}>
          <div class="card">
            <div class="title">Pulse Inner</div>
            <div class="body">Contained breathing glow that stays within the element's border.</div>
          </div>
        </BorderBeam>
      </div>
      <span class="cap">size="pulse-inner"</span>
    </div>

    <div class="cell">
      <div class="stage">
        <BorderBeam size="pulse-outside" {...shared}>
          <div class="card">
            <div class="title">Pulse Outside</div>
            <div class="body">Outward-blooming halo that radiates beyond the (opaque) element.</div>
          </div>
        </BorderBeam>
      </div>
      <span class="cap">size="pulse-outside"</span>
    </div>

    <div class="cell">
      <div class="stage">
        <BorderBeam size="md" {...shared}>
          <button class="btn">Subscribe</button>
        </BorderBeam>
      </div>
      <span class="cap">md · button</span>
    </div>
  </div>
</div>
