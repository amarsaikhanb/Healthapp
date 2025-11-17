# Setup Instructions

## Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new account/project
2. Once your project is created, go to **Project Settings** > **API**
3. Copy your project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Enable Email Authentication in Supabase

1. In your Supabase project, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure your site URL in **Authentication** > **URL Configuration**:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: Add `http://localhost:3000/auth/callback`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Your First Account

1. Click on "Sign up" 
2. Enter your email and password
3. You'll be automatically logged in and redirected to the dashboard

## Project Structure

```
src/
├── app/                       # Next.js App Router
│   ├── auth/callback/        # Auth callback handler
│   ├── dashboard/            # Protected dashboard routes
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   └── page.tsx              # Home page (redirects)
├── components/
│   ├── ui/                   # Shadcn UI components
│   └── dashboard-sidebar.tsx # Sidebar component
└── lib/
    ├── supabase/             # Supabase client configuration
    └── utils.ts              # Utility functions
```

## Features

- ✅ Email/password authentication
- ✅ Protected routes with middleware
- ✅ Collapsible sidebar navigation
- ✅ Responsive design
- ✅ Modern UI with Shadcn components

## Troubleshooting

### Build fails with Supabase errors

Make sure your `.env.local` file exists and has valid environment variables.

### Login/Signup not working

1. Check that email authentication is enabled in Supabase
2. Verify your environment variables are correct
3. Check the browser console for errors

### Redirects not working after login

Make sure you've added the callback URL to your Supabase project's redirect URLs.

## Next Steps

- Customize the dashboard pages
- Add more authentication providers (Google, GitHub, etc.)
- Integrate with Supabase database for storing health data
- Add charts and visualizations
- Implement real health tracking features

## Support

For issues with:
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **Shadcn UI**: [Shadcn UI Documentation](https://ui.shadcn.com)

