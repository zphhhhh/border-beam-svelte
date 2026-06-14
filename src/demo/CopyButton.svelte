<!--
  Copy button with a dual-icon (copy ⇄ check) crossfade and a "Copy code"
  ⇄ "Copied" tooltip pill whose width tweens between the two labels. Faithful
  port of the React demo's CopyButton. Label widths are measured once after
  mount and exposed as --tt-w-a / --tt-w-b so the width transition is exact.
  Uses a hidden-textarea execCommand fallback when navigator.clipboard isn't
  available.
-->
<script lang="ts">
  let { text, label }: { text: string; label: string } = $props();

  let copied = $state(false);
  let swapState = $state<'copy' | 'copied'>('copy');
  let swapRef = $state<HTMLSpanElement | null>(null);
  let iconTimer: ReturnType<typeof setTimeout> | undefined;
  let swapTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const swap = swapRef;
    if (!swap) return;
    const labels = swap.querySelectorAll<HTMLElement>('.tt-label');
    const widths: number[] = [];
    labels.forEach((lbl) => {
      const prevPos = lbl.style.position;
      const prevDisp = lbl.style.display;
      lbl.style.position = 'static';
      lbl.style.display = 'inline-block';
      widths.push(lbl.getBoundingClientRect().width);
      lbl.style.position = prevPos;
      lbl.style.display = prevDisp;
    });
    if (widths.length >= 2) {
      swap.style.setProperty('--tt-w-a', widths[0] + 'px');
      swap.style.setProperty('--tt-w-b', widths[1] + 'px');
    }
  });

  $effect(() => {
    return () => {
      clearTimeout(iconTimer);
      clearTimeout(swapTimer);
    };
  });

  async function writeText(value: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // fall through to the execCommand path
      }
    }
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    ta.style.border = 'none';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    const sel = document.getSelection();
    const savedRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, value.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    if (savedRange && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    return ok;
  }

  async function handleCopy() {
    const ok = await writeText(text);
    if (!ok) return;
    copied = true;
    swapState = 'copied';
    clearTimeout(iconTimer);
    clearTimeout(swapTimer);
    const isTouch =
      typeof window.matchMedia === 'function' && window.matchMedia('(hover: none)').matches;
    const dwell = isTouch ? 2000 : 1600;
    iconTimer = setTimeout(() => {
      copied = false;
      swapTimer = setTimeout(() => {
        swapState = 'copy';
      }, 200);
    }, dwell);
  }
</script>

<button
  type="button"
  class="copy-btn"
  onclick={handleCopy}
  data-copied={copied ? 'true' : 'false'}
  aria-label={copied ? 'Copied' : label}
>
  <svg class="icon-copy" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
  <svg class="icon-check" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
  <span class="copy-btn-tooltip" role="tooltip" aria-hidden="true">
    <span class="tt-text">
      <span class="tt-stem">Cop</span>
      <span class="tt-swap" bind:this={swapRef} data-state={swapState}>
        <span class="tt-label tt-a">y code</span>
        <span class="tt-label tt-b">ied</span>
      </span>
    </span>
  </span>
</button>
