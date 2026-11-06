import re

with open('supabase/functions/product-factory/index.ts', 'r') as f:
    content = f.read()

# Find the broken ideaText block and replace it
old_block = content[content.index("  const ideaText = ' +"):content.index("  const prompt = `")]

new_block = """  const ideaText = `Idea: ${c.ideaName}
Problem Solved: ${c.problemSolved}
Niche: ${c.niche}
Audience: ${c.audience}
Monetization: ${c.monetizationType}
Price Potential: ${c.pricePotential}
Speed to Launch: ${c.speedToLaunch}
Suggested Asset 1: ${c.intakeSuggestedAsset1}
Suggested Asset 2: ${c.intakeSuggestedAsset2}
Suggested Asset 3: ${c.intakeSuggestedAsset3}
Background: ${c.intakeBackground}
Skills: ${c.intakeSkills}`;

"""

content = content.replace(old_block, new_block)

with open('supabase/functions/product-factory/index.ts', 'w') as f:
    f.write(content)
print('Fixed')
"