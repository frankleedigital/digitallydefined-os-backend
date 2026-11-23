// src/routes/integrations.js
import { checkDashboardApiKey } from '../middleware/auth.js';
import { fetchBrevoStats, fetchFacebookGroup } from '../services/integrations.js';

export async function handleIntegrationStart(req, res, action) {
  if (!checkDashboardApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ success: true, message: 'Integration flow started' });
}

export async function handleIntegrationData(req, res, action) {
  if (!checkDashboardApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const b = req.body || {};

  // No sample metrics. A dashboard that shows $4,200 next to a real $0 is
  // worse than one that shows nothing: it destroys trust the moment a
  // customer looks closely, and it puts fake revenue in a demo.

  if (action === 'integration.googleAnalytics') {
    return res.status(200).json({
      connected: false,
      propertyId: null,
      users30d: null, sessions30d: null, bounceRate: null,
      topPages: [], goalConversions: null, revenue30d: null,
      notice: 'Add your Google Analytics measurement ID and property ID to see live traffic.',
    });
  }

  if (action === 'integration.social') {
    const entries = Object.entries(b.platforms || {});
    if (!entries.length) {
      return res.status(200).json({ connected: false, platforms: {}, followers: null, engagementRate: null, impressions30d: null, topPosts: [] });
    }
    return res.status(200).json({
      connected: true,
      platforms: Object.fromEntries(entries.map(([name]) => [name, { connected: true }])),
      followers: null, engagementRate: null, impressions30d: null,
      topPosts: [],
      notice: 'Your social accounts are connected. Follower and impression data is not read yet.',
    });
  }

  if (action === 'integration.email') {
    if (!b.provider || (!b.hasBrevo && !b.hasMailchimp)) {
      return res.status(400).json({ error: 'No email provider available' });
    }
    const stats = await fetchBrevoStats();
    return res.status(200).json({
      connected: !stats?.error,
      subscribers: stats?.totalSubscribers ?? 0,
      openRate: stats?.emailOpenRate ?? null,
      clickRate: stats?.emailClickRate ?? null,
      campaigns: Array.isArray(stats?.topCampaigns) ? stats.topCampaigns : [],
      revenuePerCampaign: stats?.emailRevenuePerCampaign || '$0',
      ...(stats?.error ? { error: stats.error } : {}),
    });
  }

  if (action === 'integration.community') {
    if (!b.platform || (!b.hasFacebook && !b.hasDiscord && !b.hasMightyNetworks)) {
      return res.status(400).json({ error: 'No community platform available' });
    }
    let members = null;
    let error = null;
    if (b.platform === 'facebook' || process.env.FACEBOOK_GROUP_ID) {
      const group = await fetchFacebookGroup();
      members = group?.member_count ?? null;
      error = group?.error || null;
    }
    return res.status(200).json({
      connected: members !== null,
      members, activeToday: null, growth30d: null, topMembers: [],
      ...(error ? { error } : {}),
    });
  }

  return res.status(404).json({ error: 'Unknown integration action: ' + action });
}

export default { handleIntegrationStart, handleIntegrationData };
