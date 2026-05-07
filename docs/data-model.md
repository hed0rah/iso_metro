# Data model

The whole editor state serializes to a single `MapData` JSON. Round-trip
this through save/load and you get the same map back, byte-for-byte.

```jsonc
{
  "planes": [
    { "name": "Surface",   "z": 0   },
    { "name": "Mid Level", "z": 210 },
    { "name": "Sky Lines", "z": 420 }
  ],
  "lines": [
    {
      "id": "vco",
      "name": "VCO",
      "color": "#d62828",
      "waypoints": [
        { "gx": -7, "gy": -4, "plane": 0 },
        { "gx":  6, "gy": -4, "plane": 0 }
      ]
    }
  ],
  "stations": [
    {
      "id": "vco_west",
      "gx": -7, "gy": -4, "plane": 0,
      "name": "VCO West",
      "kind": "terminal"
    }
  ],
  "lifts": [
    {
      "a": { "gx": 3, "gy": -4, "plane": 0 },
      "b": { "gx": 2, "gy": -2, "plane": 1 }
    }
  ]
}
```

## Constraints

- `planes[i].z` should increase monotonically. The renderer assumes
  index order matches stack order.
- `waypoint.plane` is an integer index into `planes[]`. Cross-plane
  segments inside a single line's `waypoints` are not currently
  supported; use a `lift` instead.
- `gx, gy` are integers for octolinear-clean rendering. Fractions are
  legal but corridor detection will not match.
- `line.id`, `station.id` are arbitrary strings, must be unique within
  their list.
- `line.color` is any CSS color string the SVG renderer can pass
  through. The exporter will also generate a `--line-{id}` CSS variable.
- Auto-subdivide will insert breakpoints in `line.waypoints`. Saved
  JSON typically reflects the post-subdivide state. Loading is
  idempotent.

## Versioning

There is no schema version field today. When the schema first changes,
add `"version": 1` at the top level and a migration in
`core/io.ts` (to be created).
