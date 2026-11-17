# ONBOARDING_DASHBOARD_TECH_PLAN.md

## Component map
- OnboardingWizard, StepScore, StepStartHere, StepIdeas, StepChooseAssets, StepBuildAsset, StepPortfolio, StepMoney, StepMonthly.
- Shared: ProgressBar, EmptyState, StepNav.

## Route map
/onboarding, /onboarding/score, /onboarding/start, /onboarding/ideas, /onboarding/choose, /onboarding/build, /onboarding/portfolio, /onboarding/money, /onboarding/monthly.

## State management
- OnboardingContext (step index, completed steps, notion record IDs) stored in localStorage + synced to Notion (Ideas & Intake / Digital Assets).

## API requirements
- Reuse /api action 'notion.create' / 'notion.update' for records; feedback.submit for feedback.

## Recommended build order
1. OnboardingContext + ProgressBar
2. StepScore
3. StepStartHere + StepIdeas
4. StepChooseAssets + StepBuildAsset
5. StepPortfolio + StepMoney + StepMonthly
6. Empty states + progress persistence
