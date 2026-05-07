# iso-metro

An isometric octolinear transit map editor in the style of Maxwell Roberts.
Stacked plane geometry, parallel corridor offsets, stadium interchange
markers, terminus tabs, automatic label collision avoidance, and CSS-themed
SVG export.

This repo is in early scaffolding. The algorithmic core is complete and
typed. The browser-based editor has a starter shell that boots, loads a
fixture, and accepts simple draw input. The hard work of a proper editor
(real undo/redo coverage, multi-select, drag handles, robust hit testing)
is the open scope.

## Stack

- TypeScript with strict mode for everything algorithmic
- Svelte 4 for the UI shell
- Konva.js for canvas-based scene management (planned, currently using
  raw 2D canvas as a placeholder)
- Vite for dev/build
- Vitest for tests

## Repo layout

```
iso_metro/
├── core/             # pure typescript algorithms, no DOM deps
│   ├── types.ts      # data model
│   ├── projection.ts # iso projection math
│   ├── octolinear.ts # 8-direction snap, collinearity
│   ├── corridors.ts  # shared edge detection, parallel offsets
│   ├── autosubdivide.ts
│   ├── stadium.ts    # interchange pill geometry
│   ├── layout.ts     # label placement
│   └── export-svg.ts # full SVG renderer
├── editor/           # svelte UI shell
│   ├── App.svelte
│   ├── Canvas.svelte
│   ├── Sidebar.svelte
│   ├── Hud.svelte
│   ├── stores.ts
│   └── commands/
├── fixtures/         # reference JSON snapshots used as test data
├── reference/        # working artifacts the new dev can diff against
│   ├── transit_map.py    # python reference renderer (the spec)
│   ├── transit_map.svg   # expected output
│   └── iso_editor.html   # standalone MVP editor (one file)
└── docs/
    ├── architecture.md
    └── handoff.md
```

## Setup

```
npm install
npm run dev
```

Visit http://localhost:5173.

## Architecture in one paragraph

Everything algorithmic lives in `core/` as pure TypeScript with no DOM
dependencies. Editor state is Svelte stores. Mutations flow through
`Command` objects with `do()`, `undo()`, `redo()`. Rendering watches the
data store and rebuilds. SVG export runs the same projection math the
Python reference uses, so the JSON files are interchangeable: you can
edit in the browser, save JSON, and feed it back into the Python script
if you want CSS theming, advanced label placement, or terminus tabs that
are not yet ported to TypeScript. The project is set up to converge on
TypeScript-only over time.

## Reference renderer

`reference/transit_map.py` is the original Python generator and the
authoritative spec. If TypeScript output diverges from Python output for
the same input JSON, Python is correct. The reference SVG in the same
folder is what the Python script produces from `fixtures/synth_city.json`
(approximately; check before relying on it).

`reference/iso_editor.html` is a single-file MVP editor in vanilla JS
plus Three.js, useful as a behavioral reference for what interactions
should feel like.

## Status

What works in the scaffolding:

- All algorithms in `core/` typecheck under strict mode and match the
  Python reference (corridor detection, parallel offsets, octolinear
  snap, autosubdivide, stadium geometry, label placement, SVG export).
- `editor/` boots, loads `fixtures/synth_city.json`, and renders a
  flat 2D iso projection on a raw canvas.
- Draw mode adds waypoints to the active line with octolinear snap.
- Save/load JSON and export SVG work.

What is stubbed:

- Bend, move, delete, lift modes (commands exist for waypoint mutation
  but UI hooks are placeholders).
- The placeholder canvas needs to become a Konva-based scene with real
  hit testing, drag handles, and layer management.
- No tests yet. `npm test` exists but the suite is empty.
- No persistence beyond manual save.

See `docs/handoff.md` for the prioritized next-steps list.

## License

MIT. See `LICENSE`.
