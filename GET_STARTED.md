# 🚀 Get Started with Your Health App

## You're Almost Ready!

Your Next.js Health App with Supabase authentication and Shadcn UI sidebar is complete! Just follow these quick steps to get it running.

---

## 📋 Prerequisites Checklist

- [x] Node.js installed (18+, but 20+ recommended)
- [x] npm installed
- [x] All dependencies installed
- [ ] Supabase account (you'll need this!)
- [ ] Environment variables configured

---

## 🏃 Quick Start (5 minutes)

### Step 1: Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com)** and sign up/login
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: Health App (or whatever you prefer)
   - **Database Password**: (save this somewhere safe!)
   - **Region**: Choose closest to you
4. Wait for the project to be created (~2 minutes)

### Step 2: Get Your API Credentials

1. In your Supabase dashboard, click on your project
2. Go to **Settings** (gear icon) → **API**
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Configure Environment Variables

1. Create a file named `.env.local` in your project root
2. Add these lines (replace with YOUR values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Enable Email Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is **enabled** (it usually is by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to: `http://localhost:3000`
5. Add **Redirect URLs**: `http://localhost:3000/auth/callback`

### Step 5: Start the App! 🎉

```bash
npm run dev
```

Open your browser to **[http://localhost:3000](http://localhost:3000)**

---

## 🎯 What to Do Next

### 1. Create Your First Account
- You'll be redirected to the login page
- Click **"Sign up"**
- Enter your email and create a password (min 6 characters)
- You'll be automatically logged in!

### 2. Explore the Dashboard
- **Main Dashboard**: See health metrics overview
- **Sidebar Toggle**: Click the icon to collapse/expand the sidebar
- **Navigation**: Click on different menu items
  - 🏠 Dashboard
  - 💪 Activities
  - 📅 Schedule
  - ⚙️ Settings

### 3. Test Authentication
- Try signing out (bottom of sidebar)
- Log back in with your credentials
- Try accessing `/dashboard` without being logged in (you'll be redirected!)

---

## 📚 Important Files & Docs

### Read These First
1. **README.md** - Complete project documentation
2. **SETUP.md** - Detailed setup guide
3. **QUICK_REFERENCE.md** - Quick commands and tips

### When You're Ready to Customize
1. **IMPLEMENTATION_SUMMARY.md** - What was built and how
2. Project structure is documented in README.md
3. All UI components are in `src/components/ui/`

---

## 🎨 Customization Ideas

### Easy Changes
- **Colors**: Edit `src/app/globals.css` (CSS variables)
- **Sidebar Menu**: Edit `src/components/dashboard-sidebar.tsx`
- **Dashboard Content**: Edit `src/app/dashboard/page.tsx`

### Add New Features
- Create new dashboard pages in `src/app/dashboard/[your-page]/`
- Add more Shadcn components with: `npx shadcn-ui@latest add [component]`
- Integrate Supabase database for real health tracking

---

## ❓ Troubleshooting

### Build Errors
**Problem**: Build fails or linter errors  
**Solution**: Run `npm run lint` and `npm run build` to check

### Can't Sign Up/Login
**Problem**: Authentication not working  
**Solution**: 
- Check `.env.local` exists and has correct values
- Verify Email Auth is enabled in Supabase
- Check browser console for errors

### Redirects Not Working
**Problem**: Not redirecting after login  
**Solution**: Add callback URL in Supabase → Authentication → URL Configuration

### Environment Variables Not Loading
**Problem**: Getting Supabase errors  
**Solution**: 
- Make sure `.env.local` is in the ROOT directory
- Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again
- Variable names must start with `NEXT_PUBLIC_`

---

## 🆘 Need Help?

### Check Documentation
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs/guides/auth
- **Shadcn UI**: https://ui.shadcn.com

### Common Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Install new packages
npm install package-name
```

---

## ✅ Success Checklist

Before you consider it "working", make sure you can:

- [ ] Access the login page at http://localhost:3000
- [ ] Create a new account via signup
- [ ] Log in with your credentials
- [ ] See the dashboard with your email displayed
- [ ] Navigate between dashboard pages
- [ ] Collapse and expand the sidebar
- [ ] Sign out successfully
- [ ] Protected routes redirect unauthenticated users

---

## 🎉 You're All Set!

Your Health App is ready for development. Start building amazing features!

**Pro Tips:**
- Commit your code regularly to Git
- Never commit `.env.local` (it's in `.gitignore`)
- Test authentication thoroughly before adding more features
- Read through the implementation docs to understand the architecture

**Happy coding!** 🚀

---

*For detailed information, see README.md and other documentation files.*

