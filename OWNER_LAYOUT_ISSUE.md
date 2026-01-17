# Owner Layout Performance Issue - Root Cause Found! 🎯

## Problem Identified
The owner layout (`app/(owner)/_layout.tsx`) runs an **approval check on EVERY navigation**, including when opening chat rooms!

## The Culprit

### Line 69-185: Owner Approval Check
```typescript
useEffect(() => {
  const checkOwnerAccess = async () => {
    // ... approval logic
    const application = await getOwnerApplication(user.id); // ← SLOW!
    // This has a 5-second timeout and might be blocking navigation
  };
  
  checkOwnerAccess();
}, [user, isLoading, showApplicationModal]); // ← Runs on every state change!
```

**Why this is slow:**
1. `getOwnerApplication()` queries the database
2. Has a 5-second timeout
3. Runs on EVERY navigation due to broad dependencies
4. Blocks the layout from rendering until complete

## Evidence

Your logs showed:
```
router.push called - took 11388ms  ← 11 seconds delay
```

This matches the approval check behavior:
- Initial check: ~5 seconds
- Retry or additional checks: +6 seconds
- Total: ~11 seconds

## Solution Options

### Option A: Skip Check for Already-Approved Users (BEST)
```typescript
// Cache approval status in memory
const approvalCache = new Map();

if (approvalCache.has(user.id)) {
  console.log('Using cached approval status');
  return; // Skip database check
}

const application = await getOwnerApplication(user.id);
approvalCache.set(user.id, application.status);
```

### Option B: Only Check on Mount, Not on Navigation
```typescript
useEffect(() => {
  checkOwnerAccess();
}, [user?.id]); // ← Only when user changes, not on every navigation
```

### Option C: Run Check in Background (Non-Blocking)
```typescript
useEffect(() => {
  // Don't block rendering
  setTimeout(() => {
    checkOwnerAccess(); // Run after navigation completes
  }, 0);
}, [user, isLoading]);
```

## Testing Now

I've added timing logs. Please test and share:

```
🔵 USER CLICKED
⏱️ MESSAGES: router.replace called - took Xms
⏱️ LAYOUT: checkOwnerAccess called { ... }
⏱️ LAYOUT: Starting approval check...
⏱️ LAYOUT: getOwnerApplication took Xms  ← KEY METRIC!
⏱️ LAYOUT: Total approval check took Xms
🚀 COMPONENT CALLED
```

**Key Questions:**
1. Is `LAYOUT: checkOwnerAccess called` appearing?
2. If yes, does it say "Skipping check (already done)" or "Starting approval check"?
3. How long does `getOwnerApplication took Xms` take?

## Next Steps Based on Results

### If approval check is running (not skipped):
→ Fix the `hasCheckedRef` logic to properly cache the result

### If approval check takes 5000+ ms:
→ Implement Option A (caching) or Option B (check once only)

### If approval check is skipped but still slow:
→ Look for other useEffects or heavy components in the layout

## My Prediction

I predict you'll see:
```
⏱️ LAYOUT: checkOwnerAccess called
⏱️ LAYOUT: Starting approval check...
⏱️ LAYOUT: getOwnerApplication took 5000-11000ms  ← This is the delay!
```

If I'm right, we'll fix it by making the check run only ONCE per session, not on every navigation.

---

**Status**: 🔍 Testing with timing logs
**Next**: Share console logs to confirm root cause
