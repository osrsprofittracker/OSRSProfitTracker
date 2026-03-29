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

function getJmodStore() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || loadEnvToken();
  if (siteID && token) {
    return getStore({ name: 'jmod-comments', siteID, token });
  }
  return getStore('jmod-comments');
}

exports.handler = async () => {
  try {
    const store = getJmodStore();
    const cached = await store.get('cache', { type: 'json' });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(cached || []),
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
