<script lang="ts">
  import { onMount } from 'svelte';
  import { mapData, activeLineId } from './stores';
  import Sidebar from './Sidebar.svelte';
  import Canvas from './Canvas.svelte';
  import Hud from './Hud.svelte';
  import { undo, redo } from './commands';

  // boot fixture
  onMount(async () => {
    try {
      const r = await fetch('/fixtures/synth_city.json');
      if (r.ok) {
        const j = await r.json();
        mapData.set(j);
        if (j.lines && j.lines.length) activeLineId.set(j.lines[0].id);
      }
    } catch (e) { /* fall back to empty */ }
  });

  function onKey(ev: KeyboardEvent) {
    const isInput = (ev.target as HTMLElement)?.tagName === 'INPUT';
    if (isInput) return;
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'z') {
      ev.preventDefault();
      ev.shiftKey ? redo() : undo();
    }
  }
</script>

<svelte:window on:keydown={onKey} />

<div class="app">
  <Sidebar />
  <main>
    <Canvas />
    <Hud />
  </main>
</div>

<style>
  :global(html, body) {
    margin: 0; padding: 0; height: 100%; overflow: hidden;
    font-family: Inter, Helvetica, Arial, sans-serif;
    background: #faf8f3; color: #1a1a1a;
  }
  :global(*) { box-sizing: border-box; }
  .app { display: flex; height: 100vh; }
  main { flex: 1; position: relative; }
</style>
