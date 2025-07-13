# PlotCSV Frontend

A modern Next.js frontend for the PlotCSV data visualization application with Claude-inspired design.

## Features

- **Authentication**: Google OAuth and email/password login with NextAuth.js
- **File Upload**: Drag & drop CSV file upload with validation
- **Data Visualization**: Interactive charts and plots generation
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live data refresh and plot generation
- **Modern UI**: Claude-inspired design with smooth animations

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom color palette
- **Authentication**: NextAuth.js with Google Provider
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and update:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   ├── providers.tsx      # Context providers
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── plots/            # Plot generation components
│   ├── upload/           # File upload components
│   └── ui/               # UI primitives
├── lib/                  # Utility libraries
│   ├── api.ts           # API service
│   ├── auth.ts          # NextAuth configuration
│   └── utils.ts         # Utility functions
└── tailwind.config.js   # Tailwind configuration
```

## Key Features

### Authentication
- **Split-screen login**: Claude-inspired design with left branding panel
- **Google OAuth**: One-click Google sign-in
- **Email/Password**: Traditional authentication
- **Animated typing effect**: Dynamic text animation on login screen

### Dashboard
- **Three-panel layout**: Upload, Recent files, Plot generation
- **CSV Upload**: Drag & drop with file validation
- **Recent uploads**: Quick access to uploaded datasets
- **Plot generator**: Create visualizations from uploaded data

### Design System
- **Color palette**: Claude-inspired orange and warm gray theme
- **Typography**: Geist font family for modern aesthetics
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first responsive design

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
