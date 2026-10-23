#!/usr/bin/env node
/**
 * Pack a world for the registry (app 1.1.0 — the worlds lane).
 *
 *   node tools/pack-world.mjs <exported.dmtkworld> --id the-vale --version 1.0.0
 *        [--official] [--cover cover.webp --cover-credit "Kagathi"]
 *        [--changelog "The first edition: Eastdale and its districts…"]
 *
 * Takes a world the app exported (World settings → Export world file…) and:
 *   1. checks it as a registry world (`world-rules.mjs`: size, images only, license, genre, nothing
 *      marked Personal use) — and refuses, saying why, if it isn't one;
 *   2. copies it to its immutable address, `worlds/<id>/<id>-<version>.dmtkworld` — refusing to
 *      overwrite a version that's already published (a new edition is a new version);
 *   3. writes the INDEX ENTRY into `worlds.json` FROM THE FILE'S OWN MANIFEST — never by hand, so
 *      the card can't say something the file doesn't;
 *   4. adds the version's section to `worlds/<id>/CHANGELOG.md`.
 *
 * Versioning rule (AUTHORING.md): patch = prose fixes · minor = new content · major = restructuring.
 * Then run `node tools/validate.mjs`. Nothing here pushes.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { entryFromManifest, imageType, readWorldFile, worldFilePath } from './world-rules.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);
const die = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};

const src = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const id = flag('id');
const version = flag('version');
if (!src || !id || !version)
  die('usage: node tools/pack-world.mjs <file.dmtkworld> --id <id> --version <x.y.z>');
if (!/^[a-z0-9][a-z0-9.\-_]*$/i.test(id) || !/^\d+\.\d+\.\d+$/.test(version))
  die('the id is letters, digits, dots, dashes and underscores; the version is x.y.z');
if (!existsSync(src)) die(`${src} not found`);

const ROOT = process.cwd();
const bytes = new Uint8Array(readFileSync(src));
const { problems, manifest } = readWorldFile(bytes);
if (problems.length) die(`${src} can't be published:\n  - ${problems.join('\n  - ')}`);

const rel = worldFilePath(id, version);
const dest = join(ROOT, rel);
if (existsSync(dest)) die(`${rel} is already published — a new edition is a new version`);

let coverRel = null;
const cover = flag('cover');
if (cover) {
  const c = new Uint8Array(readFileSync(cover));
  if (imageType(c) !== 'webp') die(`${cover} must be a WebP image`);
  if (!flag('cover-credit')) die('a cover needs --cover-credit: who made the art');
  coverRel = rel.replace(/\.dmtkworld$/, '.cover.webp');
}

const indexPath = join(ROOT, 'worlds.json');
const index = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, 'utf8'))
  : { formatVersion: 1, entries: [] };

const entry = {
  id,
  version,
  ...entryFromManifest(manifest),
  dmtk_official: has('official'),
  file: rel,
  ...(coverRel ? { hasCover: true, coverCredit: flag('cover-credit') } : {}),
  changelogExcerpt: flag('changelog') ?? '',
  updatedAt: Date.now(),
};
const ordered = Object.fromEntries(
  ['id', 'name', 'summary', 'description', 'version']
    .filter((k) => k in entry)
    .map((k) => [k, entry[k]])
    .concat(Object.entries(entry).filter(([k]) => !['id', 'name', 'summary', 'description', 'version'].includes(k)))
);

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
if (coverRel) copyFileSync(cover, join(ROOT, coverRel));
index.entries.push(ordered);
writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

const changelog = join(dirname(dest), 'CHANGELOG.md');
const section = `## ${version}\n\n${flag('changelog') ?? 'Published.'}\n`;
const before = existsSync(changelog)
  ? readFileSync(changelog, 'utf8')
  : `# ${entry.name} — changelog\n\n`;
const [head, ...rest] = before.split(/\n(?=## )/);
writeFileSync(changelog, [head.trimEnd(), '', section, ...rest].join('\n').trimEnd() + '\n');

console.log(`✓ packed ${entry.name} ${version} → ${rel}`);
console.log('  next: node tools/validate.mjs');
