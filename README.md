# Blockchain-Based Passwordless Digital Vault for Secure Data Storage

A secure digital vault application that combines passwordless authentication, encrypted file storage, access control, and blockchain-based file integrity verification.

## Project Overview

This is a single integrated project developed for two academic subjects:

- Blockchain
- Backend Web Development

## Technology Stack

- **Frontend:** React.js, TypeScript, Vite
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** WebAuthn passwordless authentication
- **Authorization:** Role-Based Access Control (RBAC)
- **Encryption:** AES-256-GCM with Data Encryption Key (DEK) and Key Encryption Key (KEK)
- **Integrity Verification:** SHA-256
- **Blockchain:** Solidity smart contract and ethers.js
- **File Storage:** Encrypted files stored off-chain

## Project Structure

```text
blockchain-passwordless-digital-vault/
├── blockchain/       # Smart contract and Hardhat configuration
├── client/           # React frontend
├── server/           # Express backend and application services
├── storage/          # Local encrypted file storage
├── docs/             # Architecture and implementation documentation
├── tests/            # Integration test directory
├── .gitignore
└── README.md
```

## Core Features

- Passwordless authentication using WebAuthn
- JWT-based session authentication using cookies
- Vault and file management
- Role-based authorization and file permissions
- AES-256-GCM file encryption
- Secure off-chain storage of encrypted files
- SHA-256 file integrity verification
- Blockchain-based integrity record management
- Audit logging and security alerts

## Implementation Status

The initial project structure and core implementation files have been added to the repository. The frontend, backend, blockchain, documentation, and test directories are present.

**Note:** The presence of source files does not by itself confirm that every feature is fully integrated or tested. Refer to `docs/IMPLEMENTATION_STATUS.md` for the current implementation and testing status.

## Academic Project

**Project Title:** Blockchain-Based Passwordless Digital Vault for Secure Data Storage

This project uses blockchain as an integrity and trust layer while encrypted files remain in off-chain storage.
