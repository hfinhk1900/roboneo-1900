#!/usr/bin/env node

/**
 * Scream AI Prompt Verification Script
 *
 * Compares current prompts against PRD definitions
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// PRD-defined prompts
const PRD_PROMPTS = {
  0: 'Create a dreamy Y2K-style photo of the person from the input image lying on shiny pink satin bedding, holding a large 1990s corded telephone to their ear in a thoughtful, daydream-like pose. The bedroom shows late-90s posters, a bedside lamp as the main light source, and a softly dim nighttime ambience. Use subtle VHS grain, gentle lens bloom, and a cinematic 35mm composition with shallow depth of field. In the doorway of a dim hallway, a masked figure inspired by "Ghost Face" appears as a distant, barely lit silhouette looking toward the subject. Keep the overall mood slightly dark and ominous yet realistic.',

  1: 'Create a moody late-90s film photo of the person from the input image in a small suburban kitchen at night. A pot of popcorn steams on the stove; a corded landline phone is held to their ear. Warm tungsten light spills across tiled countertops and a checkered floor. Add subtle VHS grain, soft lens bloom, and shallow depth of field. Through the dark patio door glass, a masked figure inspired by "Ghost Face" stands outside as a faint silhouette in the rain. Cinematic 35mm composition, realistic lighting and textures.',

  2: 'Generate a nostalgic 90s hallway scene with the person from the input image leaning near blue metal lockers under flickering fluorescent lights. They hold a translucent 90s-style phone receiver with a spiral cord. Posters peel from the walls and a school banner hangs slightly askew. At the far end of the corridor, a masked figure inspired by "Ghost Face" stands partly in shadow near a door window. Use cool greenish fluorescent tones, light film grain, and subtle chromatic aberration.',

  3: 'Create a cinematic, rain-soaked front-porch night scene. The person from the input image stands fully on the porch, in front of the screen door, not inside the doorway. The screen door is slightly open (about 20–30°) on the left edge of frame; the subject is offset on the right third, waist-up, 3/4 angle toward camera at eye level (≈35mm). Hold a 1990s cordless phone naturally to the ear with the nearer hand; the other hand relaxed or lightly touching the door handle. Warm porch light casts a clean pool of light on wet wooden boards; rain streaks glow; wet leaves on the steps; a pumpkin and wind chimes suggest late fall. Beyond the yard, under a streetlamp, a masked figure inspired by "Ghost Face" reads only as a faint, blurred silhouette in the rain. Add reflective puddles, light mist, subtle rim light, and a gentle anamorphic flare. Keep all limbs natural and unwarped; the subject must not intersect or align with doorframe lines.',

  4: 'Produce a dreamy 90s cinema photo with the person from the input image seated in a red velvet theater seat, holding popcorn and a soda. A bright projector beam cuts through dust in the air; lens bloom and shallow depth of field isolate the subject from the rows of seats. Two rows behind, a masked figure inspired by "Ghost Face" sits motionless in the aisle shadow, barely lit by the screen glow. Keep a cool-blue highlight vs warm-red seats palette and mild film grain.',

  5: 'Create a late-90s house-party living room scene as a SOLO portrait. Show EXACTLY ONE HUMAN: the person from the input image lounging on a vintage couch, phone to ear. No other people anywhere. Use party props only (no guests): string lights across the wall, a few cassette tapes and scattered red plastic cups on the coffee table. A CRT TV in the corner shows soft static. The hallway and its doorway in the background are physically EMPTY. Show ONE masked figure inspired by "Ghost Face" as a faint reflection INSIDE a hallway wall mirror ONLY — the figure must NOT exist in real space. Outside the mirror there is NO masked figure. Tight mid-shot at eye level (~35mm); the subject occupies most of the frame (≈60–70% width). Shallow depth of field; disposable-camera flash aesthetic with subtle film grain. Keep identity consistent with the input (facial proportions, hairline/length, skin tone). No blood, no weapons, no gore.',
};

const PRESET_NAMES = {
  0: 'Dreamy Y2K Bedroom',
  1: 'Suburban Kitchen',
  2: 'School Hallway',
  3: 'Rainy Front Porch',
  4: 'Movie Theater',
  5: 'House Party',
};

// Load current prompts from constants file
const constantsPath = './src/features/scream-ai/constants.ts';
const fs = require('fs');

try {
  const content = fs.readFileSync(constantsPath, 'utf-8');

  log('\n' + '='.repeat(80), 'cyan');
  log('🔍 Scream AI Prompt Verification', 'bright');
  log('='.repeat(80) + '\n', 'cyan');

  let allMatch = true;

  for (const [id, prdPrompt] of Object.entries(PRD_PROMPTS)) {
    const name = PRESET_NAMES[id];

    log(`\n📝 Scene ${id}: ${name}`, 'cyan');
    log('-'.repeat(80), 'cyan');

    // Extract prompt from file using regex
    const regex = new RegExp(
      `id: '${id}',[\\s\\S]*?prompt:\\s*'([\\s\\S]*?)',\\s*icon:`
    );
    const match = content.match(regex);

    if (!match) {
      log('❌ Could not extract prompt from constants file', 'red');
      allMatch = false;
      continue;
    }

    const currentPrompt = match[1].trim();

    if (currentPrompt === prdPrompt) {
      log('✅ MATCH - Prompt matches PRD', 'green');
    } else {
      log('❌ MISMATCH - Prompt differs from PRD', 'red');
      allMatch = false;

      // Show differences
      if (currentPrompt.length < prdPrompt.length) {
        log(
          `   Current is shorter: ${currentPrompt.length} vs ${prdPrompt.length} chars`,
          'yellow'
        );
      } else if (currentPrompt.length > prdPrompt.length) {
        log(
          `   Current is longer: ${currentPrompt.length} vs ${prdPrompt.length} chars`,
          'yellow'
        );
      }

      // Find first difference
      for (
        let i = 0;
        i < Math.max(currentPrompt.length, prdPrompt.length);
        i++
      ) {
        if (currentPrompt[i] !== prdPrompt[i]) {
          const start = Math.max(0, i - 20);
          const end = Math.min(currentPrompt.length, i + 80);
          log(`\n   First diff at position ${i}:`, 'yellow');
          log(
            `   Current:  ...${currentPrompt.substring(start, end)}...`,
            'yellow'
          );
          log(
            `   PRD:      ...${prdPrompt.substring(start, end)}...`,
            'yellow'
          );
          break;
        }
      }
    }
  }

  // Check IDENTITY_SUFFIX
  log('\n\n📝 IDENTITY_SUFFIX', 'cyan');
  log('-'.repeat(80), 'cyan');

  const expectedSuffix =
    'Use the person from the input image as the subject. Keep identity strictly consistent: preserve facial geometry and proportions, skin tone, eye color, hairline and hair length, and any facial hair if present. Do not change gender presentation, age, body shape, hairstyle length, or clothing style; if uncertain, keep neutral, everyday clothing similar to the input photo. Do not add or remove makeup, jewelry, nail polish, long eyelashes, or accessories unless already present. Do not feminize or masculinize the subject. Maintain natural-looking anatomy and hands. No blood, no injuries, no gore, no visible weapons, no violence. The masked figure must remain a distant, dim silhouette only.';

  const suffixMatch = content.match(
    /export const IDENTITY_SUFFIX\s*=\s*'([^']+)'/
  );

  if (suffixMatch && suffixMatch[1] === expectedSuffix) {
    log('✅ IDENTITY_SUFFIX matches PRD', 'green');
  } else {
    log('❌ IDENTITY_SUFFIX differs from PRD', 'red');
    allMatch = false;
  }

  // Check NEGATIVE_PROMPT
  log('\n📝 NEGATIVE_PROMPT', 'cyan');
  log('-'.repeat(80), 'cyan');

  const negativeMatch = content.match(
    /export const NEGATIVE_PROMPT\s*=\s*'([^']+)'/
  );

  if (negativeMatch) {
    log(`✅ Found: "${negativeMatch[1]}"`, 'green');
  } else {
    log('❌ NEGATIVE_PROMPT not found', 'red');
    allMatch = false;
  }

  // Summary
  log('\n' + '='.repeat(80), 'cyan');
  if (allMatch) {
    log('✅ ALL PROMPTS MATCH PRD SPECIFICATIONS', 'green');
  } else {
    log('❌ SOME PROMPTS DIFFER FROM PRD - REVIEW REQUIRED', 'red');
  }
  log('='.repeat(80) + '\n', 'cyan');

  process.exit(allMatch ? 0 : 1);
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
