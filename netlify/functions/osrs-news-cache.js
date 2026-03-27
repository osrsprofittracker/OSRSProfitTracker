const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

      items.push({
        guid,
        title,
        link,
        pubDate,
      });
    }

    // Update Supabase cache
    const cacheResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/news_cache?id=eq.1`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          cached_articles: items,
          last_updated: new Date().toISOString(),
        }),
      }
    );

    if (cacheResponse.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, count: items.length }),
      };
    }

    // Try INSERT if row doesn't exist
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/news_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        id: 1,
        cached_articles: items,
        last_updated: new Date().toISOString(),
      }),
    });

    if (!insertResponse.ok) {
      throw new Error(`Failed to cache articles: ${insertResponse.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, count: items.length }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

exports.config = {
  schedule: '*/1 * * * *', // Every minute
};
