/**
 * Encrypt / decrypt seller secrets at rest (LLM API keys, etc.).
 * Thin wrapper over the agent-wallet envelope crypto so listing routes
 * never import wallet-specific helpers by name.
 *
 * Master key: AGENT_WALLET_SECRET_ENCRYPTION_KEY (same as agent wallets).
 */
export {
  encryptAgentSecretForStorage as encryptSecretForStorage,
  decryptAgentSecretFromStorage as decryptSecretFromStorage,
  isEncryptedAgentWalletSecret as isEncryptedSecret,
  isAgentWalletSecretEncryptionConfigured as isSecretsCryptoConfigured,
} from '../libs/agentWalletSecretCrypto.js';
