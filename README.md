# SolanaCrowd
A decentralized crowdfunding platform built on the Solana blockchain using Rust and the Anchor framework.  
This project is developed as a **final year academic project** and focuses on understanding on-chain crowdfunding mechanisms using modern Web3 tools.
The platform allows users to create crowdfunding campaigns and contribute SOL securely through Solana smart contracts.
---
## 🚀 Features
- Create crowdfunding campaigns with a defined funding goal
- Contribute SOL to active campaigns
- Track total funds raised per campaign
- Secure handling of funds using PDA-based Solana smart contracts
- Smart contracts tested using the Anchor test suite


🛠️ Tech Stack
Solana (Blockchain)
Rust (Smart Contract)
Anchor Framework (Program development & testing)
Mocha/TypeScript (Anchor tests)

## 📂 Project Structure  
Solana-crowdfunding/
├── Anchor.toml # Anchor configuration file
├── Cargo.toml # Rust dependencies
├── migrations/ # Deployment scripts
├── programs/ # Rust smart contract programs
│ └── crowdfunding/
│ ├── Cargo.toml
│ └── src/
│ └── lib.rs # Main smart contract logic
├── tests/ # Anchor test files (TypeScript/Mocha)
│ └── crowdfunding.ts
└── README.md # Project documentation



## ⚡ Prerequisites
Make sure the following are installed:

- **Rust** (latest stable)
- **Solana CLI** (≥ v1.18)
- **Anchor** (≥ v0.29.0)
- **Node.js** (≥ 16) & Yarn / NPM

🔧 Setup & Build
# Clone the repo
git clone "https://github.com/simrankumari-dev/SOLANACROWD-A-Decentralized-Crowdfunding-Platform-on-Solana-Blockchain-.git"


cd Solana-crowdfunding1-main

# Install dependencies
yarn install   # or npm install

# Build the smart contract
anchor build

# Deploy to localnet
anchor deploy


🧪 Running Tests
# Run Anchor tests
anchor test

📈 Roadmap

 Smart contract in Rust

 Anchor test cases

 Frontend integration (React/Next.js)

 Deployment to devnet/mainnet

🤝 Contributing

Pull requests are welcome! If you’d like to improve functionality, add UI, or extend features, feel free to fork and submit a PR.
