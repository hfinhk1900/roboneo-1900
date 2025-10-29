export const STICKER_STYLE_CONFIGS = {
  ios: {
    name: 'iOS Sticker',
    userPrompt:
      'Create an iOS emoji sticker from the object in the uploaded image. Depict it as a smooth, vibrant 3D cartoon object, with a clean white edge. Render it against a pure white background.',
  },
  pixel: {
    name: 'Pixel Art',
    userPrompt:
      'Transform into pixel art style sticker: 8-bit retro aesthetic, blocky pixels, limited color palette, bold white outline, transparent background',
  },
  lego: {
    name: 'LEGO',
    userPrompt:
      'Convert to LEGO minifigure style sticker: blocky construction, plastic appearance, bright primary colors, simplified features, bold white outline, transparent background',
  },
  snoopy: {
    name: 'Snoopy',
    userPrompt:
      'Transform into Snoopy cartoon style sticker: simple lines, minimalist design, charming and cute, bold white outline, transparent background',
  },
} as const;

export type StickerStyle = keyof typeof STICKER_STYLE_CONFIGS;

export function getStickerPrompt(style: string): string | undefined {
  const cfg = STICKER_STYLE_CONFIGS[style as StickerStyle];
  return cfg?.userPrompt;
}

export function getStickerStyleName(style: string): string | undefined {
  const cfg = STICKER_STYLE_CONFIGS[style as StickerStyle];
  return cfg?.name;
}
