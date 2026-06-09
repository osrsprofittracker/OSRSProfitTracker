import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { NON_GE_CATALOG } from '../src/data/nonGeCatalog.js';

const WIKI_FILEPATH_URL = 'https://oldschool.runescape.wiki/wiki/Special:FilePath';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';
const OUTPUT_DIR = path.resolve('public/icons/non-ge');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const FAILED_PATH = path.join(OUTPUT_DIR, 'failed.json');
const DEFAULT_DELAY_MS = 250;
const MAX_RETRIES = 5;
const CHECKPOINT_INTERVAL = 25;

function getArgValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.find(value => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

const force = process.argv.includes('--force');
const strict = process.argv.includes('--strict');
const limitArg = getArgValue('--limit', '');
const delayMs = Number(getArgValue('--delay-ms', DEFAULT_DELAY_MS));
const limit = limitArg ? Number(limitArg) : null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isSafeKey(key) {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= 80 &&
    /^[a-z0-9-]+$/.test(key)
  );
}

function getWikiPageName(item) {
  if (!item.wikiUrl) return '';
  const pagePath = String(item.wikiUrl).split('#')[0].split('?')[0];
  return decodeURIComponent(pagePath.split('/').pop() || '').replace(/ /g, '_');
}

function getImageSource(item) {
  if (item.imageUrl) {
    const fileName = decodeURIComponent(String(item.imageUrl).split('/').pop() || '');
    return {
      fileName,
      url: item.imageUrl,
    };
  }

  const pageName = getWikiPageName(item);
  if (!pageName) return null;
  const fileName = `${pageName}.png`;
  return {
    fileName,
    url: `${WIKI_FILEPATH_URL}/${encodeURIComponent(fileName)}`,
  };
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

async function downloadIcon(item, source) {
  const response = await fetchWithRetry(source.url);

  if (!response.ok) {
    throw new Error(`Icon ${item.key} returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('image/')) {
    throw new Error(`Icon ${item.key} returned ${contentType || 'unknown content type'}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Icon ${item.key} returned an empty response`);
  }

  const fileName = `${item.key}.png`;
  await writeFile(path.join(OUTPUT_DIR, fileName), buffer);

  return {
    path: `/icons/non-ge/${fileName}`,
    sourceIcon: source.fileName,
    bytes: buffer.length,
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const items = NON_GE_CATALOG
    .filter(item => isSafeKey(item.key))
    .map(item => ({ item, source: getImageSource(item) }))
    .filter(({ source }) => source)
    .sort((a, b) => a.item.key.localeCompare(b.item.key));
  const targetItems = limit ? items.slice(0, limit) : items;
  const manifest = await loadExistingManifest();

  let downloaded = 0;
  let skipped = 0;
  const failed = [];

  for (const { item, source } of targetItems) {
    const targetPath = path.join(OUTPUT_DIR, `${item.key}.png`);
    const existingEntry = manifest[item.key];
    if (
      !force &&
      existsSync(targetPath) &&
      existingEntry?.sourceIcon === source.fileName
    ) {
      skipped += 1;
      continue;
    }

    try {
      manifest[item.key] = await downloadIcon(item, source);
      downloaded += 1;
      if (downloaded % 25 === 0) {
        console.log(`Downloaded ${downloaded}; skipped ${skipped}; failed ${failed.length}`);
      }
    } catch (error) {
      failed.push({ key: item.key, sourceIcon: source.fileName, error: error.message });
      console.warn(`Failed ${item.key} ${source.fileName}: ${error.message}`);
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
