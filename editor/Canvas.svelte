<script lang="ts">
  import { onMount } from 'svelte';
  import { mapData, mode, activePlane, activeLineId, hoverCell } from './stores';
  import { project, DEFAULT_PROJECTION, octolinearSnap } from '$core/index';
  import { exec } from './commands';
  import { addWaypoint } from './commands/waypoint';
  import type { Waypoint } from '$core/index';

  // simple html5 canvas renderer to get the editor walking on its own.
  // a follow-on PR should swap this for konva to get real layer
  // management, drag handles, and hit tests.

  let canvas: HTMLCanvasElement;
  let zoom = 1;
  let panX = 0, panY = 0;

  $: cfg = DEFAULT_PROJECTION;

  function toScreen(gx: number, gy: number, plane: number) {
    const p = project(gx, gy, plane, cfg);
    return [p.x * zoom + panX + canvas.width / 2,
            p.y * zoom + panY + canvas.height / 2];
  }

  function fromScreen(sx: number, sy: number, plane: number): Waypoint {
    // invert the projection. solve for (gx, gy) given screen coords on plane.
    const x = (sx - panX - canvas.width / 2) / zoom;
    const y = (sy - panY - canvas.height / 2) / zoom + plane * cfg.planeGap;
    // x = (gx - gy) * G * cos30, y = (gx + gy) * G * sin30
    const C = cfg.grid * Math.cos(Math.PI / 6);
    const S = cfg.grid * Math.sin(Math.PI / 6);
    const gx = (x / C + y / S) / 2;
    const gy = (y / S - x / C) / 2;
    return { gx: Math.round(gx), gy: Math.round(gy), plane };
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#faf8f3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // planes
    $mapData.planes.forEach((pl, i) => {
      const corners = [[-9, -6], [9, -6], [9, 7], [-9, 7]];
      ctx.beginPath();
      corners.forEach(([gx, gy], k) => {
        const [x, y] = toScreen(gx, gy, i);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = ['#f0eadf', '#ece5d6', '#e8e0cd'][i % 3] ?? '#e8e0cd';
      ctx.globalAlpha = i === $activePlane ? 0.8 : 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#cdbf9c';
      ctx.stroke();
    });

    // lines
    for (const ln of $mapData.lines) {
      if (ln.waypoints.length < 2) continue;
      ctx.beginPath();
      ln.waypoints.forEach((wp, i) => {
        const [x, y] = toScreen(wp.gx, wp.gy, wp.plane);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineWidth = 6 * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = ln.color;
      ctx.stroke();
    }

    // station dots at every waypoint
    const seen = new Set<string>();
    for (const ln of $mapData.lines) for (const wp of ln.waypoints) {
      const k = `${wp.gx},${wp.gy},${wp.plane}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const [x, y] = toScreen(wp.gx, wp.gy, wp.plane);
      ctx.beginPath();
      ctx.arc(x, y, 5 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 1.6 * zoom;
      ctx.strokeStyle = '#111';
      ctx.stroke();
    }

    // hover ghost
    if ($hoverCell && $mode === 'draw') {
      const [x, y] = toScreen($hoverCell.gx, $hoverCell.gy, $hoverCell.plane);
      ctx.beginPath();
      ctx.arc(x, y, 7 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();
    }
  }

  function resize() {
    if (!canvas) return;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    canvas.getContext('2d')!.scale(devicePixelRatio, devicePixelRatio);
    draw();
  }

  function onWheel(ev: WheelEvent) {
    ev.preventDefault();
    zoom = Math.max(0.3, Math.min(4, zoom * (1 - ev.deltaY * 0.001)));
    draw();
  }

  let panning = false;
  let lastX = 0, lastY = 0;
  function onMouseDown(ev: MouseEvent) {
    if (ev.button === 1 || ev.shiftKey) { panning = true; lastX = ev.clientX; lastY = ev.clientY; return; }
    if ($mode === 'draw') {
      const wp = fromScreen(ev.offsetX * devicePixelRatio, ev.offsetY * devicePixelRatio, $activePlane);
      const ln = $mapData.lines.find(l => l.id === $activeLineId);
      if (!ln) return;
      let target: Waypoint = wp;
      const last = [...ln.waypoints].reverse().find(w => w.plane === $activePlane);
      if (last && !ev.shiftKey) target = octolinearSnap(last, wp);
      exec(addWaypoint(ln.id, target));
    }
  }
  function onMouseMove(ev: MouseEvent) {
    if (panning) {
      panX += (ev.clientX - lastX) * devicePixelRatio;
      panY += (ev.clientY - lastY) * devicePixelRatio;
      lastX = ev.clientX; lastY = ev.clientY;
      draw();
      return;
    }
    hoverCell.set(fromScreen(ev.offsetX * devicePixelRatio, ev.offsetY * devicePixelRatio, $activePlane));
  }
  function onMouseUp() { panning = false; }

  $: if (canvas && $mapData) draw();

  onMount(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  });
</script>

<canvas bind:this={canvas}
        on:wheel={onWheel}
        on:mousedown={onMouseDown}
        on:mousemove={onMouseMove}
        on:mouseup={onMouseUp} />

<style>
  canvas { width: 100%; height: 100%; display: block; cursor: crosshair; }
</style>
