exports.handler = async () => {
  try {
    console.log('Fetching OSRS news...');
    const response = await fetch('https://secure.runescape.com/m=news/a=13/archive?oldschool=1');
    console.log('Response status:', response.status);

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

    // Extract article elements: <article class='news-list-article'>...</article>
    const articleRegex = /<article class='news-list-article'>([\s\S]*?)<\/article>/g;
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const articleHtml = match[1];

      // Extract title link: <a class='news-list-article__title-link' href='URL'>TITLE</a>
      const titleMatch = /<a class='news-list-article__title-link' href='([^']+)'>([^<]+)<\/a>/.exec(articleHtml);
      if (!titleMatch) continue;

      const link = titleMatch[1];
      let title = titleMatch[2];

      // Decode HTML entities (e.g., &amp; → &)
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Extract datetime: <time class='news-list-article__date' datetime='2026-03-25'>
      const dateMatch = /<time class='news-list-article__date' datetime='([^']+)'>/.exec(articleHtml);
      if (!dateMatch) continue;

      const pubDate = dateMatch[1]; // ISO format: 2026-03-25

      // Use the article URL as a unique identifier
      const guid = link.split('?')[0]; // Remove query params

      items.push({
        guid,
        title,
        link,
        pubDate,
      });
    }

    console.log(`Found ${items.length} articles`);

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
