# Authoring for DM Toolkit — what a package can say

This is the vocabulary: everything a `.dmtk` package can declare, and what each piece does
in the app. [README.md](README.md) covers what this library is and its rules of the road;
[CONTRIBUTING.md](CONTRIBUTING.md) covers how to submit. Read this one when you're deciding
*what to build*.

## One package, one job

A `.dmtk` holds exactly one of two things:

- **`profile.json`** — a **ruleset** (a complete system's sheet and system facts) or an
  **extension** (an add-on that layers onto a base ruleset). Mechanics only: a profile
  never carries rule text, card text, or setting material.
- **`content.json`** — a **content package**: reference cards, creatures, and items *for*
  an existing ruleset. This is where text lives, and where licensing matters.

They're split because they change on different clocks: a profile bump changes the sheet,
a content bump changes cards and creatures. A content package names the profile it's for
and the minimum profile version it needs — the app refuses to install content over a
profile too old to hold it.

## What a ruleset profile can declare

**Identity** — `schemaVersion` (always `1`), `id`, `name`, `version`, and an optional
`family` (e.g. `gurps`, `dnd5e`). Family groups related rulesets so tools with a profile
affinity apply — the GCS character importer, for instance, only offers itself on
`gurps`-family campaigns.

**The character sheet** — the heart of a profile:

- **`attributes`** — the sheet's fields, each one of six types: `number`, `text`,
  `derived` (computed by an arithmetic `formula` over other numeric attributes — ability
  modifiers, encumbrance), `list` (free strings — inventory lines, features), `table`
  (a structured list with typed `columns` — GURPS equipment, a spellbook), or `roster`
  (fixed rows each carrying a base+bonus formula, with an optional level ladder — saving
  throws, skills). Display hints are declared, not inferred: `format: 'signed'` renders
  +3/−1, `multiline` makes a textarea, `display: 'grid'` lays roster rows in columns.
- **`resources`** — the pools with +/− steppers: `key`, `label`, `hasMax`, the stepper
  `steps`, an optional `maxFormula` (a computed max: GURPS HP max = ST), an optional
  `floor` (D&D HP stops at 0; omit it and the pool runs negative), and an optional `unit`
  suffix ("1333 cr").
- **`layout`** — the tree that arranges attributes into the sheet players see: sections,
  rows, boxes, `statblock`/`statline` displays, `hideWhenEmpty`, conditional `showWhen`.

**Creatures** — `npcTemplate`: which attribute keys a creature's stat block carries, an
optional `layout` (the same tree the sheet uses, same meanings), and an optional
`presentation` naming which block style draws it — `plain` (correct for any system),
a built-in like `statblock5e`, or an installed `.dmtkblock`. Absent means `plain`; the app
never guesses a system's look from its shape.

**System facts** — things the app would otherwise wrongly assume:

- **`turnOrder`** — `'initiative'` (an order, rounds, the classic tracker) or `'free'`
  (no turn order exists in this system; the tracker hides its initiative column and round
  counter rather than asserting facts the system doesn't have). Absent means
  `'initiative'`. Declared, never inferred. *Requires DM Toolkit v1.0.0 or newer.*
- **`initiativeHint`** — an attribute key that prefills a PC's initiative in the tracker
  (GURPS `basicSpeed`). A convenience, not a rule; the DM can always edit the value.
- **`conditions`** — the status conditions the system defines, offered wherever statuses
  are set.
- **`gmPools`** — resources the *GM* holds at campaign level, not a character: `key`,
  `label`, optional `max`, optional `start`, optional `startPerPc` (added per player
  character — in Daggerheart™ Compatible play, the GM starts with 1 Fear per PC).
  Surfaced on the DM Screen and the
  encounter window; the count persists across sessions. *Requires v1.0.0 or newer.*
- **`advancement`** — named advancement tracks (XP, character points) DM grants accrue to.
- **`rewards`** — where loot lands: the `inventory` attribute items append to, and which
  resource keys currency grants may target.

**Import vocabulary** — `importHints`: per-ruleset hints that help the app's book importer
read this system's stat blocks and section labels.

**The look** (all optional): `suggestedTheme` points at a built-in theme by id; `theme`
ships a complete look (design-token `vars` validated by the app's look contract — token
allowlist, hex-only colors, **no `url()` anywhere** — plus a texture and frame from the
app's own rosters, and an optional license for the look itself); `suggestedDmScreen` seeds
a campaign's DM Screen on first open, after which the DM's own arrangement wins. A look is
inert data the app validates and renders through its own UI — it cannot fetch and cannot
execute.

**Extensions** — a profile with `extends: { profileId, minVersion }` is an add-on, not a
standalone system. It contributes **additions only** — attributes, resources, conditions,
advancement tracks, layout sections, extra creature fields, and its own currencies (a
setting book brings its own money). It may **not** declare the base-only fields, because
an add-on layered on a system doesn't change what that system *is*: `turnOrder`,
`gmPools`, `initiativeHint`, `rewards.inventory`, `suggestedTheme`, `theme`,
`suggestedDmScreen`, `importHints`, and the creature template's attribute set all belong
to the base. The app merges an enabled extension onto its base to form a campaign's
effective profile, and validates cross-references at merge time.

## What a content package can carry

- **The manifest** (`content.json`) — `id`, `version`, `profileId`,
  `minProfileVersion`. The version gate has teeth: creatures fill the profile's template
  fields and reference its resource keys, so the app refuses the install against an older
  profile rather than filing creatures into a sheet with no home for them.
- **The license** — package-level, covering everything inside; there are no per-card or
  per-creature licenses. Required for any text (see the license bar in CONTRIBUTING.md).
- **Reference packs** — named packs of cards. A card is a `title`, an optional Markdown
  `body`, an optional one-line `summary`, and an optional `source` citation
  (book/page/section). A **pointer card** is one with no body — title + citation + your
  own one-line summary; it finds the rule, the reader's book delivers it. Conditions,
  actions, rules and spells are all just cards.
- **Creatures** (`monsters/*.json`) — each a stable `slug` (reinstalls land on the same
  row), `name`, `data` filling the target profile's creature template, `pools` (current
  and optional max), filter `tags`, and an optional `loot` table (what falls off it).
- **Items** (`items/*.json`) — catalog rows: `slug`, `name`, multi-target `targets`
  (attribute key → what the item puts there; a dagger has weapon stats *and* an inventory
  one-liner), `tags`, and a one-line `summary`. The same shape the app's item picker,
  shops and loot tables use — an item you author is immediately stockable and droppable.

## Semantics worth knowing before you version anything

- **The package is the unit of versioning.** One `version` governs everything inside; to
  fix one card, you publish the next version of the package.
- **Published versions are immutable** — a new version is a new file, and the app
  **never downgrades**: if a user has 1.3.0 installed, nothing older ever overwrites it,
  from any install path.
- **Validation refuses whole.** A package that fails any check is rejected entirely, with
  a stated reason — the app never strips the bad part and installs the rest. Fix the
  package and re-pack; what a user installs is exactly what you published.
- **The app is the schema authority.** This repo's CI checks structure, naming and
  licensing; the full schema runs in the app at install. Test-install your package
  against its declared minimum versions before submitting — it's the same validation
  your users will hit.

## Cover art (app 1.0.0+)

A ruleset can wear a cover on the DM's shelf and in the library. It is optional; without one,
the app shows an initialed tile in the table's colours.

- **Inside the package:** `cover.webp` (or `cover.png` / `cover.jpg`) at the zip root, plus
  `cover.json`:
  ```json
  { "credit": "Banner art: Your Name", "license": "CC-BY-4.0" }
  ```
  `credit` is required — art is credited. `license` is the ART's license, when it has one.
- **Its own credit, never the content's license.** `license.json` speaks for the game content;
  a cover is art, and its `cover.json` says who made it. The library shows that line.
- **Caps:** WebP, PNG or JPEG, at most **256 KB**, about **1200×600** (the card-banner ratio).
  The app refuses the whole install of a package whose cover breaks these, with the reason.
- **Beside the package:** the same picture as `<id>-<version>.cover.webp` next to the `.dmtk`
  (WebP only, because of the name), and `"hasCover": true` with `"coverCredit"` on the index
  entry. The library fetches it only when a DM is browsing.
- **Never the game's marks.** No logos, trade dress or book art from the game a package plays —
  for a Compatible-play package that is DPCGL §2.5/§6.4 territory, and it is true of every closed
  system. Use your own art.
- **A new cover is a new version.** Published files never change, pictures included: a cover-only
  change is a patch bump with a one-line changelog ("new cover art").
- A DM can set their own cover on an installed ruleset. It stays on their install, survives your
  updates, and never leaves in an export — so you never need to worry about overwriting it.

## Worlds (app 1.1.0+)

A world is a whole setting: pages, people, places, maps and images, a calendar. It's authored
in the app and published as the `.dmtkworld` the app exports. Worlds live in their own index,
`worlds.json`, beside `index.json` and never inside it: every installed app reads `index.json`
with a strict list of package kinds, and a world entry there would break the library for all of
them.

**To publish one:**

1. In the app, fill in the world's card on **World settings**: summary, genre and flavor,
   author, license and its credit line, and content notes if any.
2. **Export world file…** from the same page.
3. In this repo: `node tools/pack-world.mjs <the file> --id <id> --version <x.y.z>`
   (add `--official` for DM Toolkit's own; `--cover cover.webp --cover-credit "Name"` for cover
   art; `--changelog "what's in this edition"`). The pack checks the file, copies it to
   `worlds/<id>/<id>-<version>.dmtkworld`, writes its entry into `worlds.json` **from the file's
   own manifest**, and adds the version's section to `worlds/<id>/CHANGELOG.md`.
4. `node tools/validate.mjs`.

**Never hand-edit a world's entry.** The validator compares every entry with its file's manifest
and fails on any difference. To change a card, change it in the app, export, and pack a new
version.

**What a registry world must be:** at most 25 MB; images only (WebP, PNG or JPEG) beside its
JSON; a license declared; a genre from the app's list (fantasy, sci-fi, horror, modern,
historical, post-apocalyptic, superhero, other) or none; and nothing marked Personal use inside
it. The license bar covers the prose **and** the art, and a world must be original: no published
setting's names or maps.

**Versions are immutable, and they tell DMs what changed:** patch = prose fixes, minor = new
content, major = restructuring. A DM who has the world is offered the update and keeps every
change they made to it.

**Testing before you publish:** in the app, Settings → About → **For authors** → **Library
source** → **Use a folder…**, and pick your copy of this repo. The library reads from it, with a
banner saying so, until you switch back.

## What can't be authored in a package

Rule text in a profile (that's a content package's job) · sheet changes in a content
package (that's a profile bump) · executable anything — no HTML, scripts, or styles
beyond the token contract · external URLs of any kind · a look that fetches · any image other
than the one cover at the zip root.

---

*If the system you're authoring needs something this vocabulary can't say — a resource
the GM holds, a turn structure, a sheet shape — that's worth an issue rather than a
workaround. Both `turnOrder` and `gmPools` exist because one system couldn't be said
honestly without them.*
