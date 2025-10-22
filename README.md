# RizqFi - Community Savings Committees

Decentralized rotating savings and credit association (ROSCA) on Base blockchain.

## Features
- Create private/public committees
- Automated round management
- USDC-based contributions
- Basename integration for identity
- Fair payout rotation

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS
- OnchainKit, Wagmi, Viem
- Base Blockchain (Sepolia testnet)

## Setup

1. Clone and install:
```bash
git clone <repo>
cd rizqfi
npm install
```

2. Configure `.env.local`:
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x439778d47B86EF5E54896AB2613c9aD7d85663b4
```

3. Run:
```bash
npm run dev
```

## Smart Contract
Address: `0x439778d47B86EF5E54896AB2613c9aD7d85663b4`
Network: Base Sepolia

## Live Demo
[Deployment URL]