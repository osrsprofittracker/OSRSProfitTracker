const { readFileSync } = require('fs');
const { resolve } = require('path');
const { getStore } = require('@netlify/blobs');

const JMOD_USERNAMES = [
  'JagexAsh', 'JagexLight', 'JagexSarnie', 'JagexGoblin',
  'JagexAyiza', 'JagexFlippy', 'Mod_Kieren', 'JagexHusky',
  'JagexSween', 'Jagex_Wolf', 'JagexTyran', 'JagexRoq',
  'JagexBlossom', 'JagexNin', 'JagexRice',
];

const HEADERS = {
  'User-Agent': 'OSRSProfitTracker/1.0 (osrsprofittracker@gmail.com)',
};

function loadEnvToken() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^NETLIFY_AUTH_TOKEN=(.+)$/m);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function getJmodStore() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || loadEnvToken();
  if (siteID && token) {
    return getStore({ name: 'jmod-comments', siteID, token });
  }
  return getStore('jmod-comments');
}

function mapComment(c) {
  const body = (c.data.body || '').replace(/[*_~\[\]()#>]/g, '');
  return {
    id: c.data.name,
    author: c.data.author,
    body: body.length > 300 ? body.slice(0, 300) + '...' : body,
    permalink: c.data.permalink,
    created_utc: c.data.created_utc,
    link_title: c.data.link_title,
    subreddit: c.data.subreddit,
  };
}

async function fetchUserComments(username) {
  try {
    const res = await fetch(
      `https://www.reddit.com/user/${username}/comments.json?limit=10&sort=new`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.children || [])
      .filter(c => c.data.subreddit?.toLowerCase() === '2007scape')
      .map(mapComment);
  } catch {
    return [];
  }
}

exports.handler = async () => {
  try {
    const store = getJmodStore();

    // Fetch Jmod profiles sequentially to avoid Reddit rate limiting
    const jmodComments = [];
    for (const username of JMOD_USERNAMES) {
      const comments = await fetchUserComments(username);
      jmodComments.push(...comments);
      if (comments.length >= 0) await new Promise(r => setTimeout(r, 2000));
    }

    // Read existing cache to merge
    let existing = [];
    const cached = await store.get('cache', { type: 'json' });
    if (cached) {
      existing = cached;
    }

    // Merge and deduplicate
    const byId = new Map();
    for (const c of existing) byId.set(c.id, c);
    for (const c of jmodComments) byId.set(c.id, c);

    const merged = [...byId.values()]
      .sort((a, b) => b.created_utc - a.created_utc)
      .slice(0, 50);

    await store.setJSON('cache', merged);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, count: merged.length }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

exports.config = {
  schedule: '*/1 * * * *',
};
