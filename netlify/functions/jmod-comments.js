const JMOD_USERNAMES = [
  'JagexAsh', 'JagexLight', 'JagexSarnie', 'JagexGoblin',
  'JagexAyiza', 'JagexFlippy', 'Mod_Kieren', 'JagexHusky',
  'JagexSween', 'Jagex_Wolf', 'JagexTyran', 'JagexRoq',
  'JagexBlossom', 'JagexNin', 'JagexRice', 'Mod_Jerv', 'JagexArcane', 'JagexRach',
];

const HEADERS = {
  'User-Agent': 'OSRSProfitTracker/1.0 (osrsprofittracker@gmail.com)',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
  'Netlify-CDN-Cache-Control': 'public, max-age=600, stale-while-revalidate=600',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
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
    const results = await Promise.all(
      JMOD_USERNAMES.map(username => fetchUserComments(username))
    );

    const byId = new Map();
    for (const comment of results.flat()) {
      byId.set(comment.id, comment);
    }

    const jmodComments = [...byId.values()]
      .sort((a, b) => b.created_utc - a.created_utc)
      .slice(0, 50);

    return json(200, jmodComments);
  } catch (error) {
    console.error('Jmod comments fetch error:', error.message);
    return json(200, []);
  }
};
