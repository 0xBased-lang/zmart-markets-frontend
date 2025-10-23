# ZMART Frontend

Decentralized prediction markets platform on Solana.

## 🚀 Features

- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Live Markets**: Browse active prediction markets with real-time data from blockchain
- **Place Bets**: Bet YES or NO on market outcomes with instant blockchain confirmation
- **Market Details**: View detailed market statistics, pools, and odds
- **Claim Winnings**: Automatically claim winnings from resolved markets

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Blockchain**: Solana (Devnet)
- **Wallet**: Solana Wallet Adapter
- **Styling**: Tailwind CSS
- **Program Integration**: Anchor + @coral-xyz/anchor

## 📝 Smart Contracts

### Deployed Programs (Devnet)
- **zmart-core**: `3q38JSeuMykM6vjh8g8cbpUqkBhB4SvQkQ9XedesXApu`
- **zmart-proposals**: `Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7`

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_PROPOSALS_PROGRAM_ID=Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7
NEXT_PUBLIC_CORE_PROGRAM_ID=3q38JSeuMykM6vjh8g8cbpUqkBhB4SvQkQ9XedesXApu
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## 📁 Project Structure

```
zmart-frontend/
├── app/                    # Next.js App Router
│   ├── markets/           # Markets listing & detail pages
│   ├── providers.tsx      # Wallet & context providers
│   └── layout.tsx         # Root layout
├── components/            # React components (future)
├── lib/                   # Core libraries
│   ├── program.ts         # Solana program integration
│   ├── constants.ts       # Constants & config
│   └── idl/              # Program IDL files
├── types/                 # TypeScript types
│   └── market.ts         # Market & proposal types
└── public/               # Static assets
```

## 🎯 Current Features

### ✅ Implemented
- [x] Wallet connection (Phantom, Solflare)
- [x] Markets listing page with live blockchain data
- [x] Market detail page with odds calculation
- [x] Place bets (YES/NO) with slippage protection
- [x] View user positions
- [x] Claim winnings from resolved markets
- [x] Responsive UI with Tailwind CSS

### 🚧 Coming Soon
- [ ] Proposal creation UI
- [ ] Proposal voting interface
- [ ] User profile page
- [ ] Transaction history
- [ ] Market search & filters
- [ ] Price charts & analytics
- [ ] Social features (comments, sharing)

## 🔗 Links

- **Solana Explorer (Devnet)**: [View Contracts](https://explorer.solana.com/address/Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7?cluster=devnet)
- **Documentation**: See parent directory for full project docs

## 📄 License

MIT
