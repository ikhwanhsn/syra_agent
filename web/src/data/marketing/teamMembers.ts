export type SyraTeamRole = "founder" | "core" | "advisor" | "contributor";

export type SyraTeamPlatform = "x" | "telegram";

export interface SyraTeamContact {
  /** Normalized handle without @ (lowercase). */
  readonly handle: string;
  readonly profileUrl: string;
}

export interface SyraTeamMember {
  readonly displayName: string;
  readonly role: SyraTeamRole;
  /** Human-readable role for UI (e.g. "Founder"). */
  readonly roleLabel: string;
  readonly x?: SyraTeamContact;
  readonly telegram?: SyraTeamContact;
}

/**
 * Public Syra team directory for in-app / on-site verification.
 * Extend this list as the team grows. Lookup is case-insensitive; leading @ is ignored.
 * Pasted profile URLs are normalized when possible.
 */
export const SYRA_TEAM_MEMBERS: readonly SyraTeamMember[] = [
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

const byXHandle: ReadonlyMap<string, SyraTeamMember> = (() => {
  const map = new Map<string, SyraTeamMember>();
  for (const member of SYRA_TEAM_MEMBERS) {
    if (member.x) map.set(member.x.handle.toLowerCase(), member);
  }
  return map;
})();

const byTelegramHandle: ReadonlyMap<string, SyraTeamMember> = (() => {
  const map = new Map<string, SyraTeamMember>();
  for (const member of SYRA_TEAM_MEMBERS) {
    if (member.telegram) map.set(member.telegram.handle.toLowerCase(), member);
  }
  return map;
})();

export type SyraTeamLookupHit = {
  readonly member: SyraTeamMember;
  readonly platform: SyraTeamPlatform;
  readonly handle: string;
  readonly profileUrl: string;
};

export function normalizeSocialHandle(raw: string, platform: SyraTeamPlatform): string {
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

export function lookupSyraTeamContact(
  platform: SyraTeamPlatform,
  raw: string,
): SyraTeamLookupHit | undefined {
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
