import { CardOption, PromptResult, Rank, RankLetter, Suit, SuitSymbol, SuitColor } from '../types';

const SUITS: Array<{ suit: Suit; symbol: SuitSymbol; color: SuitColor }> = [
  { suit: 'Diamond', symbol: '♢', color: 'red' },
  { suit: 'Heart', symbol: '♡', color: 'red' },
  { suit: 'Club', symbol: '♧', color: 'black' },
  { suit: 'Spade', symbol: '♤', color: 'black' },
];

const RANKS: Array<{ rank: Rank; letter: RankLetter }> = [
  { rank: 'Ace', letter: 'A' },
  { rank: '2', letter: '2' },
  { rank: '3', letter: '3' },
  { rank: '4', letter: '4' },
  { rank: '5', letter: '5' },
  { rank: '6', letter: '6' },
  { rank: '7', letter: '7' },
  { rank: '8', letter: '8' },
  { rank: '9', letter: '9' },
  { rank: '10', letter: '10' },
  { rank: 'Jack', letter: 'J' },
  { rank: 'Queen', letter: 'Q' },
  { rank: 'King', letter: 'K' },
];

export const CARD_OPTIONS: CardOption[] = [
  // Ace, 2-10, Jack, Queen, King x 4 suit
  ...RANKS.flatMap(({ rank, letter }) =>
    SUITS.map(({ suit, symbol, color }) => ({
      id: `${letter}_${suit}`,
      rank,
      rankLetter: letter,
      suit,
      suitSymbol: symbol,
      suitColor: color,
      label: `[${letter}] ${rank} of ${suit} ${symbol}`,
    }))
  ),

  // Jokers
  { id: 'Joker_Red', rank: 'Joker', rankLetter: '★', suit: 'None', suitSymbol: '★', suitColor: 'red', label: '[★] Red Joker 🃏' },
  { id: 'Joker_Black', rank: 'Joker', rankLetter: '★', suit: 'None', suitSymbol: '★', suitColor: 'black', label: '[★] Black Joker 🃏' },
];

/**
 * Kustomisasi opsional dari pengguna.
 * Jika kosong, prompt sama seperti default (tema kerajaan Ottoman).
 */
export interface CardCustomization {
  pose?: string;
  outfit?: string;
  /** Huruf/tulisan di sudut kartu, mis. "V" (menggantikan J/Q/K/A/angka) */
  rankLetter?: string;
  /** Nama karakter kartu, mis. "Valet" (menggantikan Jack/Queen/King/Ace) */
  rankName?: string;
}

/** Batas panjang input kustomisasi (dipakai juga oleh UI) */
export const CUSTOM_TEXT_MAX_LENGTH = 200;
/** Batas panjang huruf di sudut kartu (mis. "V", "Kn", "10") */
export const RANK_LETTER_MAX_LENGTH = 3;
/** Batas panjang nama karakter kartu (mis. "Valet") */
export const RANK_NAME_MAX_LENGTH = 20;

/**
 * Preset nama kartu (opsional, dipakai UI sebagai tombol cepat).
 * Silakan tambah/ubah sesuai kebutuhan.
 */
export const RANK_NAME_PRESETS: Array<{ letter: string; name: string }> = [
  { letter: 'V', name: 'Valet' },
  { letter: 'D', name: 'Dame' },
  { letter: 'R', name: 'Roi' },
  { letter: 'B', name: 'Bube' },
  { letter: 'P', name: 'Prince' },
];

/** Bersihkan huruf sudut kartu: tanpa spasi/kutip, huruf besar, maks. 3 karakter */
export function sanitizeRankLetter(value?: string): string {
  if (!value) return '';
  return Array.from(value.replace(/[\s"'`\\]/g, ''))
    .slice(0, RANK_LETTER_MAX_LENGTH)
    .join('')
    .toUpperCase();
}

/** Bersihkan nama karakter kartu: rapikan spasi, buang kutip, batasi panjang */
export function sanitizeRankName(value?: string): string {
  if (!value) return '';
  return Array.from(
    value
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/["`\\]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
    .slice(0, RANK_NAME_MAX_LENGTH)
    .join('')
    .trim();
}

/**
 * Terapkan nama kustom ke kartu terpilih.
 * - Kosong  -> kartu asli dikembalikan apa adanya.
 * - Joker   -> tidak berubah (Joker tidak punya huruf J/Q/K).
 * Hasilnya dipakai untuk tampilan kartu, label, nama file, dan prompt.
 */
export function applyCardNameOverride(
  card: CardOption,
  custom?: Pick<CardCustomization, 'rankLetter' | 'rankName'>
): CardOption {
  if (card.rank === 'Joker') return card;

  const letter = sanitizeRankLetter(custom?.rankLetter);
  const name = sanitizeRankName(custom?.rankName);
  if (!letter && !name) return card;

  const rankLetter = letter || card.rankLetter;
  const rank = name || card.rank;

  return {
    ...card,
    rank,
    rankLetter,
    label: `[${rankLetter}] ${rank} of ${card.suit} ${card.suitSymbol}`,
  };
}

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

export function constructCardPrompt(baseCard: CardOption, custom?: CardCustomization): PromptResult {
  // Terapkan nama/huruf kustom (jika ada) sebelum menyusun prompt
  const card = applyCardNameOverride(baseCard, custom);
  const isJoker = card.rank === 'Joker';
  const { symbolicObjectDesc, suitColor: derivedSuitColor } = getSymbolicObjectDesc(card.suit, card.rank);
  const suitColor = card.suitColor || derivedSuitColor;

  const customPose = sanitizeCustomText(custom?.pose);
  const customOutfit = sanitizeCustomText(custom?.outfit);
  const customRankLetter = isJoker ? '' : sanitizeRankLetter(custom?.rankLetter);
  const customRankName = isJoker ? '' : sanitizeRankName(custom?.rankName);
  const hasCustomName = Boolean(customRankLetter || customRankName);
  const hasCustom = Boolean(customPose || customOutfit || hasCustomName);

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
  const defaultPoseDetails = `Held centered in both hands at chest level, symmetrical composition
- The head may be posed naturally (a slight tilt or gentle turn is welcome); it does NOT have to copy the head angle of the reference photo`;

  const customPoseDetails = `CUSTOM POSE requested by the user: "${customPose}"
- The pose applies to the upper figure; the lower figure is its exact 180-degree rotated mirror copy
- The head angle, head tilt, gaze direction and facial expression must follow this pose naturally and do NOT need to face the camera or match the reference photo
- The face must remain visible enough to be recognized as the same person (avoid hiding the face or turning it fully away)
- The symbolic object stays present and clearly visible, held or placed in a way that fits the pose`;

  const poseDetails = customPose ? customPoseDetails : defaultPoseDetails;

  const cornerDetails = isJoker
    ? `Card corners show "JOKER" or star symbol ★ in ${suitColor}, top-left and bottom-right`
    : customRankLetter
      ? `Card corners show the rank marking exactly "${card.rankLetter}" and the suit symbol in ${suitColor}, top-left and bottom-right. The marking "${card.rankLetter}" is a custom name for this card: render it exactly as written, clearly legible, and do NOT replace it with J, Q, K or A`
      : `Card corners show rank letter ${card.rankLetter} and suit symbol in ${suitColor}, top-left and bottom-right`;

  // Bagian yang boleh berbeda dari default
  const changedParts = [
    customPose && 'pose',
    customOutfit && 'outfit',
    hasCustomName && 'card name / corner marking text',
  ].filter(Boolean) as string[];

  // Penegasan elemen yang tidak boleh berubah (hanya jika ada kustomisasi)
  const lockedElements = hasCustom
    ? `

LOCKED ELEMENTS (must remain exactly as specified, do NOT change):
- The card theme, cream/ivory background, ornate gold scrollwork, maroon/burgundy border panels, arched gold frame, rounded card corners, ${hasCustomName ? 'corner marking placement and style' : 'corner rank/suit markings'}, and overall color palette stay identical to the design described here
- Only the ${changedParts.join(' and ')}${hasCustomName ? '' : ' of the character'} may differ from the default description
- The mirrored double-headed playing card composition and the facial identity of the person in the reference image stay unchanged (identity is locked; head angle and expression are free)`
    : '';

  const fullPrompt = `CRITICAL DIRECTIVE: PRESERVE EXACT FACE IDENTITY, NOT THE PHOTO'S ANGLE.
The attached reference image is used ONLY to define WHO the person is. Strictly retain the person's facial identity: bone structure, face shape, eyes, eyebrows, nose, mouth, skin tone, facial hair (if present), hairline/hairstyle, and gender. DO NOT replace the face with a generic fantasy character or swap the person's biological gender. The individual in the reference image MUST be recognizably depicted wearing royal playing card attire as ${cardRole}.
Do NOT copy the head angle, head tilt, facial expression, camera framing, lighting, clothing, or background from the reference photo. Re-draw the same person naturally in the requested pose: head orientation, tilt, gaze and expression are free to differ from the photo (three-quarter view, a turned or tilted head, looking up or sideways, a different expression are all allowed) while the person remains unmistakably the same individual.

CHARACTER & COSTUME:
${costumeDetails}

SYMBOLIC OBJECT & POSE:
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
- Maintain the facial likeness (identity) of the person in the photo accurately, smoothly integrated into the illustrated card style, even when the head is turned or tilted.${lockedElements}`;

  return {
    fullPrompt,
    rank: card.rank,
    rankLetter: card.rankLetter,
    suit: card.suit,
    suitColor,
    symbolicObjectDesc,
  };
}