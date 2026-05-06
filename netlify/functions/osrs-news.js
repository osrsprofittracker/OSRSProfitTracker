const { getStore } = require('@netlify/blobs');

function getNewsStore() {
  return getStore('osrs-news');
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

async function fetchNewsFromOrigin() {
  const response = await fetch('https://secure.runescape.com/m=news/a=13/archive?oldschool=1');
  if (!response.ok) {
    throw new Error(`News page returned ${response.status}`);
  }

  const html = await response.text();
  const items = [];

  const articleRegex = /<article class='news-list-article'>([\s\S]*?)<\/article>/g;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const articleHtml = match[1];

    const titleMatch = /<a class='news-list-article__title-link' href='([^']+)'>([^<]+)<\/a>/.exec(articleHtml);
    if (!titleMatch) continue;

    const link = titleMatch[1];
    let title = titleMatch[2];

    title = title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const dateMatch = /<time class='news-list-article__date' datetime='([^']+)'>/.exec(articleHtml);
    if (!dateMatch) continue;

    const pubDate = dateMatch[1];
    const guid = link.split('?')[0];

    items.push({ guid, title, link, pubDate });
  }

  if (items.length === 0) {
    throw new Error('No articles parsed from OSRS news page');
  }

  return items;
}

exports.handler = async () => {
  const store = getNewsStore();
  let cached = [];

  try {
    const fromCache = await store.get('cache', { type: 'json' });
    if (Array.isArray(fromCache)) {
      cached = fromCache;
    }
  } catch (cacheReadError) {
    console.error('OSRS news cache read error:', cacheReadError.message);
  }

  if (cached.length > 0) {
    return json(200, cached);
  }

  try {
    const items = await fetchNewsFromOrigin();

    try {
      await store.setJSON('cache', items);
    } catch (cacheWriteError) {
      console.error('OSRS news cache write error:', cacheWriteError.message);
    }

    return json(200, items);
  } catch (originError) {
    console.error('OSRS news origin error:', originError.message);
    return json(200, []);
  }
};
