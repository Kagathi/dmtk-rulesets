# D&D 5e (basic)

## 1.19.0

- **A creature now carries hit points.** The NPC template declares an `hp` field, so importing
  a person or a stat block reads the HP out of it and a creature added to the combat tracker
  arrives with its hit points instead of zero. Monsters are unaffected — they have always kept
  HP as a real pool, and the app leaves the duplicate off their editor.
- Additive: nothing on an existing sheet moves, and a creature whose HP you typed by hand keeps
  what you typed.

## 1.18.0

- Declares its creature stat-block **presentation** (`statblock5e`) and the layout behind
  it, so the classic block is something this ruleset asks for rather than something the app
  hardcodes for D&D. Non-D&D rulesets get a presentation that suits them instead of a name over
  six em-dashes.
- The ability modifier now comes from this profile's own declared formula rather than from
  arithmetic inside the app, so there is one owner for it.

## 1.17.0

- **Ships a DM Screen**, so a new D&D campaign opens the screen already laid out instead of
  offering an empty canvas. It's built from a real one: three reference panels the width of
  a cardboard screen — the conditions, what you can do in combat, and the adventuring tables
  (DCs, skills by ability, light, travel pace) — filled from the SRD reference cards the app
  already installs. Under them sits the row paper can't do: live initiative, the party at a
  glance, and a scratchpad. Every panel is editable, and a DM who has already arranged their
  own screen keeps it untouched — the suggestion only ever seeds an empty one.

## 1.16.0

- **Ships D&D's own stat-block vocabulary**, so importing a creature from an SRD-shaped book
  reads its hit points, AC and speed without anyone teaching the app what those words mean
  first. Hit points arrive as a real pool, ready for the combat tracker. The rest of the block
  — the ability rows, senses, languages, traits and actions — comes through as the creature's
  description, unchanged. Additive: nothing on an existing sheet moves, and a DM who has
  already taught their own mapping keeps it, because their answer always wins over the
  ruleset's.

## 1.15.0

- The Weapons table gained **Cost** and **Weight** columns, so the SRD's own weapons table
  imports without losing two of its four columns. Text rather than numbers, because the book
  writes "1 sp" and "2 lb." — the units are part of the value. Additive: existing weapon rows
  simply have those cells empty.

## 1.14.0

- The Weapons table and Inventory are now **item targets**: a catalog item can be added straight
  into them, with its values landing in the right columns. Additive declaration only — no
  mechanics changed, and nothing on an existing sheet moves.

## 1.13.0

- Armor Class is now surfaced as an encounter defense stat, so it shows at a glance on the DM's
  combat-tracker rows and stat panels. Additive display hint only — no mechanics changed.

## 1.12.0

- All twelve SRD classes' signature trackers now live on the sheet, revealed by the Class field
  (Rage, Bardic Inspiration, Channel Divinity, Wild Shape, Sneak Attack, Pact slots, and the rest);
  multiclassing shows both.
- NPC/monster stat-block template: size/type/alignment/speed, saving throws, skills, damage
  resistances/immunities/vulnerabilities, condition immunities, senses, languages, and sectioned
  Traits / Actions / Bonus Actions / Reactions / Legendary Actions — the shape the bundled SRD
  bestiary (see the `dnd5e-srd-content` package) fills in.
- Identity fields (race/class/background/gender/age/alignment), a derived Proficiency Bonus, and
  Death Save success/failure trackers.
- Full 15-condition list and XP-based advancement + reward tracking.

## 1.7.2

- Initial registry publication.
