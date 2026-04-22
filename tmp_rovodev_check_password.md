# 🔍 Password Issue Investigation

## What You Experienced
- Changed email in owner profile
- Got logged out (expected)
- Tried to login with NEW email
- Password doesn't work ❌

## Root Cause Found
In `utils/mock-auth.ts` line 224, when email changes:
```typescript
const updatedUser = { ...userData, ...updates, email: newEmailKey };
```

The issue is that `updates` comes from profile.tsx and only contains:
```typescript
{ name: trimmedName, email: trimmedNewEmail, updatedAt: ... }
```

**NO PASSWORD in updates!**

The spread operator `...userData` should preserve password, BUT if there's any issue with the order or if `updates` accidentally has a `password: undefined` field, it could overwrite it.

## Fix Applied
I've updated the code to **explicitly preserve the password**:
```typescript
const updatedUser = { 
  ...userData, 
  ...updates, 
  email: newEmailKey,
  password: userData.password, // EXPLICITLY preserve password
  id: userData.id,
  roles: updates.roles || userData.roles,
  createdAt: userData.createdAt
};
```

Now the password is guaranteed to be preserved!

## How to Recover Your Account

### Option 1: Use Old Email (If It Still Works)
1. Try logging in with the OLD email
2. Use the same password as before
3. If it works, the old entry is still there

### Option 2: Reset via Database
Run this in Expo console or create a script:
```javascript
// Find your user in database
const { db } = require('./utils/db');
const users = await db.list('users');
console.log('Users:', users.map(u => ({ email: u.email, id: u.id })));

// Find your user ID, then check mock-auth storage
```

### Option 3: Check What's in Storage
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check what emails are stored
const stored = await AsyncStorage.getItem('mockUsers');
const users = JSON.parse(stored);
console.log('Emails in storage:', users.map(u => u.email));
console.log('Passwords present:', users.map(u => ({ email: u.email, hasPassword: !!u.password })));
```

### Option 4: Create New Test Account
If you can't recover:
1. Create a new owner account with different email
2. This time the fix is applied
3. Email change will work correctly

## Testing the Fix

After applying the fix:

1. **Create new owner account:**
   ```
   Email: owner.test.new@example.com
   Password: TestPass123!
   ```

2. **Change email:**
   - Profile → Edit Profile
   - Change to: owner.test.changed@example.com
   - Get logged out

3. **Login with NEW email:**
   ```
   Email: owner.test.changed@example.com
   Password: TestPass123!  ← Should work now!
   ```

4. **Verify password was preserved:**
   - Check console logs for: "🔐 Password preserved: YES ✅"

## What Email/Password Should You Use?

**Tell me:**
1. What was your ORIGINAL email before the change?
2. What is the NEW email you changed to?
3. What password did you use?

I can help you figure out which combination should work to login.
