# Architecture Guardrails

These are frozen implementation constraints.

- One common project and one common codebase.
- Seven MongoDB collections only:
  USER, DIGITAL_VAULT, FILE, ACCESS_PERMISSION, BLOCKCHAIN_RECORD, AUDIT_LOG, SECURITY_ALERT.
- WebAuthn Passkeys for passwordless authentication.
- 30-minute JWT access token in an HttpOnly, Secure, SameSite=Strict cookie.
- No refresh-token system and no server-side session collection.
- Per-file random 256-bit DEK with AES-256-GCM.
- Application 256-bit KEK protects/wraps each DEK.
- Encrypted storage is the backend server filesystem.
- File package contains data.enc and key.wrap.
- SHA-256 input is nonce || ciphertext || authentication_tag.
- Ethereum Sepolia testnet, Chain ID 11155111.
- Alchemy Ethereum Sepolia RPC.
- Dedicated backend-controlled service wallet.
- Solidity contract: DigitalVaultIntegrityRegistry.
- Permission types: VIEW, DOWNLOAD, MANAGE.
- Blockchain writes are internal backend operations; frontend cannot write blockchain records directly.
- Actual file contents and AES keys remain off-chain.
