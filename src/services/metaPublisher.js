// src/services/metaPublisher.js
// Direct Meta Graph API Publisher for DigitallyDefined
// Publishes directly to Facebook Page (DigitallyDefined) and Instagram Business (@digitally.defined)

const FB_GRAPH_VERSION = 'v21.0';
const FB_GRAPH_BASE = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

/**
 * Fetch the active Page Access Token for DigitallyDefined
 */
export async function getPageAccessToken() {
  const userToken = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!userToken) {
    throw new Error('FACEBOOK_ACCESS_TOKEN is not configured in backend environment');
  }

  const url = `${FB_GRAPH_BASE}/me/accounts?access_token=${userToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Failed to fetch Meta accounts (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const page = (data.data || []).find((p) => p.name === 'DigitallyDefined' || p.id === process.env.FACEBOOK_PAGE_ID) || data.data?.[0];
  if (!page || !page.access_token) {
    throw new Error('No DigitallyDefined Facebook Page found under this Meta user token');
  }

  return {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    instagramBusinessId: process.env.INSTAGRAM_BUSINESS_ID || '17841464621922426'
  };
}

/**
 * Publish a post to the Facebook Page
 */
export async function publishToFacebookPage({ message, link }) {
  const { pageId, pageAccessToken } = await getPageAccessToken();
  const url = `${FB_GRAPH_BASE}/${pageId}/feed`;

  const body = new URLSearchParams();
  body.append('message', String(message).trim());
  if (link) body.append('link', String(link).trim());
  body.append('access_token', pageAccessToken);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Facebook post failed (${res.status}): ${err.slice(0, 250)}`);
  }

  const data = await res.json();
  return {
    success: true,
    platform: 'facebook',
    postId: data.id,
    url: `https://www.facebook.com/${data.id}`
  };
}

/**
 * Publish a photo/graphic to Instagram Business (@digitally.defined)
 */
export async function publishToInstagram({ imageUrl, caption }) {
  if (!imageUrl) {
    throw new Error('imageUrl is required for Instagram publishing');
  }

  const { instagramBusinessId, pageAccessToken } = await getPageAccessToken();

  // Step 1: Create Media Container
  const createUrl = `${FB_GRAPH_BASE}/${instagramBusinessId}/media`;
  const createBody = new URLSearchParams();
  createBody.append('image_url', imageUrl);
  if (caption) createBody.append('caption', String(caption).trim());
  createBody.append('access_token', pageAccessToken);

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: createBody.toString()
  });

  if (!createRes.ok) {
    const err = await createRes.text().catch(() => '');
    throw new Error(`Instagram container creation failed (${createRes.status}): ${err.slice(0, 250)}`);
  }

  const { id: containerId } = await createRes.json();

  // Step 2: Publish Media Container
  const pubUrl = `${FB_GRAPH_BASE}/${instagramBusinessId}/media_publish`;
  const pubBody = new URLSearchParams();
  pubBody.append('creation_id', containerId);
  pubBody.append('access_token', pageAccessToken);

  const pubRes = await fetch(pubUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: pubBody.toString()
  });

  if (!pubRes.ok) {
    const err = await pubRes.text().catch(() => '');
    throw new Error(`Instagram publish failed (${pubRes.status}): ${err.slice(0, 250)}`);
  }

  const pubData = await pubRes.json();
  return {
    success: true,
    platform: 'instagram',
    mediaId: pubData.id
  };
}

/**
 * Unified Dispatcher: Publishes to requested channels directly via Meta Graph API
 */
export async function publishToMetaChannels(postData) {
  const content = postData.content || postData.message;
  if (!content) throw new Error('Post content is required');

  const platforms = Array.isArray(postData.platforms) && postData.platforms.length > 0
    ? postData.platforms
    : ['facebook'];

  const results = {};
  const errors = [];

  // Format final copy
  const fullMessage = [
    content,
    postData.callToAction,
    postData.link,
    Array.isArray(postData.hashtags) ? postData.hashtags.join(' ') : postData.hashtags
  ].filter(Boolean).join('\n\n');

  // 1. Facebook Page
  if (platforms.includes('facebook')) {
    try {
      results.facebook = await publishToFacebookPage({
        message: fullMessage,
        link: postData.link
      });
    } catch (err) {
      errors.push(`Facebook: ${err.message}`);
    }
  }

  // 2. Instagram
  if (platforms.includes('instagram')) {
    if (postData.imageUrl || postData.mediaUrl) {
      try {
        results.instagram = await publishToInstagram({
          imageUrl: postData.imageUrl || postData.mediaUrl,
          caption: fullMessage
        });
      } catch (err) {
        errors.push(`Instagram: ${err.message}`);
      }
    } else {
      errors.push('Instagram: Skipped (image/media URL is required by Meta for Instagram feed posts)');
    }
  }

  return {
    success: Object.keys(results).length > 0,
    published: results,
    errors,
    timestamp: Date.now()
  };
}

export default {
  getPageAccessToken,
  publishToFacebookPage,
  publishToInstagram,
  publishToMetaChannels
};
