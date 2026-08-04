# Contributing to dmtk-rulesets

> **Status: OPEN** — community submissions are accepted (since DM Toolkit v0.8.0). Tip:
> the app's **Rulesets → Submit…** runs these checks locally and produces a ready-to-submit
> file; note the app's import tools are currently labeled *alpha*, so give anything they
> produced one extra proofread before submitting.

Thanks for wanting to share your table's work. The short version: **export it from the
app, check the license twice, open a PR with the template.** Everything below is detail.

## What can be submitted

- **A ruleset** — your favorite system's sheet, built in DM Toolkit's editor. Mechanics
  aren't copyrightable, so a sheet definition is always shareable — even for a closed,
  commercial game. (This is the most valuable thing you can contribute: a good profile plus
  "import your own book" is a complete experience for every owner of that game.)
- **An extension (add-on)** — optional rules layered onto a base ruleset (a setting book,
  a martial-arts module, your homebrew subsystem). Must name its base and minimum base
  version.
- **A content package** — creatures and/or reference cards for an existing ruleset. This is
  where licensing matters most, because it carries *text*.

## The license bar (the part reviewers are strictest about)

1. **Text requires an open license.** Card bodies and creature text are accepted only under
   a license that permits redistribution (CC-BY family, ORC, OGL 1.0a, CC0, …), with the
   license identified in the package and the **attribution text exact and verbatim** —
   the app displays it wherever the content appears.
2. **You assert the license; a human checks it.** The PR template asks you to affirm, in
   your own name, that the license permits this redistribution. Review verifies the claim
   against the source before merge — that check *is* the gate, and it's why review may take
   a few days for large text packages.
3. **No personal-use content, ever.** DM Toolkit's importer lets you use your purchased
   books privately; the app refuses to export that content and we refuse it here. Don't
   re-type it into an "authored" pack either — reviewers know what the *Savage Worlds*
   core book reads like.
4. **Closed content goes in as pointer cards** — title, book, page, a one-line summary in
   your own words. Cite, don't copy.
5. **Names are fine, marks are not.** "Compatible with X" is nominative use; calling your
   package X, using X's logo, or copying X's trade dress is not.

## Mechanical requirements (CI enforces these)

- File lands at `rulesets/<id>/<id>-<version>.dmtk` or `content/<id>/<id>-<version>.dmtk`;
  the `id` and `version` inside the package must match the filename exactly.
- **Never overwrite a published file.** New version → new file → update the `index.json`
  entry to point at it.
- Add a section for your version to the package's `CHANGELOG.md` (create the file on first
  submission). One section per version — the app links it from the browse screen.
- The package must pass the validator locally before you open the PR:
  ```
  cd tools && npm install && node validate.mjs
  ```
- JSON only. Any HTML/script anywhere in the package fails validation.
- Extensions: `extends` names a base ruleset id + `minVersion`. Content packages:
  `content.json` names `profileId` + `minProfileVersion`. Test-install your package against
  that version in the app before submitting.

## How to submit

1. Build/refine in DM Toolkit; **export** the `.dmtk` from the app (hand-rolled zips are
   accepted but the app's export gets the structure right for free).
2. Fork, add the file + index entry + changelog section, run the validator.
3. Open a PR using the template. Fill every checkbox honestly — an unchecked box is a
   question, not a rejection.
4. Review: CI first (structure), human second (license truth, content sanity). Expect
   review conversation on anything text-heavy.

## What gets a PR declined

Unlicensed or mis-licensed text · personal-use/purchased content in any disguise ·
trademark/logo/trade-dress use · executable content of any kind · overwriting a published
version · packages that fail install against their declared minimum versions.

Declined ≠ banned: fix the issue and resubmit. Most declines are license paperwork, not
quality judgments.

## Conduct

Be the person you'd want at your table. Review comments address the package, not the
author; the maintainers' license calls are final (it's their repo on the line).
