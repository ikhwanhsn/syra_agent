export type AgentWalletPurpose = "chat" | "lp";

export function lpAnonymousIdFromChat(chatAnonymousId: string): string {
  const chat = chatAnonymousId.endsWith(":lp") ? chatAnonymousId.slice(0, -3) : chatAnonymousId;
  return `${chat}:lp`;
}

export function isLpAnonymousId(id: string): boolean {
  return id.endsWith(":lp");
}
