#!/usr/bin/env node
/**
 * Build a `.dmtk` from a profile source, for the first-party rulesets this repo now carries
 * itself (DM's direction 2026-09-28: new licensed-SRD rulesets are served from the registry
 * rather than bundled into the app).
 *
 * **Why this exists at all.** A bundled starter is parsed at module load by the app's own
 * `starterProfiles.ts`, so a malformed one cannot survive `pnpm gate`. A registry ruleset has
 * no such gate — `validate.mjs` deliberately does not duplicate the app's schema, to avoid two
 * copies drifting apart. That leaves a window where a profile can be published and only fail on
 * a DM's machine, after they downloaded it. This tool closes the half it can: the checks below
 * are the ones that need no schema, and a package is not written unless they all pass.
 *
 * It is NOT a substitute for the app's `rulesetProfileV1`. Run that against the source too —
 * from the app repo, which owns it. The honest description of this tier: it runs where the
 * package is BUILT, not where it is consumed.
 *
 * Usage:
 *   node tools/pack.mjs rulesets/daggerheart-srd/source/daggerheart-srd.json
 *
 * Writes `<kind-dir>/<id>/<id>-<version>.dmtk` beside the source's own ruleset directory, which
 * is the immutable naming `validate.mjs` enforces on every entry.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

const source = process.argv[2];
if (!source) {
  console.error('usage: node tools/pack.mjs <path to profile.json source>');
  process.exit(2);
}

const problems = [];
const need = (ok, message) => {
  if (!ok) problems.push(message);
};

let profile;
try {
  profile = JSON.parse(readFileSync(source, 'utf8'));
} catch (err) {
  console.error(`${source} is not valid JSON: ${err.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------- what can be checked without the schema
need(profile.schemaVersion === 1, 'schemaVersion must be 1');
need(typeof profile.id === 'string' && profile.id.length > 0, 'id is required');
need(typeof profile.name === 'string' && profile.name.length > 0, 'name is required');
need(typeof profile.version === 'string' && profile.version.length > 0, 'version is required');
need(Array.isArray(profile.attributes), 'attributes must be an array');
need(Array.isArray(profile.resources), 'resources must be an array');

// The id and version ride the FILE NAME, and `validate.mjs` re-derives them from it — an id
// with a slash or a space would produce a path the registry refuses after the fact.
const SAFE = /^[a-z0-9][a-z0-9.\-_]*$/i;
need(SAFE.test(profile.id ?? ''), `id "${profile.id}" must match ${SAFE}`);
need(SAFE.test(profile.version ?? ''), `version "${profile.version}" must match ${SAFE}`);

/**
 * HABIT #14, at the only tier left to it here.
 *
 * `poolsFromNpc` reads a creature's hit points out of `data.hp` BY NAME, and the app's own
 * suite asserts this for every BUNDLED starter — a check a registry profile falls outside of,
 * because that test iterates `STARTER_PROFILES` and a downloaded ruleset is not in it. So the
 * check moves here, to the last place that sees the profile before a DM does.
 *
 * The defect it exists for: two shipped starters never declared the field, so every creature
 * imported on those systems reached the combat tracker with no hit points, and no test could
 * fail because every link was individually correct.
 */
const template = profile.npcTemplate;
if (template) {
  const fields = [
    ...(template.attributes ?? []),
    ...(template.extraFields ?? []).map((f) => f.key),
  ];
  need(
    fields.includes('hp'),
    'npcTemplate declares no `hp` field — a creature imported on this ruleset would reach the ' +
      'combat tracker with no hit points (habit #14)'
  );
}

/** An import hint pointing at a field the template lacks is a mapping that can never land. */
const mapping = profile.importHints?.monster?.mapping ?? {};
for (const [label, target] of Object.entries(mapping)) {
  if (target?.kind !== 'data') continue;
  const fields = [
    ...(template?.attributes ?? []),
    ...(template?.extraFields ?? []).map((f) => f.key),
  ];
  need(
    fields.includes(target.key),
    `import hint "${label}" maps to data.${target.key}, which the npcTemplate does not declare`
  );
}

if (problems.length > 0) {
  console.error(`REFUSED — ${source}`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nNothing was written. Fix the source and run again.');
  process.exit(1);
}

// ---------------------------------------------------------------- write the package
const kindDir = profile.extends ? 'rulesets' : 'rulesets';
const dir = join(resolve(dirname(source), '..'));
const out = join(dir, `${profile.id}-${profile.version}.dmtk`);

if (existsSync(out)) {
  console.error(
    `REFUSED — ${out} already exists.\n` +
      'Published versions are IMMUTABLE: bump the version in the source instead of rewriting a ' +
      'package a DM may already have installed.'
  );
  process.exit(1);
}

const files = { 'profile.json': strToU8(JSON.stringify(profile, null, 2)) };
writeFileSync(out, zipSync(files));

console.log(`wrote ${out}`);
console.log(`  ${profile.name} ${profile.version} — ${profile.attributes.length} attributes, ` +
  `${profile.resources.length} resources`);
console.log(`  index.json entry needs: "file": "${kindDir}/${profile.id}/${profile.id}-${profile.version}.dmtk"`);
console.log('\nNow run `node tools/validate.mjs`, and validate the source against the app\'s own');
console.log('rulesetProfileV1 from the app repo — this tool checks shape, not the full schema.');
