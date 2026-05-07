# Architecture

## Layers

```
┌──────────────────────────────────────────────────┐
│ editor/   svelte components, dom, canvas, input  │
├──────────────────────────────────────────────────┤
│ commands/  Command interface, undo/redo stack    │
├──────────────────────────────────────────────────┤
│ stores.ts  svelte stores: data, mode, selection  │
├──────────────────────────────────────────────────┤
│ core/     pure ts algorithms, no DOM deps        │
└──────────────────────────────────────────────────┘
```

`core/` knows nothing about Svelte or the DOM. It can be tested in
isolation, run in a worker, ported to Rust, etc. Everything above can
import freely from `core/` but never the other way.

## Data model

The map is a single `MapData` object:

```ts
interface MapData {
  planes: Plane[];        // stacked horizontal layers
  lines: Line[];          // routes; each has waypoints in order
  stations: Station[];    // optional named markers with kind
  lifts: Lift[];          // inter-plane connectors
}
```

`Waypoint = { gx, gy, plane }` are integer grid coordinates inside a
plane. `gx, gy` are user-space; `plane` is an index into `planes[]`.
World position is computed by the projection in `core/projection.ts`.

Stations are a separate list from line waypoints. A station at
`(gx, gy, plane)` is rendered if any line's waypoint is at the same
coordinate. The `Station` record carries the display name and kind
(terminal, interchange, regular, bend).

Lifts are pairs of waypoints on different planes, rendered as dashed
gray connectors.

## Projection

Isometric, 30 degrees, screen y points down:

```
i hat = ( cos30,  sin30)    east in plane
j hat = (-cos30,  sin30)    north in plane (toward upper left)
k hat = (     0,    -1)    rise between planes

screen.x = (gx - gy) * grid * cos30
screen.y = (gx + gy) * grid * sin30 - plane * planeGap
```

Default `grid = 46` and `planeGap = 210` (pixels). Both are configurable
via the `ProjectionConfig` parameter on every projection function.

## Corridors

Two lines that traverse the same plane edge form a shared corridor.
`buildCorridors()` walks every line's adjacent waypoint pairs,
canonicalizes each edge by sorting its endpoints, and produces a map
from `EdgeKey` to a `Corridor` (plane, p1, p2, lineIds[]).

Each line in a corridor is assigned a slot index `0..n-1`. The line is
rendered offset perpendicular to the corridor by
`(slot - (n-1)/2) * TRACK_SPACING` grid units. Waypoint offsets are
computed as the average of incident edges' offsets so transitions look
smooth.

## Octolinear constraint

Inside a plane, segments are restricted to one of eight unit directions:
horizontal, vertical, and the four 45-degree diagonals. The `direction()`
function returns `[dx, dy]` for legal segments and `null` otherwise.

Auto-subdivide walks every pair of edges, tests collinearity using a
cross-product zero check, and inserts breakpoints at every other line's
waypoint that falls strictly inside an existing segment. This means the
LINES table can be authored sparsely (terminus to terminus), and shared
corridors will be detected automatically.

## Stadium interchanges

When an interchange station sits at the endpoint of a shared corridor
(2+ lines), the marker is rendered as a horizontally-rotated pill
(stadium) spanning the parallel tracks, with one black dot per track
inside it. The pill axis is perpendicular to the dominant corridor.
`stadiumForStation()` returns null when a single circle is the right
marker.

## Label placement

Greedy candidate-based: each station tries 24 candidate offsets (8
directions, 3 radii) and picks the lowest-penalty position. Penalties
are 100 per overlap with another label box, 50 per overlap with a
foreign station marker, and 30 per intersection with a transit line
segment. After greedy placement, an annealing-like swap pass tries
moving each station's label to alternative positions and accepts trades
that lower total penalty.

Liang-Barsky parametric clipping for segment-rectangle intersection.

## Editor flow

User gesture → command → `exec()` → mutation on `mapData` store →
reactive re-render. Undo/redo is a stack of commands. No mutation should
happen outside a command, otherwise undo will get out of sync.

## SVG export

Runs all of the above on the current `MapData` and emits a self-contained
SVG with a `<defs><style>` block of CSS variables for theming. The
output should be byte-identical to what `reference/transit_map.py`
produces (up to formatting differences) given the same input JSON.
