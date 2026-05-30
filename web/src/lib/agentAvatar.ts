import seedrandom from "seedrandom";

/** Mirrors api `random-avatar-generator` (avataaars.io) for deterministic guest avatars. */
const TOP_TYPES = [
  "NoHair", "Eyepatch", "Hat", "Hijab", "Turban", "WinterHat1", "WinterHat2", "WinterHat3",
  "WinterHat4", "LongHairBigHair", "LongHairBob", "LongHairBun", "LongHairCurly", "LongHairCurvy",
  "LongHairDreads", "LongHairFrida", "LongHairFro", "LongHairFroBand", "LongHairNotTooLong",
  "LongHairShavedSides", "LongHairMiaWallace", "LongHairStraight", "LongHairStraight2",
  "LongHairStraightStrand", "ShortHairDreads01", "ShortHairDreads02", "ShortHairFrizzle",
  "ShortHairShaggyMullet", "ShortHairShortCurly", "ShortHairShortFlat", "ShortHairShortRound",
  "ShortHairShortWaved", "ShortHairSides", "ShortHairTheCaesar", "ShortHairTheCaesarSidePart",
] as const;

const ACCESSORIES_TYPES = [
  "Blank", "Kurt", "Prescription01", "Prescription02", "Round", "Sunglasses", "Wayfarers",
] as const;

const FACIAL_HAIR_TYPES = [
  "Blank", "BeardMedium", "BeardLight", "BeardMagestic", "MoustacheFancy", "MoustacheMagnum",
] as const;

const FACIAL_HAIR_COLORS = [
  "Auburn", "Black", "Blonde", "BlondeGolden", "Brown", "BrownDark", "Platinum", "Red",
] as const;

const CLOTHE_TYPES = [
  "BlazerShirt", "BlazerSweater", "CollarSweater", "GraphicShirt", "Hoodie", "Overall",
  "ShirtCrewNeck", "ShirtScoopNeck", "ShirtVNeck",
] as const;

const EYE_TYPES = [
  "Close", "Cry", "Default", "Dizzy", "EyeRoll", "Happy", "Hearts", "Side", "Squint",
  "Surprised", "Wink", "WinkWacky",
] as const;

const EYEBROW_TYPES = [
  "Angry", "AngryNatural", "Default", "DefaultNatural", "FlatNatural", "RaisedExcited",
  "RaisedExcitedNatural", "SadConcerned", "SadConcernedNatural", "UnibrowNatural", "UpDown",
  "UpDownNatural",
] as const;

const MOUTH_TYPES = [
  "Concerned", "Default", "Disbelief", "Eating", "Grimace", "Sad", "ScreamOpen", "Serious",
  "Smile", "Tongue", "Twinkle", "Vomit",
] as const;

const SKIN_COLORS = [
  "Tanned", "Yellow", "Pale", "Light", "Brown", "DarkBrown", "Black",
] as const;

const HAIR_COLORS = [
  "Auburn", "Black", "Blonde", "BlondeGolden", "Brown", "BrownDark", "PastelPink", "Platinum",
  "Red", "SilverGray",
] as const;

const HAT_COLORS = [
  "Black", "Blue01", "Blue02", "Blue03", "Gray01", "Gray02", "Heather", "PastelBlue",
  "PastelGreen", "PastelOrange", "PastelRed", "PastelYellow", "Pink", "Red", "White",
] as const;

const CLOTHE_COLORS = HAT_COLORS;

function pick<T extends readonly string[]>(options: T, rng: () => number): T[number] {
  return options[Math.floor(rng() * options.length)];
}

/** Same avataaars.io URLs as agent settings "Generate avatar" (seeded). */
export function generateAgentAvatarUrl(seed: string): string {
  const trimmed = seed.trim();
  if (!trimmed) return "";
  const rng = seedrandom(trimmed);
  return (
    "https://avataaars.io/?accessoriesType=" +
    pick(ACCESSORIES_TYPES, rng) +
    "&avatarStyle=Circle&clotheColor=" +
    pick(CLOTHE_COLORS, rng) +
    "&clotheType=" +
    pick(CLOTHE_TYPES, rng) +
    "&eyeType=" +
    pick(EYE_TYPES, rng) +
    "&eyebrowType=" +
    pick(EYEBROW_TYPES, rng) +
    "&facialHairColor=" +
    pick(FACIAL_HAIR_COLORS, rng) +
    "&facialHairType=" +
    pick(FACIAL_HAIR_TYPES, rng) +
    "&hairColor=" +
    pick(HAIR_COLORS, rng) +
    "&hatColor=" +
    pick(HAT_COLORS, rng) +
    "&mouthType=" +
    pick(MOUTH_TYPES, rng) +
    "&skinColor=" +
    pick(SKIN_COLORS, rng) +
    "&topType=" +
    pick(TOP_TYPES, rng)
  );
}

/** Prefer stored avatar; otherwise deterministic guest image from anonymousId. */
export function resolveUserAvatarUrl(
  avatarUrl: string | null | undefined,
  seed: string | null | undefined,
): string | null {
  const stored = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (stored) return stored;
  const s = typeof seed === "string" ? seed.trim() : "";
  if (!s) return null;
  return generateAgentAvatarUrl(s);
}
