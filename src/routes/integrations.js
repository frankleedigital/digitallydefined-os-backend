// src/routes/integrations.js
import { checkDashboardApiKey } from '../middleware/auth.js';

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
  
  if (action === 'integration.googleAnalytics') {
    return res.status(200).json({
      users30d: 1240, sessions30d: 1860, bounceRate: 0.42,
      topPages: [{ path: '/', views: 640 }, { path: '/digital-business-os', views: 310 }],
      goalConversions: 88, revenue30d: 4200,
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
      followers: 4820, engagementRate: 0.038, impressions30d: 28400,
      topPosts: [
        { platform: 'facebook', title: 'Reinventing Your Digital Career', impressions: 4200 },
        { platform: 'instagram', title: 'Morning Brand Check-In', impressions: 3100 },
        { platform: 'youtube', title: 'How I Built an Automated Funnel', impressions: 2600 },
      ],
    });
  }
  
  if (action === 'integration.email') {
    if (!b.provider || (!b.hasBrevo && !b.hasMailchimp)) {
      return res.status(400).json({ error: 'No email provider available' });
    }
    return res.status(200).json({
      subscribers: 3120, openRate: 0.282, clickRate: 0.114,
      campaigns: [
        { name: 'Authority Launch Sequence', openRate: 0.312, clickRate: 0.128 },
        { name: 'Evergreen Reputation Funnel', openRate: 0.264, clickRate: 0.104 },
        { name: 'Reinvention Reactivation', openRate: 0.298, clickRate: 0.118 },
      ],
      revenuePerCampaign: 1280,
    });
  }
  
  if (action === 'integration.community') {
    if (!b.platform || (!b.hasFacebook && !b.hasDiscord && !b.hasMightyNetworks)) {
      return res.status(400).json({ error: 'No community platform available' });
    }
    return res.status(200).json({
      members: 1284, activeToday: 96, growth30d: 0.082,
      topMembers: [
        { name: 'Rena Walker', joinedAt: '2026-03-28', status: 'Active' },
        { name: 'Angela Brooks', joinedAt: '2026-03-31', status: 'Onboarding' },
        { name: 'Tasha Monroe', joinedAt: '2026-04-02', status: 'Subscribed' },
        { name: 'Nicole James', joinedAt: '2026-04-04', status: 'Engaged' },
      ],
    });
  }
  
  return res.status(404).json({ error: 'Unknown integration action: ' + action });
}

export default { handleIntegrationStart, handleIntegrationData };
