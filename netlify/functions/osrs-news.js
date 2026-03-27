const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

exports.handler = async () => {
  try {
    // Fetch from Supabase cache
    const cacheResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/news_cache?id=eq.1&select=cached_articles`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
      }
    );

    if (cacheResponse.ok) {
      const data = await cacheResponse.json();
      if (data.length > 0 && data[0].cached_articles) {
        const articles = data[0].cached_articles;
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify(articles),
        };
      }
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

      items.push({
        guid,
        title,
        link,
        pubDate,
      });
    }

    console.log(`Found ${items.length} articles (fallback)`);

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
