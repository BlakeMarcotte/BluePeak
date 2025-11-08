# BluePeak Content Studio

An AI-powered content generation platform built for BluePeak Marketing. This application helps agencies create multi-channel marketing campaigns with consistent brand voice across blog posts, social media, email, and ad copy.

## Features

- Multi-channel campaign generation (blog, LinkedIn, Twitter, email, ads)
- Industry-aware content personalization
- Brand voice consistency
- A/B variant generation
- Firebase authentication and data storage
- Built with Next.js 15, TypeScript, and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deployment**: Vercel
- **AI**: Claude API (to be integrated)

## Prerequisites

- Node.js 18+ installed
- Firebase project set up
- Git installed

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd bluepeak-content-studio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Firebase configuration values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Firebase config and utilities
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google Sign-In)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase configuration to `.env.local`

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Contributing

This project was created for the Claude Hackathon Challenge. Contributions are welcome!

## License

MIT
