<script lang="ts">
  import { mapData, mode, activePlane, activeLineId, type EditorMode } from './stores';
  import { exportSvg } from '$core/index';

  const modes: EditorMode[] = ['draw', 'bend', 'move', 'delete', 'lift'];
  const palette = [
    '#d62828','#1565c0','#2e7d32','#5d4037','#f9a825',
    '#c2185b','#00838f','#37474f','#6a1b9a','#ef6c00','#558b2f',
  ];

  function newLine() {
    mapData.update(d => {
      const id = 'l' + Date.now().toString(36);
      const used = new Set(d.lines.map(l => l.color));
      const color = palette.find(c => !used.has(c)) ?? palette[d.lines.length % palette.length];
      d.lines = [...d.lines, { id, name: 'NEW', color, waypoints: [] }];
      return d;
    });
  }

  function downloadSvg() {
    const svg = exportSvg($mapData, { title: 'Untitled', subtitle: 'iso-metro' });
    download('transit_map.svg', svg, 'image/svg+xml');
  }

  function downloadJson() {
    download('transit_map.json', JSON.stringify($mapData, null, 2), 'application/json');
  }

  function loadJson(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    f.text().then(t => {
      try { mapData.set(JSON.parse(t)); }
      catch (e) { alert('bad json: ' + (e as Error).message); }
    });
  }

  function download(name: string, body: string, type: string) {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
</script>

<aside>
  <h1>iso metro</h1>

  <h2>mode</h2>
  <div class="row">
    {#each modes as m}
      <button class:active={$mode === m} on:click={() => mode.set(m)}>{m}</button>
    {/each}
  </div>

  <h2>plane</h2>
  <div class="row">
    {#each $mapData.planes as p, i}
      <button class:active={$activePlane === i} on:click={() => activePlane.set(i)}>
        {i + 1}: {p.name}
      </button>
    {/each}
  </div>

  <h2>lines</h2>
  <div class="lines">
    {#each $mapData.lines as ln (ln.id)}
      <div class="line-item" class:active={$activeLineId === ln.id}
           style="border-left-color: {ln.color}"
           on:click={() => activeLineId.set(ln.id)}>
        <span class="swatch" style="background: {ln.color}" />
        <input bind:value={ln.name} />
      </div>
    {/each}
  </div>
  <button on:click={newLine}>+ new line</button>

  <h2>file</h2>
  <button on:click={downloadSvg}>export svg</button>
  <button on:click={downloadJson}>save json</button>
  <label class="file-btn">load json
    <input type="file" accept=".json" on:change={loadJson} />
  </label>
</aside>

<style>
  aside { width: 280px; padding: 14px; background: #f0eadf;
    border-right: 1px solid #cdbf9c; overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
  h1 { font-size: 16px; font-weight: 600; margin: 0; }
  h2 { font-size: 11px; font-weight: 600; letter-spacing: 1.4px;
    text-transform: uppercase; color: #6e5d36; margin: 8px 0 4px; }
  button, .file-btn { background: #fff; border: 1px solid #cdbf9c;
    padding: 6px 10px; cursor: pointer; font: inherit; border-radius: 4px;
    text-align: center; }
  button:hover, .file-btn:hover { background: #ece5d6; }
  button.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; }
  .row button { flex: 1; }
  .lines { display: flex; flex-direction: column; gap: 4px; }
  .line-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px;
    background: #fff; border: 1px solid #cdbf9c; border-radius: 4px;
    cursor: pointer; border-left-width: 4px; font-size: 12px; }
  .line-item.active { background: #1a1a1a; color: #fff; }
  .line-item input { flex: 1; background: transparent; border: none;
    font: inherit; color: inherit; }
  .swatch { width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid #1a1a1a; flex-shrink: 0; }
  .file-btn input { display: none; }
</style>
