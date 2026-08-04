# dmtk-rulesets

The official + community content library for **DM Toolkit** — rulesets, add-ons, and
content packages the app installs from when a DM clicks **Browse online library**.

That browse action is the app's only outbound call, and it works the way you'd hope:
**explicit** (only when you click), **read-only** (a GET of public files), and **silent
about you** (nothing about your install, campaign, or machine is sent). Offline, the app
just says so; everything else keeps working.

## What's in here

| Path | What it is |
|---|---|
| `index.json` | The manifest — the one file the app fetches first |
| `rulesets/<id>/<id>-<version>.dmtk` | Rulesets and add-ons (extensions), versioned |
| `content/<id>/<id>-<version>.dmtk` | Content packages (creatures, reference cards) for a ruleset |
| `rulesets/<id>/CHANGELOG.md`, `content/<id>/CHANGELOG.md` | Per-package change notes, one section per version |
| `tools/validate.mjs` | The CI validator (structure, naming, JSON-only, license presence) |

Three kinds appear in the index: **`ruleset`** (a complete game system's sheet + starter
packs), **`extension`** (an add-on that layers onto a base ruleset — it names its base and
minimum base version), and **`content`** (creatures + reference cards for an existing
ruleset — it names its `profileId` and `minProfileVersion`).

## Using it

Easiest: in DM Toolkit, open **Ruleset Profiles → Browse online library** and click
Install. Manual: download any `.dmtk` from this repo and import it in the app — both paths
run the exact same validation and license checks.

## The rules of the road

- **Published files are immutable.** A new version is a new file; nothing published is ever
  overwritten or deleted. The index points at the latest; old versions stay for
  reproducibility. The app never downgrades an install.
- **Data only, never code.** A `.dmtk` is JSON (plus the zip around it). No HTML, no
  scripts, no stylesheets. The app renders everything through its own trusted UI — a
  malicious package has nothing to execute. CI enforces this; the app validates again at
  install.
- **Licensing is the hard gate.** Game *mechanics* aren't copyrightable — a ruleset's sheet
  definition carries no protected text and needs no license. Rules *text* (card bodies,
  creature descriptions) appears here only under an open license (CC-BY, ORC, OGL, …) with
  its **exact attribution carried verbatim** inside the package and shown in the app. For
  closed content the library uses **pointer cards** — title + book + page; the card finds
  the rule, your book delivers it. Game-system names are used nominatively ("compatible
  with…"); trademarks and logos stay with their owners.
- **Personal-use content never lands here.** DM Toolkit lets a DM import their own
  purchased books for private table use; the app refuses to export that content, and this
  repo refuses it too. If you didn't author it and it isn't openly licensed, it doesn't
  belong in the library.

## Contributing

Community submissions are **open** (since DM Toolkit v0.8.0, "The Community Door"). The
process, the checklist, and what reviewers look for are in [CONTRIBUTING.md](CONTRIBUTING.md).
In the app: **Rulesets → Submit…** runs the same checks reviewers will and hands you a
ready-to-submit file.

---

*DM Toolkit is local-first tabletop software: your campaign lives on your machine.
This library exists so the good stuff can travel anyway — carried by licenses, not leaks.*
