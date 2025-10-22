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
    icon: '/scream-ai/y2k-style-min.png',
  },
  {
    id: '1',
    name: 'Suburban Kitchen',
    prompt:
      'Create a moody late-90s film photo of the person from the input image in a small suburban kitchen at night. A pot of popcorn steams on the stove; a corded landline phone is held to their ear. Warm tungsten light spills across tiled countertops and a checkered floor. Add subtle VHS grain, soft lens bloom, and shallow depth of field. Through the dark patio door glass, a masked figure inspired by "Ghost Face" stands outside as a faint silhouette in the rain. Cinematic 35mm composition, realistic lighting and textures.',
    icon: '/scream-ai/suburban-kitchen-min.png',
  },
  {
    id: '2',
    name: 'School Hallway',
    prompt:
      'Generate a nostalgic 90s hallway scene with the person from the input image leaning near blue metal lockers under flickering fluorescent lights. They hold a translucent 90s-style phone receiver with a spiral cord. Posters peel from the walls and a school banner hangs slightly askew. At the far end of the corridor, a masked figure inspired by "Ghost Face" stands partly in shadow near a door window. Use cool greenish fluorescent tones, light film grain, and subtle chromatic aberration.',
    icon: '/scream-ai/school-hallway-min.png',
  },
  {
    id: '3',
    name: 'Rainy Front Porch',
    prompt:
      'Create a cinematic, rain-soaked front-porch night scene. The person from the input image stands fully on the porch, in front of the screen door, not inside the doorway. The screen door is slightly open (about 20–30°) on the left edge of frame; the subject is offset on the right third, waist-up, 3/4 angle toward camera at eye level (≈35mm). Hold a 1990s cordless phone naturally to the ear with the nearer hand; the other hand relaxed or lightly touching the door handle. Warm porch light casts a clean pool of light on wet wooden boards; rain streaks glow; wet leaves on the steps; a pumpkin and wind chimes suggest late fall. Beyond the yard, under a streetlamp, a masked figure inspired by "Ghost Face" reads only as a faint, blurred silhouette in the rain. Add reflective puddles, light mist, subtle rim light, and a gentle anamorphic flare. Keep all limbs natural and unwarped; the subject must not intersect or align with doorframe lines.',
    icon: '/scream-ai/rainy-front-porch-min.png',
  },
  {
    id: '4',
    name: 'Movie Theater',
    prompt:
      'Produce a dreamy 90s cinema photo with the person from the input image seated in a red velvet theater seat, holding popcorn and a soda. A bright projector beam cuts through dust in the air; lens bloom and shallow depth of field isolate the subject from the rows of seats. Two rows behind, a masked figure inspired by "Ghost Face" sits motionless in the aisle shadow, barely lit by the screen glow. Keep a cool-blue highlight vs warm-red seats palette and mild film grain.',
    icon: '/scream-ai/movie-theater-min.png',
  },
  {
    id: '5',
    name: 'House Party',
    prompt:
      'Create a late-90s house-party living room scene as a SOLO portrait. Show EXACTLY ONE HUMAN: the person from the input image lounging on a vintage couch, phone to ear. No other people anywhere. Use party props only (no guests): string lights across the wall, a few cassette tapes and scattered red plastic cups on the coffee table. A CRT TV in the corner shows soft static. The hallway and its doorway in the background are physically EMPTY. Show ONE masked figure inspired by "Ghost Face" as a faint reflection INSIDE a hallway wall mirror ONLY — the figure must NOT exist in real space. Outside the mirror there is NO masked figure. Tight mid-shot at eye level (~35mm); the subject occupies most of the frame (≈60–70% width). Shallow depth of field; disposable-camera flash aesthetic with subtle film grain. Keep identity consistent with the input (facial proportions, hairline/length, skin tone). No blood, no weapons, no gore.',
    icon: '/scream-ai/party-room-min.png',
  },
];

export const SCREAM_PRESET_MAP = new Map(
  SCREAM_PRESETS.map((preset) => [preset.id, preset])
);
