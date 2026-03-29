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

function parseArticles(html) {
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

  return items;
}

exports.handler = async () => {
  try {
    const response = await fetch('https://secure.runescape.com/m=news/a=13/archive?oldschool=1');

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `News fetch failed: ${response.status}` }),
      };
    }

    const html = await response.text();
    const items = parseArticles(html);

    const store = getNewsStore();
    await store.setJSON('cache', items);

    return new Response(JSON.stringify({ success: true, count: items.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

exports.config = {
  schedule: '*/1 * * * *',
};
