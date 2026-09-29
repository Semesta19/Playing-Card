import { CardOption, PromptResult, Suit } from '../types';

export const CARD_OPTIONS: CardOption[] = [
  // Ace
  { id: 'A_Diamond', rank: 'Ace', rankLetter: 'A', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[A] Ace of Diamond ♢' },
  { id: 'A_Heart', rank: 'Ace', rankLetter: 'A', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[A] Ace of Heart ♡' },
  { id: 'A_Club', rank: 'Ace', rankLetter: 'A', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[A] Ace of Club ♧' },
  { id: 'A_Spade', rank: 'Ace', rankLetter: 'A', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[A] Ace of Spade ♤' },

  // Numbers 2 to 10
  { id: '2_Diamond', rank: '2', rankLetter: '2', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[2] 2 of Diamond ♢' },
  { id: '2_Heart', rank: '2', rankLetter: '2', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[2] 2 of Heart ♡' },
  { id: '2_Club', rank: '2', rankLetter: '2', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[2] 2 of Club ♧' },
  { id: '2_Spade', rank: '2', rankLetter: '2', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[2] 2 of Spade ♤' },

  { id: '3_Diamond', rank: '3', rankLetter: '3', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[3] 3 of Diamond ♢' },
  { id: '3_Heart', rank: '3', rankLetter: '3', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[3] 3 of Heart ♡' },
  { id: '3_Club', rank: '3', rankLetter: '3', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[3] 3 of Club ♧' },
  { id: '3_Spade', rank: '3', rankLetter: '3', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[3] 3 of Spade ♤' },

  { id: '4_Diamond', rank: '4', rankLetter: '4', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[4] 4 of Diamond ♢' },
  { id: '4_Heart', rank: '4', rankLetter: '4', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[4] 4 of Heart ♡' },
  { id: '4_Club', rank: '4', rankLetter: '4', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[4] 4 of Club ♧' },
  { id: '4_Spade', rank: '4', rankLetter: '4', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[4] 4 of Spade ♤' },

  { id: '5_Diamond', rank: '5', rankLetter: '5', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[5] 5 of Diamond ♢' },
  { id: '5_Heart', rank: '5', rankLetter: '5', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[5] 5 of Heart ♡' },
  { id: '5_Club', rank: '5', rankLetter: '5', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[5] 5 of Club ♧' },
  { id: '5_Spade', rank: '5', rankLetter: '5', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[5] 5 of Spade ♤' },

  { id: '6_Diamond', rank: '6', rankLetter: '6', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[6] 6 of Diamond ♢' },
  { id: '6_Heart', rank: '6', rankLetter: '6', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[6] 6 of Heart ♡' },
  { id: '6_Club', rank: '6', rankLetter: '6', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[6] 6 of Club ♧' },
  { id: '6_Spade', rank: '6', rankLetter: '6', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[6] 6 of Spade ♤' },

  { id: '7_Diamond', rank: '7', rankLetter: '7', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[7] 7 of Diamond ♢' },
  { id: '7_Heart', rank: '7', rankLetter: '7', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[7] 7 of Heart ♡' },
  { id: '7_Club', rank: '7', rankLetter: '7', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[7] 7 of Club ♧' },
  { id: '7_Spade', rank: '7', rankLetter: '7', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[7] 7 of Spade ♤' },

  { id: '8_Diamond', rank: '8', rankLetter: '8', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[8] 8 of Diamond ♢' },
  { id: '8_Heart', rank: '8', rankLetter: '8', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[8] 8 of Heart ♡' },
  { id: '8_Club', rank: '8', rankLetter: '8', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[8] 8 of Club ♧' },
  { id: '8_Spade', rank: '8', rankLetter: '8', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[8] 8 of Spade ♤' },

  { id: '9_Diamond', rank: '9', rankLetter: '9', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[9] 9 of Diamond ♢' },
  { id: '9_Heart', rank: '9', rankLetter: '9', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[9] 9 of Heart ♡' },
  { id: '9_Club', rank: '9', rankLetter: '9', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[9] 9 of Club ♧' },
  { id: '9_Spade', rank: '9', rankLetter: '9', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[9] 9 of Spade ♤' },

  { id: '10_Diamond', rank: '10', rankLetter: '10', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[10] 10 of Diamond ♢' },
  { id: '10_Heart', rank: '10', rankLetter: '10', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[10] 10 of Heart ♡' },
  { id: '10_Club', rank: '10', rankLetter: '10', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[10] 10 of Club ♧' },
  { id: '10_Spade', rank: '10', rankLetter: '10', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[10] 10 of Spade ♤' },

  // Court Cards: Jack, Queen, King
  { id: 'J_Diamond', rank: 'Jack', rankLetter: 'J', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[J] Jack of Diamond ♢' },
  { id: 'J_Heart', rank: 'Jack', rankLetter: 'J', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[J] Jack of Heart ♡' },
  { id: 'J_Club', rank: 'Jack', rankLetter: 'J', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[J] Jack of Club ♧' },
  { id: 'J_Spade', rank: 'Jack', rankLetter: 'J', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[J] Jack of Spade ♤' },

  { id: 'Q_Diamond', rank: 'Queen', rankLetter: 'Q', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[Q] Queen of Diamond ♢' },
  { id: 'Q_Heart', rank: 'Queen', rankLetter: 'Q', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[Q] Queen of Heart ♡' },
  { id: 'Q_Club', rank: 'Queen', rankLetter: 'Q', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[Q] Queen of Club ♧' },
  { id: 'Q_Spade', rank: 'Queen', rankLetter: 'Q', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[Q] Queen of Spade ♤' },

  { id: 'K_Diamond', rank: 'King', rankLetter: 'K', suit: 'Diamond', suitSymbol: '♢', suitColor: 'red', label: '[K] King of Diamond ♢' },
  { id: 'K_Heart', rank: 'King', rankLetter: 'K', suit: 'Heart', suitSymbol: '♡', suitColor: 'red', label: '[K] King of Heart ♡' },
  { id: 'K_Club', rank: 'King', rankLetter: 'K', suit: 'Club', suitSymbol: '♧', suitColor: 'black', label: '[K] King of Club ♧' },
  { id: 'K_Spade', rank: 'King', rankLetter: 'K', suit: 'Spade', suitSymbol: '♤', suitColor: 'black', label: '[K] King of Spade ♤' },

  // Jokers
  { id: 'Joker_Red', rank: 'Joker', rankLetter: '★', suit: 'None', suitSymbol: '★', suitColor: 'red', label: '[★] Red Joker 🃏' },
  { id: 'Joker_Black', rank: 'Joker', rankLetter: '★', suit: 'None', suitSymbol: '★', suitColor: 'black', label: '[★] Black Joker 🃏' },
];

/**
 * Kustomisasi opsional dari pengguna.
 * Jika kosong, prompt sama persis seperti default (tema kerajaan Ottoman).
 */
export interface CardCustomization {
  pose?: string;
  outfit?: string;
}

/** Batas panjang input kustomisasi (dipakai juga oleh UI) */
export const CUSTOM_TEXT_MAX_LENGTH = 200;

/** Bersihkan input: rapikan spasi/baris baru, buang tanda kutip ganda, batasi panjang */
function sanitizeCustomText(value?: string): string {
  if (!value) return '';
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, CUSTOM_TEXT_MAX_LENGTH);
}

export function getSymbolicObjectDesc(suit: Suit, rank: CardOption['rank']): { symbolicObjectDesc: string; suitColor: 'red' | 'black' } {
  if (rank === 'Joker') {
    return {
      symbolicObjectDesc: 'an ornate golden jester marotte scepter adorned with miniature bells and a smiling masquerade token',
      suitColor: suit === 'None' ? 'red' : 'black',
    };
  }

  switch (suit) {
    case 'Diamond':
      return {
        symbolicObjectDesc: 'golden scepter combined with a balanced scale (justice scales), red diamond gems set in cross-like hilt',
        suitColor: 'red',
      };
    case 'Heart':
      return {
        symbolicObjectDesc: 'golden scepter topped with an ornate heart-shaped ruby emblem',
        suitColor: 'red',
      };
    case 'Club':
      return {
        symbolicObjectDesc: 'golden scepter topped with a trefoil/clover emblem in emerald or gold',
        suitColor: 'black',
      };
    case 'Spade':
      return {
        symbolicObjectDesc: 'golden scepter topped with a spade-shaped onyx or dark gem emblem',
        suitColor: 'black',
      };
    default:
      return {
        symbolicObjectDesc: 'golden scepter with royal emblem',
        suitColor: 'red',
      };
  }
}

export function constructCardPrompt(card: CardOption, custom?: CardCustomization): PromptResult {
  const isJoker = card.rank === 'Joker';
  const { symbolicObjectDesc, suitColor: derivedSuitColor } = getSymbolicObjectDesc(card.suit, card.rank);
  const suitColor = card.suitColor || derivedSuitColor;

  const customPose = sanitizeCustomText(custom?.pose);
  const customOutfit = sanitizeCustomText(custom?.outfit);
  const hasCustom = Boolean(customPose || customOutfit);

  const cardRole = isJoker
    ? `the Royal ${card.suitColor === 'red' ? 'Red' : 'Black'} Joker card character`
    : `the ${card.rank} of ${card.suit} card character`;

  // ===== PAKAIAN =====
  const defaultCostumeDetails = isJoker
    ? `- Luxurious royal court jester and Ottoman-inspired sovereign hybrid costume
- Bi-color tailored velvet coat (${card.suitColor === 'red' ? 'deep burgundy and gold' : 'midnight black and silver'}) with gold trim
- Extravagant gold braided aiguillette (fourragère) draped across the chest
- Intricate gold epaulettes with small chiming bell motifs
- Regal velvet jester crown headpiece with ornate gold filigree and embedded jewels
- Star-shaped royal medal badges pinned on the chest`
    : `- Regal royal attire inspired by Ottoman-era military/court fashion
- Dark navy blue tailored coat with intricate gold embroidery on collar and cuffs
- Gold braided aiguillette (fourragère) draped across the chest
- Gold epaulettes on shoulders
- Deep maroon/burgundy cape or cloak flowing behind, lined in matching color
- Ornate royal crown/headpiece appropriate for rank, red velvet with gold filigree
- Two star-shaped medal badges (white petals, red gemstone center, gold trim) pinned on chest
- Diamond-shaped red gemstones embedded in gold jewelry/accessories throughout`;

  const customCostumeDetails = `- CUSTOM OUTFIT requested by the user: "${customOutfit}"
- Replace the default royal attire with this outfit, drawn in a detailed painterly illustration style with realistic fabric, folds and fine ornamental detail
- The outfit must be tasteful, fully covering and appropriate for a classic royal playing card
- Unless the outfit description specifies its own colors, harmonize the outfit with the card palette (deep navy, maroon/burgundy, antique gold)`;

  const costumeDetails = customOutfit ? customCostumeDetails : defaultCostumeDetails;

  // ===== POSE =====
  const defaultPoseDetails = `Held centered in both hands at chest level, symmetrical composition`;

  const customPoseDetails = `CUSTOM POSE requested by the user: "${customPose}"
- The pose applies to the upper figure; the lower figure is its exact 180-degree rotated mirror copy
- Keep the face clearly visible and recognizable, turned toward the viewer as much as the pose allows
- The symbolic object stays present and clearly visible, held or placed in a way that fits the pose`;

  const poseDetails = customPose ? customPoseDetails : defaultPoseDetails;

  const cornerDetails = isJoker
    ? `Card corners show "JOKER" or star symbol ★ in ${suitColor}, top-left and bottom-right`
    : `Card corners show rank letter ${card.rankLetter} and suit symbol in ${suitColor}, top-left and bottom-right`;

  // Penegasan elemen yang tidak boleh berubah (hanya jika ada kustomisasi)
  const lockedElements = hasCustom
    ? `

LOCKED ELEMENTS (must remain exactly as specified, do NOT change):
- The card theme, cream/ivory background, ornate gold scrollwork, maroon/burgundy border panels, arched gold frame, rounded card corners, corner rank/suit markings, and overall color palette stay identical to the design described here
- Only the ${customPose && customOutfit ? 'pose and outfit' : customPose ? 'pose' : 'outfit'} of the character may differ from the default description
- The mirrored double-headed playing card composition and the exact face identity of the person in the reference image stay unchanged`
    : '';

  const fullPrompt = `CRITICAL DIRECTIVE: PRESERVE EXACT FACE AND PERSON IDENTITY.
Strictly retain the exact facial identity, face shape, eyes, eyebrows, nose, mouth, skin tone, facial hair (if present), and gender of the real person in the attached reference image. DO NOT replace the face with a generic fantasy character or swap the person's biological gender. The individual in the reference image MUST be recognizably depicted wearing royal playing card attire as ${cardRole}.

CHARACTER & COSTUME:
${costumeDetails}

SYMBOLIC OBJECT:
- ${symbolicObjectDesc}
${poseDetails}

COMPOSITION:
- Mirrored/double-headed symmetrical design typical of traditional playing cards (upper half upright, lower half inverted, connected at torso)
- Vertical portrait card format, centered subject
- ${cornerDetails}

BACKGROUND & BORDER:
- Cream/ivory card background
- Ornate gold scrollwork and filigree patterns framing the figure, symmetrical vine and leaf motifs
- Maroon/burgundy decorative border panels with gold trim on left and right edges
- Rounded card corners with thin maroon border outline
- Elegant arched gold frame lines behind the subject's head

COLOR PALETTE:
- Primary: deep navy blue, maroon/burgundy red, antique gold
- Accent: cream/ivory background, white medal details
- Consistent regal, vintage tarot-card aesthetic

STYLE & EXECUTION:
- Digital illustration, painterly semi-realistic royal playing card portrait
- Fine linework on ornamental gold details and embroidered textures
- Maintain the facial likeness of the person in the photo accurately, smoothly integrated into the illustrated card style without changing their recognizable facial structure.${lockedElements}`;

  return {
    fullPrompt,
    rank: card.rank,
    rankLetter: card.rankLetter,
    suit: card.suit,
    suitColor,
    symbolicObjectDesc,
  };
}