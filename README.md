# 🚀 Mirfa Secure Transactions Mini-App

A full-stack monorepo demonstrating **Envelope Encryption** for secure transaction handling, built as part of the Mirfa Software Engineer Intern Challenge.

## 🏗️ Architecture
This project is structured as a **TurboRepo** monorepo to ensure clean separation of concerns:
* **`apps/web`**: Next.js frontend providing a simple, clean interface for users to encrypt and decrypt transaction payloads.
* **`apps/api`**: Fastify backend API that handles the secure processing and storage of transaction records.
* **`packages/crypto`**: A shared internal TypeScript library containing the core encryption and decryption logic.

## 🔐 Security Implementation: Envelope Encryption
To meet the challenge's core security requirements, I implemented **Envelope Encryption** using **AES-256-GCM**.



### The Process:
1.  **DEK Generation**: For every transaction, a unique 32-byte Data Encryption Key (DEK) is generated.
2.  **Payload Encryption**: The user's JSON payload is encrypted with the DEK.
3.  **Key Wrapping**: The DEK itself is then encrypted (wrapped) using a **Master Key** stored securely in the backend environment.
4.  **Integrity Checks**: AES-GCM provides an authentication tag, which I use to verify that neither the ciphertext, the nonces, nor the tags have been tampered with.

## 🛠️ Tech Stack
* **Monorepo Management**: TurboRepo
* **Frontend**: Next.js (App Router), TypeScript
* **Backend**: Fastify, TypeScript
* **Package Manager**: pnpm
* **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
* Node.js 20+
* pnpm

### Setup
1.  Clone the repository.
2.  Create an `.env` file in `apps/api/` based on `.env.example`.
3.  Set `MASTER_KEY_HEX` to a 64-character hex string (32 bytes).
4.  Run the following commands:
```bash
pnpm install
pnpm dev