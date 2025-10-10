# Authentication Quick Reference

## 🚀 Setup Checklist

- [x] Install Supabase client: `npm install @supabase/supabase-js`
- [x] Create `.env` file with Supabase credentials
- [x] Set up Supabase client (`src/lib/supabaseClient.js`)
- [x] Create auth service (`src/services/authService.js`)
- [x] Create auth context (`src/context/AuthContext.jsx`)
- [x] Wrap app with AuthProvider
- [x] Update LoginPage with Supabase auth
- [x] Add logout functionality to HomePage

## ⚙️ Next Steps

1. **Create your Supabase project**: https://supabase.com
2. **Get your credentials** from the Supabase dashboard
3. **Update `.env`** with your actual credentials
4. **Test the authentication** by registering and logging in

## 📝 Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 Environment Variables Required

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 📄 Files Created/Modified

### New Files:
- `src/lib/supabaseClient.js` - Supabase client initialization
- `src/services/authService.js` - Authentication functions (signIn, signUp, signOut, etc.)
- `src/context/AuthContext.jsx` - Auth state management with React Context
- `src/components/ProtectedRoute.jsx` - Route protection wrapper component
- `.env` - Environment variables (DO NOT COMMIT!)
- `.env.example` - Example environment variables
- `SUPABASE_SETUP.md` - Complete setup guide

### Modified Files:
- `src/App.jsx` - Added AuthProvider wrapper
- `src/pages/LoginPage.jsx` - Integrated Supabase authentication
- `src/pages/HomePage.jsx` - Added logout and route protection
- `.gitignore` - Added .env to ignored files

## 🎯 Available Auth Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `signUp(email, password, metadata)` | Register new user | `{user, session, error}` |
| `signIn(email, password)` | Login user | `{user, session, error}` |
| `signOut()` | Logout user | `{error}` |
| `getCurrentUser()` | Get current user | `{user, error}` |
| `getSession()` | Get current session | `{session, error}` |
| `resetPassword(email)` | Send reset email | `{error}` |
| `updatePassword(newPassword)` | Update password | `{user, error}` |
| `onAuthStateChange(callback)` | Listen to auth changes | subscription object |

## 🎣 Using Auth in Components

```javascript
import { useAuth } from './context/AuthContext'

function MyComponent() {
  const { user, session, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>
  
  return <div>Hello, {user.email}!</div>
}
```

## 🔒 Protecting Routes (Two Methods)

### Method 1: Using ProtectedRoute Component
```javascript
import ProtectedRoute from './components/ProtectedRoute'

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

### Method 2: Manual Check (like in HomePage)
```javascript
const { user, loading } = useAuth()

useEffect(() => {
  if (!loading && !user) {
    navigate('/')
  }
}, [user, loading, navigate])
```

## 🧪 Testing Authentication

1. **Register a new user**:
   - Go to http://localhost:5173
   - Click "Register"
   - Fill in username, email, password
   - Check email for confirmation (if enabled)

2. **Login**:
   - Enter email and password
   - Click "Login"
   - You should be redirected to /home

3. **Logout**:
   - Click "Logout" button on home page
   - You should be redirected to login page

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Missing Supabase environment variables" | Restart dev server after creating .env |
| "Invalid login credentials" | Check email confirmation status in Supabase |
| Email not received | Check spam folder, or disable email confirmation |
| Session not persisting | Clear browser cache, check cookies enabled |

## 📚 Additional Features You Can Add

- [ ] Social login (Google, GitHub, etc.)
- [ ] Phone authentication
- [ ] Multi-factor authentication (MFA)
- [ ] User profile management
- [ ] Password strength indicator
- [ ] Remember me functionality
- [ ] Session timeout handling
- [ ] User roles and permissions

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Full Setup Guide](./SUPABASE_SETUP.md)
