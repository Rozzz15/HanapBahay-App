# 🚨 URGENT: 1 Minute Chat Loading - Debug Guide

## Current Issue
Chat is taking **1 MINUTE** to load messages - this is critical!

## Immediate Checks

### 1. Check Console Logs
Look for these patterns when opening a chat:

```
[TENANT-NEW] Loading chat...
[TENANT-NEW] Messages loaded in XXXms
[TENANT-NEW] Total loaded in XXXms
```

**Questions:**
- How many times does "Loading chat..." appear?
- What's the timing for "Messages loaded in XXXms"?
- Are there any errors in red?

### 2. Check for Infinite Loops
Look for repeated logs like:
```
[TENANT-NEW] Loading chat...
[TENANT-NEW] Loading chat...
[TENANT-NEW] Loading chat...
(repeating many times)
```

If you see this, the component is mounting/loading repeatedly!

### 3. Check Network Tab (if using web)
- Open Developer Tools → Network tab
- Filter by "messages"
- Look at how long the Supabase query takes
- Check if there are multiple identical requests

### 4. React Native Debugger
**IMPORTANT:** Disconnect React Native Debugger!
- Remote JS Debugging slows down the app by 10-100x
- Disable it and test again

### 5. Check Message Count
Run this in Supabase SQL Editor:
```sql
-- Check how many messages in your conversation
SELECT conversation_id, COUNT(*) as message_count
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
GROUP BY conversation_id;
```

If you have 1000+ messages, that could be the issue.

## Common Causes & Fixes

### Cause 1: React Native Debugger Connected
**Symptom:** Everything is slow (10-100x slower)
**Fix:** Disable remote JS debugging

### Cause 2: Component Mounting Multiple Times
**Symptom:** Multiple "Loading chat..." logs
**Fix:** Already applied - check if still happening

### Cause 3: Network Issues
**Symptom:** Long delays between logs
**Fix:** Check internet connection, try different network

### Cause 4: Too Many Messages
**Symptom:** Query takes 30+ seconds
**Fix:** Add pagination (load only recent 50 messages)

### Cause 5: RLS Policies Too Complex
**Symptom:** Query hangs for long time
**Fix:** Check Supabase RLS policies on messages table

## Quick Test

1. **Disable debugger** (if connected)
2. **Close app completely** (force quit)
3. **Restart app**
4. **Try opening chat again**
5. **Check console logs immediately**

## What to Share

Please provide:
1. Full console output from opening chat
2. Number of messages in conversation
3. Is debugger connected? (Yes/No)
4. Internet speed (fast/slow)
5. Time from click to messages appearing

## Emergency Workaround

If it's still slow, try this temporary fix:

### Limit Messages to Recent 50
Edit `app/chat-room-new.tsx` line 73-77:

```typescript
// Add .limit(50) to only load recent messages
const messagesPromise = supabase
    .from('messages')
    .select('id, sender_id, text, type, image_uri, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })  // Changed to DESC
    .limit(50);  // ADD THIS LINE - only load 50 recent messages
```

This will make it load instantly even with thousands of messages.

## Need More Help?

Share the console logs and I'll identify the exact issue!
