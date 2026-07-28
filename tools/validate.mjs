#!/usr/bin/env node
/**
 * Registry CI validator for the public `dmtk-rulesets` repo.
 *
 * Runs in GitHub Actions on every PR. It performs the STRUCTURAL + policy checks
 * that must gate a submission early:
 *   - index.json parses and every entry has the required fields;
 *   - each entry's `file` follows the immutable naming `rulesets/<id>/<id>-<ver>.dmtk`;
 *   - each referenced .dmtk is a zip of JSON ONLY (no HTML/scripts ride the registry);
 *   - profile.json parses and its id/version match the entry (and the file name);
 *   - the §4.2 license gate: any reference card carrying rule TEXT (a non-empty
 *     `body`) requires a license.json in that .dmtk;
 *   - a CHANGELOG.md section exists for the version.
 *
 * The DEEP schema validation (formulas compile, refs resolve, no cycles) is the
 * APP's job on install (it runs the authoritative `rulesetProfileV1`), so this
 * validator intentionally does not duplicate that schema — no drift to maintain.
 *
 * Usage: `node tools/validate.mjs` (validates the whole repo). Requires `fflate`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';

const ROOT = process.argv[2] ?? process.cwd();
const errors = [];
const fail = (m) => errors.push(m);

const FILE_RE = /^rulesets\/([a-z0-9][a-z0-9.\-_]*)\/\1-([a-z0-9][a-z0-9.\-_]*)\.dmtk$/i;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateEntry(entry) {
  for (const field of ['id', 'name', 'version', 'kind', 'license', 'file']) {
    if (entry[field] == null) fail(`entry "${entry.id ?? '?'}" is missing "${field}"`);
  }
  if (entry.kind !== 'ruleset' && entry.kind !== 'extension')
    fail(`entry "${entry.id}" has invalid kind "${entry.kind}"`);
  if (!entry.license?.id) fail(`entry "${entry.id}" needs license.id`);
  const m = FILE_RE.exec(entry.file ?? '');
  if (!m) {
    fail(`entry "${entry.id}" file "${entry.file}" must be rulesets/<id>/<id>-<version>.dmtk`);
    return;
  }
  if (m[1] !== entry.id || m[2] !== entry.version) {
    fail(
      `entry "${entry.id}" file name (${m[1]}-${m[2]}) disagrees with id/version (${entry.id}-${entry.version})`
    );
  }
  const abs = join(ROOT, entry.file);
  if (!existsSync(abs)) {
    fail(`entry "${entry.id}" file not found: ${entry.file}`);
    return;
  }
  validateDmtk(abs, entry);
  // A changelog section for this version must exist.
  const changelog = join(dirname(abs), 'CHANGELOG.md');
  if (!existsSync(changelog))
    fail(`entry "${entry.id}" is missing rulesets/${entry.id}/CHANGELOG.md`);
  else if (!readFileSync(changelog, 'utf8').includes(entry.version)) {
    fail(`entry "${entry.id}" CHANGELOG.md has no section for ${entry.version}`);
  }
}

function validateDmtk(abs, entry) {
  let files;
  try {
    files = unzipSync(new Uint8Array(readFileSync(abs)));
  } catch {
    fail(`entry "${entry.id}" is not a valid .dmtk (zip)`);
    return;
  }
  const names = Object.keys(files);
  // JSON-only: nothing but *.json rides the registry.
  for (const name of names) {
    if (!name.endsWith('.json')) fail(`entry "${entry.id}" contains a non-JSON file: ${name}`);
  }
  if (!names.includes('profile.json')) {
    fail(`entry "${entry.id}" has no profile.json`);
    return;
  }
  let profile;
  try {
    profile = JSON.parse(strFromU8(files['profile.json']));
  } catch {
    fail(`entry "${entry.id}" profile.json is not valid JSON`);
    return;
  }
  if (profile.id !== entry.id) fail(`entry "${entry.id}" profile.json id is "${profile.id}"`);
  if (profile.version !== entry.version)
    fail(`entry "${entry.id}" profile.json version is "${profile.version}"`);
  if (!Array.isArray(profile.attributes))
    fail(`entry "${entry.id}" profile.json has no attributes array`);

  // License gate: a reference card with reproduced rule TEXT needs a license.json.
  const hasLicense = names.includes('license.json');
  for (const name of names) {
    if (!name.startsWith('reference/')) continue;
    let pack;
    try {
      pack = JSON.parse(strFromU8(files[name]));
    } catch {
      fail(`entry "${entry.id}" ${name} is not valid JSON`);
      continue;
    }
    const hasText =
      Array.isArray(pack.cards) &&
      pack.cards.some((c) => typeof c.body === 'string' && c.body.trim());
    if (hasText && !hasLicense) {
      fail(`entry "${entry.id}" ${name} reproduces rule text but the .dmtk has no license.json`);
    }
  }
}

const indexPath = join(ROOT, 'index.json');
if (!existsSync(indexPath)) {
  fail('index.json not found at the repo root');
} else {
  let index;
  try {
    index = readJson(indexPath);
  } catch {
    fail('index.json is not valid JSON');
  }
  if (index) {
    if (!Array.isArray(index.entries)) fail('index.json has no "entries" array');
    else {
      const seen = new Set();
      for (const entry of index.entries) {
        const key = `${entry.id}@${entry.version}`;
        if (seen.has(key)) fail(`duplicate entry ${key}`);
        seen.add(key);
        validateEntry(entry);
      }
    }
  }
}

if (errors.length) {
  console.error(`✗ registry validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ registry validation passed');
