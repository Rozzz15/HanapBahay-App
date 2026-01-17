# Navigation Performance Issue - 11 Seconds!

## Problem
Even with a simple href string, `router.push` takes **11,388ms (11 seconds)**. This is an Expo Router performance bug.

## What We've Tried

### Attempt 1: Params Object (FAILED)
```typescript
router.push({
    pathname: '/(owner)/chat-room/${id}',
    params: { ... }
});
// Result: 9,537ms
```

### Attempt 2: String Href (FAILED)
```typescript
router.push('/(owner)/chat-room/${id}?conversationId=...');
// Result: 11,388ms - STILL SLOW!
```

### Attempt 3: router.replace (TESTING NOW)
```typescript
router.replace({ pathname: '/(owner)/chat-room/[id]', params: {...} });
// Testing... should we try this?
```

## Root Cause Analysis

The problem is **NOT** your code - it's **Expo Router itself** being slow on owner's side.

**Evidence**:
- Tenant side: Fast navigation (<1s)
- Owner side: Slow navigation (11s)
- Same router, same device, different routes
- Problem is in Expo Router's internal navigation logic

## Possible Causes

### Theory 1: Owner Layout Re-rendering
The `(owner)/_layout.tsx` might be doing heavy computation on navigation.

### Theory 2: Route Matching Complexity
The dynamic route `[id]` might be causing slow regex matching.

### Theory 3: State Serialization
Expo Router might be serializing navigation state slowly.

### Theory 4: Memory/Performance Issue
Device might be slow, or memory is full.

## Alternative Solutions

### Solution A: Use Direct Component Mounting
Skip Expo Router entirely:
```typescript
// In messages.tsx
const [selectedConversation, setSelectedConversation] = useState(null);

if (selectedConversation) {
    return <ChatRoom conversationId={selectedConversation} />;
}

// On click
setSelectedConversation(conversation.id); // Instant!
```

### Solution B: Preload Route
```typescript
// Preload on hover/focus
onPressIn={() => router.prefetch(href)}
onPress={() => router.push(href)}
```

### Solution C: Use Custom Navigator
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Bypass Expo Router
```

### Solution D: Check Owner Layout
Let me check if `(owner)/_layout.tsx` has performance issues...

## Next Steps

1. **Test router.replace** (current attempt)
2. **If still slow**: Check `(owner)/_layout.tsx` for heavy operations
3. **If still slow**: Try Solution A (direct component mounting)
4. **If still slow**: Profile React Native performance

## Questions for You

1. **Is tenant navigation fast?** (You mentioned it is)
2. **Are you on Android or iOS?**
3. **Is this on emulator or real device?**
4. **Do other owner routes load fast?** (like /dashboard, /listings)

If other owner routes are fast, the problem is specific to chat-room route.
If all owner routes are slow, the problem is in `(owner)/_layout.tsx`.
