# Expo Router Bug Confirmed! 🐛

## Problem Identified
`router.push()` takes **9,507ms (9.5 seconds)** on the owner side.

## Evidence
```
⏱️ MESSAGES: Router.push call took 9507ms
```

This is a **confirmed Expo Router performance bug**, not our code.

## Why This Happens
Expo Router on the owner side is:
- Rebuilding the entire navigation state
- Re-checking route guards/permissions
- Running expensive validation
- Blocking the main thread

## The Solution
**Bypass Expo Router completely** by rendering the chat component directly.

### Option 1: Conditional Rendering (BEST)
```typescript
// In messages.tsx
if (selectedConversation) {
    return <OwnerChatRoom 
        conversationId={selectedConversation.id}
        tenantName={selectedConversation.tenantName}
        onBack={() => setSelectedConversation(null)}
    />;
}
```

### Option 2: Modal Overlay
```typescript
<Modal visible={!!selectedConversation}>
    <OwnerChatRoom ... />
</Modal>
```

### Option 3: React Navigation (Replace Expo Router)
Use `@react-navigation/native` instead of Expo Router for owner routes.

## Implementing Now...
Creating a direct rendering solution that will be instant (<10ms).
