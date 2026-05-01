export type UofTeamRole = "founder" | "core" | "advisor" | "contributor";

export type UofTeamPlatform = "x" | "telegram";

export interface UofTeamContact {
  /** Normalized handle without @ (lowercase). */
  readonly handle: string;
  readonly profileUrl: string;
}

export interface UofTeamMember {
  readonly displayName: string;
  readonly role: UofTeamRole;
  /** Human-readable role for UI (e.g. "Founder"). */
  readonly roleLabel: string;
  readonly x?: UofTeamContact;
  readonly telegram?: UofTeamContact;
}

/**
 * Public team directory for in-app / on-site verification.
 * Extend this list as the team grows. Lookup is case-insensitive; leading @ is ignored.
 * Pasted profile URLs are normalized when possible.
 */
export const UOF_TEAM_MEMBERS: readonly UofTeamMember[] = [
  {
    displayName: "Ikhwanul Husna",
    role: "founder",
    roleLabel: "Founder",
    x: { handle: "ikhwanhsn", profileUrl: "https://x.com/ikhwanhsn" },
    telegram: { handle: "ikhwanhsn", profileUrl: "https://t.me/ikhwanhsn" },
  },
  {
    displayName: "Marvel",
    role: "contributor",
    roleLabel: "BD Intern",
    x: { handle: "mvvlmkl", profileUrl: "https://x.com/mvvlmkl" },
    telegram: { handle: "marvel2603", profileUrl: "https://t.me/marvel2603" },
  },
] as const;

const byXHandle: ReadonlyMap<string, UofTeamMember> = (() => {
  const map = new Map<string, UofTeamMember>();
  for (const member of UOF_TEAM_MEMBERS) {
    if (member.x) map.set(member.x.handle.toLowerCase(), member);
  }
  return map;
})();

const byTelegramHandle: ReadonlyMap<string, UofTeamMember> = (() => {
  const map = new Map<string, UofTeamMember>();
  for (const member of UOF_TEAM_MEMBERS) {
    if (member.telegram) map.set(member.telegram.handle.toLowerCase(), member);
  }
  return map;
})();

export type UofTeamLookupHit = {
  readonly member: UofTeamMember;
  readonly platform: UofTeamPlatform;
  readonly handle: string;
  readonly profileUrl: string;
};

export function normalizeSocialHandle(raw: string, platform: UofTeamPlatform): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (platform === "telegram") {
    const fromUrl = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([a-z0-9_]+)/iu,
    );
    if (fromUrl?.[1]) return fromUrl[1].toLowerCase();
    return trimmed.replace(/^@+/u, "").toLowerCase();
  }

  const fromUrl = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([a-z0-9_]+)/iu,
  );
  if (fromUrl?.[1]) return fromUrl[1].toLowerCase();
  return trimmed.replace(/^@+/u, "").toLowerCase();
}

export function lookupUofTeamContact(
  platform: UofTeamPlatform,
  raw: string,
): UofTeamLookupHit | undefined {
  const handle = normalizeSocialHandle(raw, platform);
  if (!handle) return undefined;

  if (platform === "x") {
    const member = byXHandle.get(handle);
    if (!member?.x) return undefined;
    return {
      member,
      platform: "x",
      handle: member.x.handle,
      profileUrl: member.x.profileUrl,
    };
  }

  const member = byTelegramHandle.get(handle);
  if (!member?.telegram) return undefined;
  return {
    member,
    platform: "telegram",
    handle: member.telegram.handle,
    profileUrl: member.telegram.profileUrl,
  };
}
