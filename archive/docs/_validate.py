import os, subprocess, json

OLD = 'digitallydefined-os-backend'

copied = ['src/config/constants.js', 'src/config/env.js', 'src/config/index.js', 'src/config/models.js',
 'src/schemas/audience.js', 'src/schemas/chat.js', 'src/schemas/competition.js',
 'src/schemas/dashboard.js', 'src/schemas/index.js', 'src/schemas/niche.js',
 'src/schemas/onboarding.js', 'src/schemas/opportunities.js', 'src/schemas/product.js',
 'src/schemas/quiz.js', 'src/schemas/roadmap.js', 'src/schemas/scorecard.js',
 'src/schemas/social.js', 'src/schemas/trends.js',
 'src/utils/errorHandler.js', 'src/utils/formatters.js', 'src/utils/index.js', 'src/utils/respond.js',
 'src/agents/audience.js', 'src/agents/competition.js', 'src/agents/index.js',
 'src/agents/niche.js', 'src/agents/opportunities.js', 'src/agents/product.js',
 'src/agents/quiz.js', 'src/agents/roadmap.js', 'src/agents/scorecard.js',
 'src/agents/social.js', 'src/agents/trends.js',
 'src/routes/setModel.js', 'src/routes/niche.js', 'src/routes/onboardingDispatch.js',
 'src/routes/product.js', 'src/routes/quizDispatch.js', 'src/routes/roadmap.js',
 'src/routes/scorecard.js', 'src/routes/social.js', 'src/routes/trends.js',
 'src/routes/businessPartner.js', 'src/routes/dispatch.js', 'src/routes/fastapiDispatch.js',
 'src/routes/integrationsDispatch.js', 'src/routes/intelligenceDispatch.js',
 'src/services/aiRouter.js', 'src/services/antigravity.js', 'src/services/fastapi.js',
 'src/services/githubEditor.js', 'src/services/index.js', 'src/services/integrations.js',
 'src/services/onboarding.js', 'src/services/premium.js', 'src/services/supabaseRest.js',
 'src/services/websiteEditor.js', 'src/services/websitePlanner.js',
 'src/services/ai.js', 'src/services/brevo.js', 'src/services/notion.js',
 'src/workflows/index.js', 'src/workflows/intelligencePipeline.js', 'src/workflows/sync.js']

fail = []
for rel in copied:
    p = os.path.join(OLD, rel)
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode != 0:
        fail.append((rel, r.stderr.strip().splitlines()[:3]))
        print('FAIL', rel)
print()
print('node-checked:', len(copied) - len(fail), '/', len(copied))

ts = ['supabase/functions/content/index.ts', 'supabase/functions/omniroute/index.ts',
 'supabase/functions/quiz-roadmap/index.ts', 'supabase/functions/quiz-submit/index.ts',
 'supabase/functions/reputation/index.ts', 'supabase/functions/_shared/ai-client.ts',
 'supabase/functions/_shared/http-utils.ts', 'supabase/functions/_shared/quiz-personas.ts',
 'supabase/functions/_shared/supabase-store.ts']
for rel in ts:
    print(('OK  ' if os.path.getsize(os.path.join(OLD, rel)) > 0 else 'EMPTY'), rel)
