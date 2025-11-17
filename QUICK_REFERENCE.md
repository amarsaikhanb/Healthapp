# Quick Reference Guide

## 🚀 Common Commands

### Development
```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Code Quality
```bash
# Run linter
npm run lint
```

## 📁 Important Files

### Configuration
- `.env.local` - Environment variables (create this!)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration

### Key Source Files
- `src/middleware.ts` - Auth middleware
- `src/lib/supabase/` - Supabase clients
- `src/components/ui/` - Shadcn UI components
- `src/app/` - Application pages

## 🔑 Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🎨 Customization Quick Tips

### Change Colors
Edit `src/app/globals.css` - modify CSS variables under `:root`

### Add/Edit Components
Components are in `src/components/ui/` - fully customizable

### Modify Sidebar Menu
Edit `src/components/dashboard-sidebar.tsx` - `menuItems` array

### Change Layout
- Dashboard layout: `src/app/dashboard/layout.tsx`
- Root layout: `src/app/layout.tsx`

## 🛣️ Routes

### Public Routes
- `/` - Home (redirects to login or dashboard)
- `/login` - Login page
- `/signup` - Signup page

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard
- `/dashboard/activities` - Activities page
- `/dashboard/schedule` - Schedule page
- `/dashboard/settings` - Settings page

### API Routes
- `/auth/callback` - Auth callback handler

## 🧩 Adding a New Dashboard Page

1. Create file: `src/app/dashboard/your-page/page.tsx`
2. Add menu item to sidebar: `src/components/dashboard-sidebar.tsx`

Example:
```tsx
// src/app/dashboard/your-page/page.tsx
export default function YourPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Your Page</h1>
    </div>
  )
}
```

Add to sidebar:
```tsx
{
  icon: YourIcon,
  label: "Your Page",
  href: "/dashboard/your-page",
}
```

## 🎯 Common Tasks

### Add a New Shadcn Component
```bash
npx shadcn-ui@latest add [component-name]
```

### Update Dependencies
```bash
npm update
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

## 🐛 Troubleshooting

### Build Errors
1. Check `.env.local` exists with valid values
2. Run `rm -rf .next && npm run build`
3. Ensure Node.js version is 18+ (20+ recommended)

### Auth Not Working
1. Verify Supabase credentials in `.env.local`
2. Check Email Auth is enabled in Supabase
3. Add callback URL: `http://localhost:3000/auth/callback`

### Styling Issues
1. Check Tailwind CSS is properly configured
2. Verify `globals.css` is imported in root layout
3. Restart dev server after Tailwind config changes

## 📚 Component Usage

### Button
```tsx
import { Button } from "@/components/ui/button"

<Button>Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input with Label
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>
```

## 🔐 Supabase Client Usage

### Client-Side (use in Client Components)
```tsx
"use client"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

### Server-Side (use in Server Components)
```tsx
import { createClient } from "@/lib/supabase/server"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

## 🎨 Tailwind Utility Classes

### Common Patterns
- `flex items-center justify-between` - Flexbox row with space between
- `grid gap-4 md:grid-cols-2` - Responsive grid
- `p-8 space-y-6` - Padding and vertical spacing
- `rounded-lg border bg-card` - Card styling
- `text-sm text-muted-foreground` - Muted text
- `hover:bg-accent hover:text-accent-foreground` - Hover state

## 📞 Getting Help

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Shadcn UI**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

## ✅ Checklist for Deployment

- [ ] Set environment variables in hosting platform
- [ ] Update Supabase redirect URLs with production URL
- [ ] Run `npm run build` to test production build
- [ ] Set up proper site URL in Supabase project settings
- [ ] Enable any additional auth providers needed
- [ ] Test auth flow in production environment
- [ ] Set up proper error tracking (optional)
- [ ] Configure custom domain (optional)

---

**Pro Tip**: Keep this file handy for quick reference! 🌟

