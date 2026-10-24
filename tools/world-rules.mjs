/**
 * The worlds lane's rules for the registry (app 1.1.0 — `worlds-lane-build.md` step 11), shared by
 * the pack tool and the validator so the two can never disagree.
 *
 * A world is a `.dmtkworld` file the app exported. Its INDEX ENTRY is generated FROM the file's own
 * manifest by `pack-world.mjs` — one source — and the validator compares every published entry
 * back against its file's manifest, so a hand-edited mismatch fails.
 *
 * THE GENRE LIST IS THE APP'S (the DM, 2026-10-24: one list, in the app, that these tools use).
 * `world-genres.json` beside this file is WRITTEN by the app repo's `pnpm registry:tools` from
 * `WORLD_GENRES` in `@dmtk/shared` (`worldCard.ts`), and the app's gate fails if the two differ.
 * Never edit it here: change the app's list and run the sync.
 */
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

export const WORLD_GENRES = JSON.parse(
  readFileSync(new URL('./world-genres.json', import.meta.url), 'utf8')
).genres;

/** A registry world is at most 25 MB — art is the whole size story. */
export const WORLD_MAX_BYTES = 25 * 1024 * 1024;

/** `worlds/<id>/<id>-<version>.dmtkworld`, the immutable address the app derives. */
export const WORLD_FILE_RE =
  /^worlds\/([a-z0-9][a-z0-9.\-_]*)\/\1-([a-z0-9][a-z0-9.\-_]*)\.dmtkworld$/i;

export const worldFilePath = (id, version) => `worlds/${id}/${id}-${version}.dmtkworld`;

/** What an image is, by its bytes — the only media a registry world may carry. */
export function imageType(b) {
  const s = (i, n) => String.fromCharCode(...b.slice(i, i + n));
  if (b.length > 12 && s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') return 'webp';
  if (b.length > 8 && b[0] === 0x89 && s(1, 3) === 'PNG') return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  return null;
}

/**
 * Read a `.dmtkworld` and say what's wrong with it as a registry world, or nothing. Returns the
 * manifest too, so the pack tool can build the entry from it.
 */
export function readWorldFile(bytes) {
  const problems = [];
  let files;
  try {
    files = unzipSync(bytes);
  } catch {
    return { problems: ['is not a world file (not a zip)'], manifest: null };
  }
  if (bytes.byteLength > WORLD_MAX_BYTES)
    problems.push(`is ${(bytes.byteLength / 1048576).toFixed(1)} MB; the cap is 25 MB`);
  const json = (name) => {
    if (!files[name]) return null;
    try {
      return JSON.parse(strFromU8(files[name]));
    } catch {
      problems.push(`${name} is not valid JSON`);
      return null;
    }
  };
  const manifest = json('manifest.json');
  if (!manifest) problems.push('has no readable manifest.json');
  if (!json('world.json')) problems.push('has no readable world.json');
  for (const name of Object.keys(files)) {
    if (name.endsWith('.json')) continue;
    if (name.startsWith('media/')) {
      if (!imageType(files[name]))
        problems.push(`${name} is not a WebP, PNG or JPEG image — only images ride the registry`);
      continue;
    }
    problems.push(`carries a file the registry doesn't take: ${name}`);
  }
  // Nothing a DM bought for their own table may be published (the personal-use gate).
  for (const table of ['items.json', 'monsters.json']) {
    const rows = json(table) ?? [];
    for (const r of Array.isArray(rows) ? rows : []) {
      if (r?.licenseJson?.id === 'personal-use')
        problems.push(`${table} carries "${r.name}", marked Personal use — it can't be published`);
    }
  }
  if (manifest) {
    if (!manifest.license?.id)
      problems.push('declares no license — set one on World settings and export again');
    if (manifest.genre && !WORLD_GENRES.includes(manifest.genre))
      problems.push(`genre "${manifest.genre}" isn't one of: ${WORLD_GENRES.join(', ')}`);
  }
  return { problems, manifest };
}

/** The fields an index entry takes from its file's manifest — the pack writes, the validator compares. */
export function entryFromManifest(manifest) {
  return {
    name: manifest.world?.name ?? '',
    summary: manifest.summary ?? '',
    description: manifest.world?.description ?? '',
    ...(manifest.genre ? { genre: manifest.genre } : {}),
    ...(manifest.flavor ? { flavor: manifest.flavor } : {}),
    author: manifest.author ?? '',
    license: {
      id: manifest.license?.id ?? '',
      ...(manifest.license?.attribution ? { attribution: manifest.license.attribution } : {}),
    },
    ...(manifest.minAppVersion ? { minAppVersion: manifest.minAppVersion } : {}),
    contents: manifest.contents ?? {},
    sizeBytes: manifest.sizeBytes ?? 0,
    contentFor: manifest.contentFor ?? [],
    ...(manifest.calendars ? { calendars: manifest.calendars } : {}),
    ...(manifest.contentNotes ? { contentNotes: manifest.contentNotes } : {}),
  };
}
