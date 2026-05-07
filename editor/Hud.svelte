<script lang="ts">
  import { mode, activePlane, activeLineId, hoverCell, mapData, liftPending } from './stores';
  $: line = $mapData.lines.find(l => l.id === $activeLineId);
  $: planeName = $mapData.planes[$activePlane]?.name ?? '?';
</script>

<div class="hud">
  mode <b>{$mode}</b> &middot; plane <b>{planeName}</b><br>
  {#if line}
    line <b style="color: {line.color}">{line.name}</b>
    &middot; {line.waypoints.length} wps<br>
  {/if}
  {#if $mode === 'lift' && $liftPending}
    pick second station on a different plane<br>
  {/if}
  {#if $hoverCell}
    cell {$hoverCell.gx}, {$hoverCell.gy}
  {/if}
</div>

<style>
  .hud { position: absolute; top: 14px; right: 14px;
    background: rgba(255,255,255,0.85); padding: 8px 12px; border-radius: 6px;
    font-size: 11px; line-height: 1.6; border: 1px solid #cdbf9c;
    pointer-events: none; }
</style>
