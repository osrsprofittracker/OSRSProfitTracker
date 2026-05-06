const { getStore } = require('@netlify/blobs');

const JMOD_USERNAMES = [
  'JagexAsh', 'JagexLight', 'JagexSarnie', 'JagexGoblin',
  'JagexAyiza', 'JagexFlippy', 'Mod_Kieren', 'JagexHusky',
  'JagexSween', 'Jagex_Wolf', 'JagexTyran', 'JagexRoq',
  'JagexBlossom', 'JagexNin', 'JagexRice', 'Mod_Jerv', 'JagexArcane', 'JagexRach',
];

const HEADERS = {
  'User-Agent': 'OSRSProfitTracker/1.0 (osrsprofittracker@gmail.com)',
};

function getJmodStore() {
  return getStore('jmod-comments');
}

function parseRssEntries(xml, username) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const subredditMatch = /<category term="([^"]*)"/.exec(entry);
    const subreddit = subredditMatch?.[1] || '';
    if (subreddit.toLowerCase() !== '2007scape') continue;

    const idMatch = /<id>(.*?)<\/id>/.exec(entry);
    const linkMatch = /<link href="([^"]*)"/.exec(entry);
    const updatedMatch = /<updated>(.*?)<\/updated>/.exec(entry);
    const titleMatch = /<title>(.*?)<\/title>/.exec(entry);
    const contentMatch = /<content type="html">([\s\S]*?)<\/content>/.exec(entry);

    let body = (contentMatch?.[1] || '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (body.length > 300) body = body.slice(0, 300) + '...';

    const linkTitle = (titleMatch?.[1] || '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
      .replace(new RegExp(`^/u/${username} on `), '');

    const permalink = linkMatch?.[1]?.replace('https://www.reddit.com', '') || '';
    const createdUtc = updatedMatch?.[1] ? Math.floor(new Date(updatedMatch[1]).getTime() / 1000) : 0;

    entries.push({
      id: idMatch?.[1] || '',
      author: username,
      body,
      permalink,
      created_utc: createdUtc,
      link_title: linkTitle,
      subreddit,
    });
  }

  return entries;
}

async function fetchUserComments(username) {
  try {
    const res = await fetch(
      `https://www.reddit.com/user/${username}/comments.rss?limit=10`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssEntries(xml, username);
  } catch {
    return [];
  }
}

exports.handler = async () => {
  try {
    const store = getJmodStore();

    // Fetch all Jmod profiles in parallel to stay within function timeout
    const results = await Promise.all(
      JMOD_USERNAMES.map(username => fetchUserComments(username))
    );
    const jmodComments = results.flat();

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
