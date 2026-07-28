# dmtk-rulesets

The official + community ruleset library for **DM Toolkit**. The app fetches
`index.json` from this repo's `main` branch when a DM clicks *Browse online
library* — the app's only outbound call: explicit, read-only, nothing sent.

- `index.json` — the manifest (the only file the app fetches first)
- `rulesets/<id>/<id>-<version>.dmtk` — versioned, **immutable** (a new version
  is a new file; never overwrite a published one)
- `rulesets/<id>/CHANGELOG.md` — per-ruleset change notes, one section per version
- `tools/validate.mjs` — CI validator (structural + JSON-only + license + naming)

Content is **mechanics + citations only**: no copyrighted rule text without an
open license carried verbatim; game-system names used nominatively ("compatible
with…"); pointer cards for closed content.
