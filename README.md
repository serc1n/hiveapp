# HiveApp - Token Gated Chat Application

A modern browser-based chat application with Twitter authentication, Ethereum wallet integration, and token-gated group access. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🐦 **Twitter Authentication**: Sign in with Twitter to create your account
- 💬 **Group Chat**: Create and join group conversations
- 🔐 **Token Gating**: NFT-based access control for exclusive groups
- 📱 **PWA Support**: Install as mobile app with push notifications
- 🌙 **Dark Mode**: Modern minimalistic dark theme
- 📢 **Announcements**: Group creators can make announcements with notifications
- 👤 **User Profiles**: Customizable profiles with bio editing
- 💰 **Wallet Integration**: Connect Ethereum wallets for token verification

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Twitter Developer Account
- (Optional) WalletConnect Project ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hiveapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```

   Fill in your environment variables:
   - `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` from Twitter Developer Portal
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Other optional variables as needed

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Twitter OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0 with PKCE
4. Set callback URL to `http://localhost:3000/api/auth/callback/twitter`
5. Copy Client ID and Client Secret to your `.env.local`

### Token Gating Configuration

The app is pre-configured to check NFT ownership for the contract:
`0xb5abff5c7f8cd72c302c4b70743c6069370a5952`

You can modify this in the group creation interface or update the smart contract checking logic in `/lib/web3.ts`.

### Push Notifications Setup

1. Generate VAPID keys for web push:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add the keys to your `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key
   ```

## Project Structure

```
hiveapp/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   ├── web3.ts           # Ethereum utilities
│   └── notifications.ts  # Push notification logic
├── prisma/               # Database schema
├── public/               # Static assets
└── README.md
```

## Key Features Explained

### Token Gated Groups

Groups can be configured with an Ethereum contract address. Users must own an NFT from that contract to access the group. The verification happens on-chain using ethers.js.

### PWA (Progressive Web App)

The app includes:
- Web App Manifest (`/public/manifest.json`)
- Service Worker (`/public/sw.js`)
- Install prompt for mobile devices
- Push notification support

### Real-time Features

- Real-time messaging (polling-based, can be upgraded to WebSocket)
- Push notifications for announcements
- Live group member updates

### Security

- Twitter OAuth for authentication
- Server-side session management with NextAuth
- Input validation and sanitization
- Rate limiting ready (can be implemented)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any Node.js hosting platform. Make sure to:
- Set up environment variables
- Configure the database (upgrade from SQLite for production)
- Set up proper domain for Twitter OAuth callbacks

## Environment Variables

See `env.example` for all required environment variables:

- **NEXTAUTH_URL**: Your app's URL
- **NEXTAUTH_SECRET**: Secret for session encryption
- **TWITTER_CLIENT_ID/SECRET**: Twitter OAuth credentials
- **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID**: WalletConnect project ID
- **VAPID keys**: For push notifications
- **DATABASE_URL**: Database connection string

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or contact the development team.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
