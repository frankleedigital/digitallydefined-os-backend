// ---------------------------------------------------------------------------
// DigitallyDefined Affiliate Engine
//
// Maps audit/assessment findings to affiliate program recommendations.
// Pure logic: no I/O, no dependencies. The Supabase `affiliate_programs`
// table is the source of truth in production; the catalog below is the
// embedded fallback so recommendations work even before the table seeds.
//
// Every recommendation carries WHY it fits the user's findings, so the UI
// can explain the pitch instead of dumping a link.
// ---------------------------------------------------------------------------

export const AFFILIATE_CATALOG = [
  {
    slug: 'ahrefs',
    name: 'Ahrefs',
    category: 'seo',
    commission: 15,
    recurring: true,
    strength: 'Backlink + SEO research depth',
    match: ['low_seo', 'no_keyword_research', 'backlinks', 'competitor_traffic'],
  },
  {
    slug: 'semrush',
    name: 'SEMrush',
    category: 'seo',
    commission: 10,
    recurring: true,
    strength: 'All-in-one SEO + content marketing suite',
    match: ['low_seo', 'no_keyword_research', 'content_gaps'],
  },
  {
    slug: 'surferseo',
    name: 'SurferSEO',
    category: 'seo',
    commission: 10,
    recurring: true,
    strength: 'On-page content scoring and optimization',
    match: ['content_quality', 'no_meta', 'thin_content', 'content_gaps'],
  },
  {
    slug: 'hostinger',
    name: 'Hostinger',
    category: 'hosting',
    commission: 60,
    recurring: false,
    strength: 'Cheap, reliable hosting for first sites',
    match: ['slow_site', 'old_hosting', 'cheap_hosting', 'no_site'],
  },
  {
    slug: 'cloudways',
    name: 'Cloudways',
    category: 'hosting',
    commission: 7,
    recurring: true,
    strength: 'Managed cloud hosting for scaling sites',
    match: ['slow_site', 'scale', 'traffic_growth', 'recurring_hosting'],
  },
  {
    slug: 'namecheap',
    name: 'Namecheap',
    category: 'domain',
    commission: 20,
    recurring: false,
    strength: 'Domains + privacy at the lowest common price',
    match: ['no_domain', 'expensive_domain', 'domain_renewal'],
  },
  {
    slug: 'convertkit',
    name: 'ConvertKit',
    category: 'email',
    commission: 20,
    recurring: true,
    strength: 'Email automation for solo creators',
    match: ['no_email', 'low_email_automation', 'lead_capture', 'newsletter'],
  },
  {
    slug: 'gohighlevel',
    name: 'GoHighLevel',
    category: 'automation',
    commission: 30,
    recurring: true,
    strength: 'Full CRM + funnels + automation for agencies',
    match: ['no_crm', 'manual_followup', 'agency', 'funnels', 'no_automation'],
  },
  {
    slug: 'jasper',
    name: 'Jasper',
    category: 'content',
    commission: 0,
    recurring: false,
    strength: 'AI content generation at scale',
    match: ['content_production', 'ai_content', 'no_writer'],
  },
  {
    slug: 'openrouter',
    name: 'OpenRouter',
    category: 'dev-tools',
    commission: 10,
    recurring: false,
    strength: 'Unified AI model access with routing',
    match: ['ai_readiness', 'model_access', 'cost_optimization'],
  },
];

// Finding tag -> program slug, weighted. More relevant = earlier.
const RECOMMENDATION_MAP = {
  low_seo: ['ahrefs', 'semrush', 'surferseo'],
  no_keyword_research: ['ahrefs', 'semrush'],
  backlinks: ['ahrefs'],
  competitor_traffic: ['ahrefs', 'semrush'],
  content_quality: ['surferseo', 'jasper'],
  no_meta: ['surferseo'],
  thin_content: ['surferseo', 'jasper'],
  content_gaps: ['semrush', 'surferseo'],
  slow_site: ['cloudways', 'hostinger'],
  old_hosting: ['hostinger', 'cloudways'],
  cheap_hosting: ['hostinger'],
  no_site: ['hostinger', 'namecheap'],
  scale: ['cloudways'],
  traffic_growth: ['cloudways', 'semrush'],
  recurring_hosting: ['cloudways'],
  no_domain: ['namecheap'],
  expensive_domain: ['namecheap'],
  domain_renewal: ['namecheap'],
  no_email: ['convertkit', 'gohighlevel'],
  low_email_automation: ['convertkit', 'gohighlevel'],
  lead_capture: ['convertkit', 'gohighlevel'],
  newsletter: ['convertkit'],
  no_crm: ['gohighlevel'],
  manual_followup: ['gohighlevel'],
  agency: ['gohighlevel'],
  funnels: ['gohighlevel', 'convertkit'],
  no_automation: ['gohighlevel'],
  content_production: ['jasper', 'surferseo'],
  ai_content: ['jasper'],
  no_writer: ['jasper'],
  ai_readiness: ['openrouter'],
  model_access: ['openrouter'],
  cost_optimization: ['openrouter'],
};

/**
 * Recommend the top N affiliate programs for a set of finding tags.
 * @param {string[]} tags  Finding tags emitted by an audit/assessment.
 * @param {number} [limit] Max programs to return.
 * @returns {Array<{slug,name,category,commission,recurring,reason,match_tags}>}
 */
export function recommendForAudit(tags = [], limit = 3) {
  const score = new Map(); // slug -> cumulative score
  const why = new Map(); // slug -> {reason, tags}

  for (const tag of tags) {
    const slugs = RECOMMENDATION_MAP[tag];
    if (!slugs) continue;
    slugs.forEach((slug, idx) => {
      // Earlier in the array = more strongly matched.
      const weight = Math.max(1, slugs.length - idx);
      const current = score.get(slug) || 0;
      score.set(slug, current + weight);

      const existing = why.get(slug);
      why.set(slug, {
        reason: existing ? existing.reason : reasonForTag(tag),
        tags: Array.from(new Set([...(existing?.tags || []), tag])),
      });
    });
  }

  const ranked = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);

  const bySlug = new Map(AFFILIATE_CATALOG.map((p) => [p.slug, p]));

  return ranked.map((slug) => {
    const p = bySlug.get(slug);
    const w = why.get(slug);
    return {
      slug,
      name: p?.name || slug,
      category: p?.category || '',
      commission: p?.commission ?? 0,
      recurring: p?.recurring ?? false,
      reason: w?.reason || `Recommended for: ${w?.tags?.join(', ') || 'your audit findings'}`,
      match_tags: w?.tags || [],
    };
  });
}

function reasonForTag(tag) {
  const map = {
    low_seo: 'Your SEO fundamentals are the biggest growth lever — a research tool pays for itself.',
    no_keyword_research: 'You are not doing keyword research; this fills that gap.',
    backlinks: 'You need to understand your backlink profile and competitors’.',
    competitor_traffic: 'You want to see where competitors’ traffic comes from.',
    content_quality: 'Your on-page content is under-optimized for the keywords you target.',
    no_meta: 'Missing or weak meta tags are suppressing your rankings.',
    thin_content: 'Your pages are thin; this helps you reach competitive length and depth.',
    content_gaps: 'There is measurable content you are missing that competitors rank for.',
    slow_site: 'Site speed is hurting you; better hosting is the fastest win.',
    old_hosting: 'Your current host is likely the bottleneck; upgrade for speed.',
    cheap_hosting: 'You can cut hosting cost while staying reliable.',
    no_site: 'You need a site; start with affordable hosting + your domain.',
    scale: 'Your traffic is growing; managed cloud hosting scales without ops work.',
    traffic_growth: 'You have traffic to monetize; pair it with a research suite.',
    recurring_hosting: 'You want predictable hosting cost as you scale.',
    no_domain: 'You need a registered domain to anchor your brand.',
    expensive_domain: 'You are overpaying for your domain.',
    domain_renewal: 'Your domain is up for renewal; lock in a cheaper rate.',
    no_email: 'You have no email list; this is your highest-ROI channel.',
    low_email_automation: 'Your email is manual; automate follow-ups and nurture.',
    lead_capture: 'You need a way to capture and nurture leads.',
    newsletter: 'A newsletter is your retention engine; this builds it.',
    no_crm: 'You are tracking contacts in spreadsheets; this replaces that.',
    manual_followup: 'Follow-ups are manual; this automates them.',
    agency: 'You run an agency; this is the all-in-one client platform.',
    funnels: 'You need funnels; this is the native tool.',
    no_automation: 'Your workflow is manual; this automates it end-to-end.',
    content_production: 'You need to produce content at scale.',
    ai_content: 'You want AI to draft content you then edit.',
    no_writer: 'You do not have a writer; this is your content engine.',
    ai_readiness: 'You want a single, cheap API for many AI models.',
    model_access: 'You need access to multiple models without per-vendor keys.',
    cost_optimization: 'You want to route to the cheapest capable model per task.',
  };
  return map[tag] || 'Relevant to your audit findings.';
}

/**
 * Flatten recommendation tags from raw audit findings.
 * @param {Array<{tag?:string, tags?:string[]}>} findings
 * @returns {string[]}
 */
export function tagsFromFindings(findings = []) {
  const out = new Set();
  for (const f of findings) {
    if (f?.tag) out.add(f.tag);
    if (Array.isArray(f?.tags)) f.tags.forEach((t) => out.add(t));
  }
  return [...out];
}
