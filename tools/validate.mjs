#!/usr/bin/env node
/**
 * Registry CI validator for the public `dmtk-rulesets` repo.
 *
 * Runs in GitHub Actions on every PR. It performs the STRUCTURAL + policy checks
 * that must gate a submission early:
 *   - index.json parses and every entry has the required fields;
 *   - each entry's `file` follows the immutable naming `<kind-dir>/<id>/<id>-<ver>.dmtk`
 *     (`rulesets/` for ruleset|extension, `content/` for a content package);
 *   - each referenced .dmtk is a zip of JSON ONLY (no HTML/scripts ride the registry);
 *   - a ruleset carries `profile.json`, a content package carries `content.json`;
 *     either way its id/version match the entry (and the file name);
 *   - the §4.2 license gate: any reference card carrying rule TEXT (a non-empty
 *     `body`), or any monster, requires a license.json in that .dmtk;
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

const FILE_RE = /^(rulesets|content)\/([a-z0-9][a-z0-9.\-_]*)\/\2-([a-z0-9][a-z0-9.\-_]*)\.dmtk$/i;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateEntry(entry) {
  for (const field of ['id', 'name', 'version', 'kind', 'license', 'file']) {
    if (entry[field] == null) fail(`entry "${entry.id ?? '?'}" is missing "${field}"`);
  }
  if (entry.kind !== 'ruleset' && entry.kind !== 'extension' && entry.kind !== 'content')
    fail(`entry "${entry.id}" has invalid kind "${entry.kind}"`);
  if (!entry.license?.id) fail(`entry "${entry.id}" needs license.id`);
  const m = FILE_RE.exec(entry.file ?? '');
  if (!m) {
    fail(`entry "${entry.id}" file "${entry.file}" must be <rulesets|content>/<id>/<id>-<version>.dmtk`);
    return;
  }
  const [, dir, fileId, fileVer] = m;
  const expectedDir = entry.kind === 'content' ? 'content' : 'rulesets';
  if (dir !== expectedDir) {
    fail(`entry "${entry.id}" (kind ${entry.kind}) must live under ${expectedDir}/, not ${dir}/`);
  }
  if (fileId !== entry.id || fileVer !== entry.version) {
    fail(
      `entry "${entry.id}" file name (${fileId}-${fileVer}) disagrees with id/version (${entry.id}-${entry.version})`
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
    fail(`entry "${entry.id}" is missing ${dir}/${entry.id}/CHANGELOG.md`);
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
  // JSON-only: nothing but *.json rides the registry (covers reference/ + monsters/).
  for (const name of names) {
    if (!name.endsWith('.json')) fail(`entry "${entry.id}" contains a non-JSON file: ${name}`);
  }

  // Root descriptor: profile.json for a ruleset/extension, content.json for a
  // content package. Exactly one, matching the entry's kind.
  const root = entry.kind === 'content' ? 'content.json' : 'profile.json';
  if (!names.includes(root)) {
    fail(`entry "${entry.id}" (kind ${entry.kind}) has no ${root}`);
    return;
  }
  let descriptor;
  try {
    descriptor = JSON.parse(strFromU8(files[root]));
  } catch {
    fail(`entry "${entry.id}" ${root} is not valid JSON`);
    return;
  }
  if (descriptor.id !== entry.id) fail(`entry "${entry.id}" ${root} id is "${descriptor.id}"`);
  if (descriptor.version !== entry.version)
    fail(`entry "${entry.id}" ${root} version is "${descriptor.version}"`);
  if (entry.kind === 'content') {
    if (!descriptor.profileId) fail(`entry "${entry.id}" content.json has no profileId`);
    if (!descriptor.minProfileVersion)
      fail(`entry "${entry.id}" content.json has no minProfileVersion`);
  } else if (!Array.isArray(descriptor.attributes)) {
    fail(`entry "${entry.id}" profile.json has no attributes array`);
  }

  // License gate (§4.2): reproduced rule TEXT (a card `body`), any monster, OR any
  // item needs a license.json in the .dmtk. An items table IS the book's rules text —
  // its damage dice and costs are the part someone wrote and owns.
  const hasLicense = names.includes('license.json');
  const hasMonsters = names.some((n) => n.startsWith('monsters/'));
  if (hasMonsters && !hasLicense) {
    fail(`entry "${entry.id}" carries monsters but the .dmtk has no license.json`);
  }
  const itemFiles = names.filter((n) => n.startsWith('items/'));
  if (itemFiles.length > 0 && !hasLicense) {
    fail(`entry "${entry.id}" carries items but the .dmtk has no license.json`);
  }
  // Shape check for items (v0.10.0, channel #3). The registry can't resolve targets
  // against the profile — that's the installing app's job, where the ruleset actually
  // is — so this checks only what is decidable from the file: a stable slug, a name,
  // and at least one target. An item that targets nothing lands nowhere.
  for (const name of itemFiles) {
    let item;
    try {
      item = JSON.parse(strFromU8(files[name]));
    } catch {
      fail(`entry "${entry.id}" ${name} is not valid JSON`);
      continue;
    }
    if (!item.slug) fail(`entry "${entry.id}" ${name} has no slug (the id a re-install lands on)`);
    if (!item.name) fail(`entry "${entry.id}" ${name} has no name`);
    if (!item.targets || Object.keys(item.targets).length === 0) {
      fail(`entry "${entry.id}" ${name} targets nothing — it would land nowhere`);
    }
  }
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
