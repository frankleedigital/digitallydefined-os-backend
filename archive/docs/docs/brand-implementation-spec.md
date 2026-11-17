# DigitallyDefined — Brand Implementation Spec
Version: 1.0
Status: FROZEN

## 1. Brand Voice & Tone
- **Voice:** Warm but direct. No corporate fluff. Speaks like a trusted co-founder, not a chatbot.
- **Tone:** Confident, actionable, no-bullshit. Uses "you" and "I" naturally.
- **Content rules:** Never use markdown, code fences, emojis, or bullet lists unless explicitly requested. Lead with the recommendation, then explain why.

## 2. Color Palette
**Primary:**
- Orange (CTA/accent): `#F18B25`
- Aqua Blue (secondary/info): `#47B7D4`
- Dark Red (alerts/danger): `#8B1A0A`

**Neutrals:**
- Background: `#FFFCF9` (bone/cream)
- Card/Surface: `#FFFFFF`
- Panel: `#FFFAF5`
- Text primary: `#111111`
- Text muted: `#5F5F5F`
- Border: `#111111`

**States:**
- Success: `#16A34A`
- Warning: `#F18B25`
- Danger: `#8B1A0A`
- Gold: `#EAB308`

**Strict rules:**
- No gradients.
- No off-palette colors.
- Background must remain `#FFFCF9`.

## 3. Typography
**Fonts:**
- Headings: `Inter` (weight 800, letter-spacing `-0.03em`, no transform)
- Body: `DM Sans` (weights 400, 500, 700; line-height `1.6`)

**Scale:**
- Eyebrow: `0.72rem`, uppercase, letter-spacing `0.12em`, weight 800
- H1: `clamp(2.25rem, 5vw, 3rem)`, weight 800
- H2: `clamp(1.75rem, 4vw, 2rem)`, weight 800
- H3: `clamp(1.2rem, 3vw, 1.5rem)`, weight 800
- Body: `1rem`, weight 400, line-height `1.6`
- Muted: `0.9rem`, weight 400, color `#5F5F5F`

**Rules:**
- Headings must always use Inter.
- No non-brand fonts.

## 4. Spacing System
- xs: `8px`
- sm: `16px`
- md: `24px`
- lg: `40px`
- xl: `60px`
- Grid gap: `32px`
- Container max: `1100px`
- Section padding: `clamp(44px, 7vw, 84px) clamp(24px, 4vw, 32px)`

## 5. Geometry / Borders / Shadows
- Border width: `1px solid #111111`
- Border radius: `0px` (never higher)
- Shadows: `none` (strict no-shadow policy)
- Soft brutalist flat depth only: `1px 1px 0px rgba(0,0,0,0.08)` when absolutely necessary

**Rules:**
- NEVER use border-radius higher than 0px.
- NEVER use box-shadows or drop-shadows.
- ALL cards must have a 1px solid black border.

## 6. Component Patterns
**Buttons:**
- Primary: bg `#F18B25`, text `#111111`, border `1px solid #111111`, padding `14px 20px`, font-weight 700, font-size `0.85rem`
- Secondary: bg `#47B7D4`, text `#111111`, same border/padding
- Outline: bg `#FFFCF9`, text `#111111`, same border/padding
- All buttons: border-radius 0, no shadow, inline-flex, gap `0.75rem`

**Cards:**
- bg `#FFFFFF`, border `1px solid #111111`, padding `24px`, border-radius 0
- No shadows

**Inputs:**
- Border `1px solid #111111`, border-radius 0, padding `12px 16px`
- Focus: border stays `#111111`, optional orange outline

**Section:**
- Background `#FFFCF9` or `#FFFAF5`
- Padding: `clamp(44px, 7vw, 84px) clamp(24px, 4vw, 32px)`
- Max width container: `1100px`, centered

**Eyebrow label:**
- Font: Inter, size `0.72rem`, weight 800, uppercase, letter-spacing `0.12em`

**Logo:**
- One word: `DigitallyDefined`
- 1px thin black frame
- `Digitally` in black, `Defined` in orange italic

## 7. Iconography & Illustration
- Style: flat-line-geometric
- Stroke: `1.5px`
- No silhouettes
- No human forms
- No gradients
- No rounded corners

## 8. Layout Rules
- Page structure: Hero → Content → CTA
- Container: `max-width: 1100px`, centered
- Grid gap: `32px`
- Consistent vertical rhythm using spacing scale

## 9. Accessibility
- Contrast ratios: `#111111` on `#FFFCF9` = 18.6:1 (AAA)
- Focus states: visible `#111111` border or orange outline
- Typography minimum: `0.9rem` for muted text
