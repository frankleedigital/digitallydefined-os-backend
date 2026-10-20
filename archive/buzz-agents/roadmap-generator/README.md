# Roadmap Generator Agent

**Execution Layer**: Buzz Agents  
**Dependencies**: OmniRoute, Supabase  
**Purpose**: Generate personalized digital roadmap based on user's superpower classification

## Role

This agent takes the superpower classification from the Digital Superpower Quiz Agent and generates a personalized 30-day and 90-day roadmap with recommended tools and milestone breakdowns.

## Integration Points

- **Quiz Flow**: Triggered after quiz completes and superpower is determined
- **Email Sequence**: Roadmap details sent via personalized email sequence
- **Dashboard Display**: Shown in user dashboard within the dashboard app
- **Progress Tracking**: Saved to Supabase for tracking completion against milestones

## Tone & Style

- No hype language ("transform your life!", "act now!")
- Direct, practical, systems-oriented
- Faceless-by-design focus
- Gen X appropriate tone (mature, experienced)

## See Also

- Digital Superpower Quiz Agent (input source)
- AntiGravity integration (for automated follow-ups)
- DigitallyDefined brand voice guidelines
