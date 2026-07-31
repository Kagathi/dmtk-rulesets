# Package submission

**Package id:** `<id>` · **Version:** `<x.y.z>` · **Kind:** ruleset / extension / content

**What it is (one or two sentences):**

<!-- e.g. "GUMSHOE investigative-system sheet with ability quick-ref pack, built from the
     GUMSHOE SRD (CC-BY 3.0)." -->

## Checklist — mechanical

- [ ] File is at `rulesets|content/<id>/<id>-<version>.dmtk` and the interior id/version match the filename
- [ ] No published file is overwritten (new version = new file)
- [ ] `index.json` entry added/updated and points at this version
- [ ] `CHANGELOG.md` has a section for this version
- [ ] `node tools/validate.mjs` passes locally (paste the last line below)
- [ ] Extension: `extends` base id + `minVersion` declared / Content: `profileId` + `minProfileVersion` declared — **and I test-installed against that version in the app**

```
<validator output last line here>
```

## Checklist — license (the part that gates the merge)

- [ ] All rules **text** in this package is under an open license, OR the package contains no protected text (mechanics-only ruleset / pointer cards only)
- [ ] License id: `<CC-BY-4.0 / ORC / OGL-1.0a / CC0-1.0 / …>`
- [ ] Attribution text is **verbatim** from the source and included in the package
- [ ] Source of the licensed text (URL or publication): `<link/name>`
- [ ] **I affirm this license permits redistribution of this text in this form, and that no part of this package is personal-use or purchased content.**

## Notes for the reviewer (optional)

<!-- Anything unusual: vintage of the source (e.g. "2014-era stat blocks"), sections you
     deliberately left as pointer cards, known gaps, etc. -->
