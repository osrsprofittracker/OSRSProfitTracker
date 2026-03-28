const { readFileSync } = require('fs');
const { resolve } = require('path');
const { getStore } = require('@netlify/blobs');

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

function getNewsStore() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || loadEnvToken();
  if (siteID && token) {
    return getStore({ name: 'osrs-news', siteID, token });
  }
  return getStore('osrs-news');
}

exports.handler = async () => {
  try {
    const store = getNewsStore();
    const cached = await store.get('cache', { type: 'json' });

    if (cached && cached.length > 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(cached),
      };
    }

    // Fallback: fetch directly if cache is empty
    const response = await fetch('https://secure.runescape.com/m=news/a=13/archive?oldschool=1');

    if (!response.ok) {
      console.error('News fetch error:', response.status);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `News page returned ${response.status}` }),
      };
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
