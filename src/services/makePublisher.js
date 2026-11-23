// src/services/makePublisher.js
// Make.com Social Media Auto-Publishing Integration for DigitallyDefined
// Triggers Make.com scenarios via webhook to publish to Facebook, Instagram, Threads, Pinterest

const MAKE_WEBHOOK_URL = process.env.MAKE_SOCIAL_WEBHOOK_URL || 'https://hook.us2.make.com/bvzxj457hrqltu3l08s8cg41a2m3va4a';

/**
 * Dispatch a social media post payload to Make.com
 * @param {Object} postData
 * @param {string} postData.content - The main copy/caption of the post
 * @param {string} [postData.title] - Optional headline/title
 * @param {string[]} [postData.platforms] - Target platforms, e.g. ['facebook', 'instagram', 'threads', 'pinterest']
 * @param {string} [postData.mediaUrl] - Image or graphic URL
 * @param {string} [postData.link] - Destination URL (e.g. https://dashboard.digitallydefined.agency/quiz)
 * @param {string} [postData.callToAction] - Specific CTA instruction
 * @param {string[]} [postData.hashtags] - Relevant hashtags
 * @returns {Promise<{success: boolean, message: string, timestamp: number}>}
 */
export async function publishToMake(postData) {
  if (!postData || !postData.content) {
    throw new Error('postData.content is required for social publishing');
  }

  const payload = {
    source: 'DigitallyDefined-AI-Agent',
    timestamp: new Date().toISOString(),
    content: String(postData.content).trim(),
    title: postData.title ? String(postData.title).trim() : null,
    platforms: Array.isArray(postData.platforms) && postData.platforms.length > 0 
      ? postData.platforms 
      : ['facebook', 'instagram', 'threads'],
    mediaUrl: postData.mediaUrl || null,
    link: postData.link || 'https://dashboard.digitallydefined.agency/quiz',
    callToAction: postData.callToAction || 'Take the free Digital Superpower Quiz to find your roadmap.',
    hashtags: Array.isArray(postData.hashtags) ? postData.hashtags : ['#GenXWomen', '#DigitalAssets', '#FacelessBusiness', '#DigitallyDefined'],
    metadata: {
      brandVoice: 'No-BS Big Bestie',
      audience: 'Gen X Women (40-60)',
      targetFunnel: 'Quiz -> Freedom Number -> Asset Engine',
      ...postData.metadata
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DigitallyDefined-OS-Backend/1.0 (+https://digitallydefined.store)'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        error: `Make.com webhook returned HTTP ${res.status}: ${errText.slice(0, 200)}`,
        payload
      };
    }

    return {
      success: true,
      message: 'Successfully dispatched post to Make.com social publishing scenario.',
      timestamp: Date.now(),
      payload
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to trigger Make.com webhook: ${err.message}`,
      payload
    };
  }
}

export default { publishToMake, MAKE_WEBHOOK_URL };
