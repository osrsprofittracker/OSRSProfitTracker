import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const WIKI_FILEPATH_URL = 'https://oldschool.runescape.wiki/wiki/Special:FilePath';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';
const OUTPUT_DIR = path.resolve('public/icons/ge');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const FAILED_PATH = path.join(OUTPUT_DIR, 'failed.json');
const DEFAULT_DELAY_MS = 250;
const MAX_RETRIES = 5;
const CHECKPOINT_INTERVAL = 100;
const ICON_NAME_OVERRIDES = {
  28220: 'Crystal felling axe.png',
  28223: 'Crystal felling axe (inactive).png',
  33320: 'Uncharged toxic trident (e).png',
};

function getArgValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.find(value => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

const force = process.argv.includes('--force');
const strict = process.argv.includes('--strict');
const limitArg = getArgValue('--limit', '');
const idsArg = getArgValue('--ids', '');
const delayMs = Number(getArgValue('--delay-ms', DEFAULT_DELAY_MS));
const limit = limitArg ? Number(limitArg) : null;
const idFilter = idsArg
  ? new Set(idsArg.split(',').map(value => Number(value.trim())).filter(Number.isFinite))
  : null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isSafeIconName(icon) {
  return (
    typeof icon === 'string' &&
    icon.length > 0 &&
    icon.length <= 180 &&
    icon.endsWith('.png') &&
    !icon.includes('/') &&
    !icon.includes('\\') &&
    !icon.includes('?') &&
    !icon.includes('#')
  );
}

function getMirrorIconName(item) {
  return ICON_NAME_OVERRIDES[item.id] || item.icon;
}

async function loadExistingManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (response.status !== 429 && response.status < 500) {
        return response;
      }

      const retryAfter = Number(response.headers.get('retry-after'));
      const backoffMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(30_000, 1000 * 2 ** attempt);
      lastError = new Error(`HTTP ${response.status}`);
      await sleep(backoffMs);
    } catch (error) {
      lastError = error;
      await sleep(Math.min(30_000, 1000 * 2 ** attempt));
    }
  }

  throw lastError;
}

async function fetchMapping() {
  const response = await fetchWithRetry(`${BASE_URL}/mapping`);
  if (!response.ok) {
    throw new Error(`GE mapping returned HTTP ${response.status}`);
  }

  return response.json();
}

async function downloadIcon(item) {
  const iconUrl = `${WIKI_FILEPATH_URL}/${encodeURIComponent(item.mirrorIcon)}`;
  const response = await fetchWithRetry(iconUrl);

  if (!response.ok) {
    throw new Error(`Icon ${item.id} returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('image/')) {
    throw new Error(`Icon ${item.id} returned ${contentType || 'unknown content type'}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Icon ${item.id} returned an empty response`);
  }

  const fileName = `${item.id}.png`;
  await writeFile(path.join(OUTPUT_DIR, fileName), buffer);

  return {
    path: `/icons/ge/${fileName}`,
    sourceIcon: item.icon,
    mirrorIcon: item.mirrorIcon,
    bytes: buffer.length,
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const mapping = await fetchMapping();
  const items = mapping
    .map(item => ({ ...item, mirrorIcon: getMirrorIconName(item) }))
    .filter(item => item.id && isSafeIconName(item.mirrorIcon))
    .filter(item => !idFilter || idFilter.has(Number(item.id)))
    .sort((a, b) => a.id - b.id);
  const targetItems = limit ? items.slice(0, limit) : items;
  const manifest = await loadExistingManifest();

  let downloaded = 0;
  let skipped = 0;
  const failed = [];

  for (const item of targetItems) {
    const targetPath = path.join(OUTPUT_DIR, `${item.id}.png`);
    const existingEntry = manifest[item.id];
    const existingMirrorIcon = existingEntry?.mirrorIcon || existingEntry?.sourceIcon;
    if (
      !force &&
      existsSync(targetPath) &&
      existingEntry?.sourceIcon === item.icon &&
      existingMirrorIcon === item.mirrorIcon
    ) {
      skipped += 1;
      continue;
    }

    try {
      manifest[item.id] = await downloadIcon(item);
      downloaded += 1;
      if (downloaded % 100 === 0) {
        console.log(`Downloaded ${downloaded}; skipped ${skipped}; failed ${failed.length}`);
      }
    } catch (error) {
      failed.push({ id: item.id, icon: item.icon, error: error.message });
      console.warn(`Failed ${item.id} ${item.icon}: ${error.message}`);
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    if ((downloaded + skipped + failed.length) % CHECKPOINT_INTERVAL === 0) {
      await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  }

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Mirrored ${downloaded} icons, skipped ${skipped}, failed ${failed.length}.`);
  if (failed.length > 0) {
    await writeFile(
      FAILED_PATH,
      `${JSON.stringify(failed, null, 2)}\n`
    );
    if (strict) {
      process.exitCode = 1;
    }
  } else {
    try {
      await unlink(FAILED_PATH);
    } catch {
      // No stale failure report to remove.
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
