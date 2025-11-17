# Health App

A modern health tracking application built with Next.js 15, Shadcn UI, and Supabase authentication.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password authentication powered by Supabase
- 📊 **Dashboard** - Interactive dashboard with health metrics and activity tracking
- 🎨 **Modern UI** - Beautiful, responsive design using Shadcn UI components
- 📱 **Collapsible Sidebar** - Intuitive navigation with a collapsible sidebar
- 🎯 **Protected Routes** - Middleware-based authentication protection
- ⚡ **Next.js 15** - Built with the latest Next.js features including App Router
- 🌐 **Server Components** - Optimized with React Server Components
- 🔄 **Real-time Auth** - Automatic session management and token refresh

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your Supabase project:
   - Create a new project at [https://supabase.com](https://supabase.com)
   - Enable Email authentication in Authentication > Providers
   - Get your project URL and anon key from Project Settings > API

3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### What You'll See

- **Home Page**: Automatically redirects to login if not authenticated
- **Login/Signup Pages**: Beautiful authentication forms with validation
- **Dashboard**: Main overview with health metrics (steps, calories, active hours)
- **Collapsible Sidebar**: Click the sidebar toggle to collapse/expand navigation
- **Protected Routes**: Try accessing `/dashboard` without logging in - you'll be redirected
- **Multiple Pages**: Navigate between Dashboard, Activities, Schedule, and Settings

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   └── callback/          # Auth callback handler
│   ├── dashboard/             # Protected dashboard routes
│   │   ├── activities/        # Activities page
│   │   ├── schedule/          # Schedule page
│   │   ├── settings/          # Settings page
│   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   └── page.tsx          # Main dashboard
│   ├── login/                 # Login page
│   ├── signup/                # Signup page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home (redirects to login/dashboard)
├── components/
│   ├── ui/                   # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── sidebar.tsx
│   └── dashboard-sidebar.tsx  # Dashboard sidebar component
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── server.ts         # Server Supabase client
│   │   └── middleware.ts     # Auth middleware
│   └── utils.ts              # Utility functions
└── middleware.ts             # Next.js middleware for auth

```

## Features Breakdown

### Authentication

- Email/password signup and login
- Secure session management with Supabase
- Protected routes using Next.js middleware
- Automatic redirect based on auth state

### Dashboard

- **Main Dashboard**: Overview of health metrics (steps, calories, active hours)
- **Activities**: Track fitness activities and workouts
- **Schedule**: Plan and organize health routines
- **Settings**: Manage account information

### UI Components

All UI components are built with Shadcn UI and are fully customizable:

- `Button` - Various button styles and sizes
- `Card` - Content containers with headers and footers
- `Input` - Form input fields
- `Label` - Form labels
- `Sidebar` - Collapsible navigation sidebar

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Deployment

This app can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Self-hosted**

Make sure to set your environment variables in your deployment platform.

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
