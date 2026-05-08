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
      throw new Error(`News page returned ${response.status}`);
    }

    const html = await response.text();
    const items = parseArticles(html);
    return json(200, items);
  } catch (error) {
    console.error('OSRS news fetch error:', error.message);
    return json(200, []);
  }
};
