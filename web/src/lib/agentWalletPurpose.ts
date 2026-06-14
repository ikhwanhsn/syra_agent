export type AgentWalletPurpose = "chat" | "lp";

export function lpAnonymousIdFromChat(chatAnonymousId: string): string {
  let chat = chatAnonymousId.endsWith(":lp") ? chatAnonymousId.slice(0, -3) : chatAnonymousId;
  while (chat.endsWith(":lp")) chat = chat.slice(0, -3);
  return `${chat}:lp`;
}

export function isLpAnonymousId(id: string): boolean {
  return id.endsWith(":lp");
}
