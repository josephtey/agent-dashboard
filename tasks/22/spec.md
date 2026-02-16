# Task #22: Add Clear Context Button

**Repository:** beyond-agents
**Mode:** Fast Track
**Created:** 2026-02-15

## Description

Add a button that clears the conversation context (resets the agent's message history) so the user doesn't burn token costs on accumulated context from previous messages.

## Implementation

- Add a "Clear" or "New Chat" button in the header area
- Frontend: clear the messages state array
- Backend: call the agent's `reset()` method via a new API endpoint (e.g., POST /reset)
- Next.js API route to proxy the reset call
- Button should be minimal and aesthetic (fits the serif "Lee" theme)
- No confirmation dialog needed — just clear immediately

## Success Criteria

- Button visible in the UI header
- Clicking it clears all messages from the chat
- Backend conversation history is also reset (so tokens aren't wasted)
- No breaking changes to existing functionality
