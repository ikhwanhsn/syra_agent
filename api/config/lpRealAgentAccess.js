/**
 * LP Real Agent access control (v1: single allowlisted agent wallet).
 * Future: replace with SYRA stake gate for additional wallets.
 */

/** Default operator wallet — override via LP_AGENT_REAL_AGENT_ADDRESS. */
export const LP_REAL_ALLOWED_AGENT_ADDRESS_DEFAULT =
  "HSnkAyYSGHXN5KcfUAYjdCQkeN4SH4yYzZ7ciV76zeJ3";

export function getLpRealAllowedAgentAddress() {
  const fromEnv = process.env.LP_AGENT_REAL_AGENT_ADDRESS?.trim();
  return fromEnv || LP_REAL_ALLOWED_AGENT_ADDRESS_DEFAULT;
}

export function isAllowedLpRealAgentAddress(agentAddress) {
  const allowed = getLpRealAllowedAgentAddress();
  return Boolean(agentAddress) && String(agentAddress).trim() === allowed;
}
