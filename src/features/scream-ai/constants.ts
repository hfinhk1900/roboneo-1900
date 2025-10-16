export const IDENTITY_SUFFIX =
  'Use the person from the input image as the subject. Keep identity strictly consistent: preserve facial geometry and proportions, skin tone, eye color, hairline and hair length, and any facial hair if present. Do not change gender presentation, age, body shape, hairstyle length, or clothing style; if uncertain, keep neutral, everyday clothing similar to the input photo. Do not add or remove makeup, jewelry, nail polish, long eyelashes, or accessories unless already present. Do not feminize or masculinize the subject. Maintain natural-looking anatomy and hands. No blood, no injuries, no gore, no visible weapons, no violence. The masked figure must remain a distant, dim silhouette only.';

export const NEGATIVE_PROMPT =
  'No gender changes, no makeup, no jewelry, no gore, no violence, no weapon, no anatomy distortions.';

export type ScreamPreset = {
  id: string;
  name: string;
  prompt: string;
  icon: string;
};

export const SCREAM_PRESETS: ScreamPreset[] = [
  {
    id: '0',
    name: 'Dreamy Y2K Bedroom',
    prompt:
      'Create a dreamy Y2K-style photo of the person from the input image lying on shiny pink satin bedding, holding a large 1990s corded telephone to their ear in a thoughtful, daydream-like pose. The bedroom shows late-90s posters, a bedside lamp as the main light source, and a softly dim nighttime ambience. Use subtle VHS grain, gentle lens bloom, and a cinematic 35mm composition with shallow depth of field. In the doorway of a dim hallway, a masked figure inspired by "Ghost Face" appears as a distant, barely lit silhouette looking toward the subject. Keep the overall mood slightly dark and ominous yet realistic.',
    icon: '/scream-preset-bedroom.webp',
  },
  {
    id: '1',
    name: 'Suburban Kitchen',
    prompt:
      'Create a moody late-90s film photo of the person from the input image in a small suburban kitchen at night. A pot of popcorn steams on the stove; a corded landline phone is held to their ear. Warm tungsten light spills across tiled countertops and a checkered floor. Add subtle VHS grain, soft lens bloom, and shallow depth of field. Through the dark patio door glass, a masked figure inspired by "Ghost Face" stands outside as a faint silhouette in the rain. Cinematic 35mm composition, realistic lighting and textures.',
    icon: '/scream-preset-kitchen.webp',
  },
  {
    id: '2',
    name: 'School Hallway',
    prompt:
      'Generate a nostalgic 90s hallway scene with the person from the input image leaning near blue metal lockers under flickering fluorescent lights. They hold a translucent 90s-style phone receiver with a spiral cord. Posters peel from the walls and a school banner hangs slightly askew. At the far end of the corridor, a masked figure inspired by "Ghost Face" stands partly in shadow near a door window. Use cool greenish fluorescent tones, light film grain, and subtle chromatic aberration.',
    icon: '/scream-preset-hallway.webp',
  },
  {
    id: '3',
    name: 'Rainy Front Porch',
    prompt:
      'Create a cinematic, rain-soaked front-porch scene featuring the person from the input image opening a screen door while holding a 90s cordless phone. A porch light casts a warm pool of light; wet leaves glisten on wooden steps; a pumpkin and wind chimes suggest late fall. In the distance under a streetlamp, a masked figure inspired by "Ghost Face" appears as a blurred silhouette through the rain. Add reflective puddles, light mist, and a gentle anamorphic flare.',
    icon: '/scream-preset-porch.webp',
  },
  {
    id: '4',
    name: 'Movie Theater',
    prompt:
      'Produce a dreamy 90s cinema photo with the person from the input image seated in a red velvet theater seat, holding popcorn and a soda. A bright projector beam cuts through dust in the air; lens bloom and shallow depth of field isolate the subject from the rows of seats. Two rows behind, a masked figure inspired by "Ghost Face" sits motionless in the aisle shadow, barely lit by the screen glow. Keep a cool-blue highlight vs warm-red seats palette and mild film grain.',
    icon: '/scream-preset-theater.webp',
  },
  {
    id: '5',
    name: 'House Party',
    prompt:
      'Create a late-90s house-party living room scene with the person from the input image lounging on a vintage couch, phone to ear, surrounded by string lights, cassette tapes, and scattered red plastic cups. A CRT TV shows soft static in the corner. In a hallway mirror behind them, a masked figure inspired by "Ghost Face" is reflected standing at the end of the corridor, lit only by a dim lamp. Add disposable-camera flash aesthetics and mild motion blur on background partygoers.',
    icon: '/scream-preset-party.webp',
  },
];

export const SCREAM_PRESET_MAP = new Map(
  SCREAM_PRESETS.map((preset) => [preset.id, preset])
);
