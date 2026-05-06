const { getStore } = require('@netlify/blobs');

function getJmodStore() {
  return getStore('jmod-comments');
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

exports.handler = async () => {
  try {
    const store = getJmodStore();
    const cached = await store.get('cache', { type: 'json' });

    return json(200, Array.isArray(cached) ? cached : []);
  } catch (error) {
    console.error('Jmod comments cache read error:', error.message);
    return json(200, []);
  }
};
