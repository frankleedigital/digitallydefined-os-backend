# Digital Superpower Quiz Agent

**Execution Layer**: Buzz Agents  
**Dependencies**: OmniRoute, Supabase, AntiGravity  
**Purpose**: Identify a user's digital superpower using a structured personality-based quiz

## Role

This agent powers the Digital Superpower Quiz on the DigitallyDefined website. It analyzes user responses to a 7-question quiz, classifies their digital superpower, and recommends personalized pathways for building faceless digital real estate.

## Integration Points

- **Quiz Flow**: Called after user completes the quiz on `/quiz` page
- **Roadmap Generator**: Output feeds directly into Roadmap Generator Agent
- **Email Sequence**: Triggers personalized onboarding email via AntiGravity
- **Community Onboarding**: Adds user to appropriate community segment
- **Data Storage**: Results saved to Supabase `quiz_results` table

## Tone & Style

- No hype. No urgency. No "hustle" language.
- Direct, practical, clear - like a seasoned digital marketer speaking
- Faceless-by-design emphasis
- Gen X appropriate tone (mature, experienced, no millennial slang)

## Output

Returns JSON with:
- `superpowerName` (Builder/Creator/Educator/Strategist/Connector)
- `superpowerDescription`
- `recommendedPathways` (array of 3-5 actionable items)
- `confidenceScore` (0-1)

## See Also

- Roadmap Generator Agent (follow-up agent)
- AntiGravity integration (for email sequences)
- DigitallyDefined brand guidelines
