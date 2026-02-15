# Beyond Agents: Clean Up Messaging UI

## Context

The beyond-agents messaging interface currently has several UX issues that make the chat experience cluttered and difficult to use:

1. **Whole-page scrolling** instead of contained scroll within the message area
2. **Tool calls are visually overwhelming** - showing full JSON inputs/outputs by default
3. **Repetitive tool calls make the UI grow excessively** without any collapsing
4. **Emoji-heavy, colorful design** that feels unprofessional (🛠️, ✅, 💭 with bright backgrounds)
5. **Input doesn't refocus** after sending a message
6. **No smooth transitions** - just basic CSS transitions

The goal is to create a cleaner, more professional chat interface that:
- Keeps important information visible but details collapsed by default
- Uses smooth animations for a polished feel
- Follows shadcn/ui design patterns for consistency
- Maintains contained scrolling within the chat area

## Implementation Plan

### 1. Install framer-motion for animations

**Location:** `/Users/josephtey/Projects/beyond-agents/web/`

```bash
npm install framer-motion
```

This will enable smooth, declarative animations using the motion.div API.

### 2. Fix scrolling container

**File:** `/Users/josephtey/Projects/beyond-agents/web/components/ChatContainer.tsx`

**Current issue:** The `bottomRef.current?.scrollIntoView()` causes the whole page to scroll.

**Solution:**
- Ensure the `ScrollArea` component properly contains the scroll
- Use `ScrollArea.Viewport` ref for programmatic scrolling instead of `scrollIntoView`
- Add `overflow-hidden` to parent container to prevent body scroll
- Set explicit height constraints on the chat container

**Changes:**
- Import `useRef` for the ScrollArea viewport
- Replace `scrollIntoView` with `scrollTop` manipulation on the viewport
- Add height constraints: `h-[calc(100vh-200px)]` or similar
- Ensure ScrollArea has `type="always"` or `type="scroll"` to show scrollbar

### 3. Create collapsible tool call component

**New file:** `/Users/josephtey/Projects/beyond-agents/web/components/CollapsibleToolCall.tsx`

**Design:**
- Use Radix UI's Collapsible primitive (already available via shadcn)
- Default state: **collapsed** - show only the tool name and a summary indicator
- Expanded state: show input parameters and result
- Smooth expand/collapse animation using framer-motion's `AnimatePresence` and `motion.div`

**Visual design (following shadcn patterns):**
- Remove emojis entirely
- Use subtle border and neutral background (border-border, bg-muted)
- Icon from lucide-react: `ChevronRight` that rotates 90° when expanded
- Monospace font for code/JSON with syntax highlighting
- Max height with scroll for long outputs

**Component structure:**
```tsx
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger>
    <ChevronRight className={cn("transition-transform", open && "rotate-90")} />
    <span className="font-mono text-sm">{toolName}</span>
    <span className="text-xs text-muted-foreground">Click to expand</span>
  </CollapsibleTrigger>
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <CollapsibleContent>
          {/* Input params */}
          {/* Result */}
        </CollapsibleContent>
      </motion.div>
    )}
  </AnimatePresence>
</Collapsible>
```

### 4. Update ChatMessage event rendering

**File:** `/Users/josephtey/Projects/beyond-agents/web/components/ChatMessage.tsx`

**Changes to ToolCallEvent (lines 53-63):**
- Replace the entire block with `<CollapsibleToolCall type="call" tool={event.tool} input={event.input} />`
- Remove blue background (bg-blue-50)
- Remove 🛠️ emoji

**Changes to ToolResultEvent (lines 65-73):**
- Merge with the previous ToolCallEvent into a single CollapsibleToolCall component
- Pass result data to the same component
- Remove green background (bg-green-50)
- Remove ✅ emoji
- Keep result in collapsible, scrollable area

**Changes to ThinkingEvent (lines 46-51):**
- Remove 💭 emoji
- Use a subtle indicator: small spinner icon (Loader2 from lucide-react) or just plain text
- Keep muted styling but make it more minimal: `text-xs text-muted-foreground italic`

### 5. Clean up color scheme

**Files to modify:**
- `/Users/josephtey/Projects/beyond-agents/web/components/ChatMessage.tsx`
- `/Users/josephtey/Projects/beyond-agents/web/components/CollapsibleToolCall.tsx`

**Color changes:**
- Remove all bright backgrounds: `bg-blue-50`, `bg-green-50`, `bg-blue-950`, `bg-green-950`
- Use shadcn semantic colors:
  - `bg-muted` for subtle backgrounds
  - `border-border` for borders
  - `text-muted-foreground` for secondary text
  - `bg-background` and `text-foreground` for primary content
- Keep dark mode compatibility using the existing CSS variable system

### 6. Add input auto-focus after send

**File:** `/Users/josephtey/Projects/beyond-agents/web/components/ChatInput.tsx`

**Changes:**
- Add `useRef` for the input element
- After form submission and successful send, call `inputRef.current?.focus()`
- Ensure this happens in the `onSubmit` handler after `setInput("")`

**Implementation:**
```tsx
const inputRef = useRef<HTMLInputElement>(null);

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  onSend(input);
  setInput("");
  inputRef.current?.focus(); // ← Add this
};

return (
  <Input ref={inputRef} ... />
);
```

### 7. Add smooth message entrance animations

**File:** `/Users/josephtey/Projects/beyond-agents/web/components/ChatContainer.tsx`

**Changes:**
- Wrap message rendering in `AnimatePresence` from framer-motion
- Each `ChatMessage` wrapped in `motion.div` with entrance animation

**Implementation:**
```tsx
<AnimatePresence initial={false}>
  {messages.map((message, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <ChatMessage message={message} />
    </motion.div>
  ))}
</AnimatePresence>
```

### 8. Smooth event streaming animations

**File:** `/Users/josephtey/Projects/beyond-agents/web/components/ChatMessage.tsx`

**Changes:**
- Wrap the events loop in `AnimatePresence`
- Each event appears with a subtle fade-in animation
- Use framer-motion's layout animations for smooth repositioning

**Implementation:**
```tsx
<AnimatePresence mode="popLayout">
  {message.events.map((event, idx) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <EventDisplay event={event} />
    </motion.div>
  ))}
</AnimatePresence>
```

The `layout` prop enables automatic position transitions when events are added/removed.

## Critical Files to Modify

1. `/Users/josephtey/Projects/beyond-agents/web/components/ChatContainer.tsx` - Fix scrolling, add message animations
2. `/Users/josephtey/Projects/beyond-agents/web/components/ChatMessage.tsx` - Clean up colors, remove emojis, add event animations
3. `/Users/josephtey/Projects/beyond-agents/web/components/ChatInput.tsx` - Add auto-focus after send
4. `/Users/josephtey/Projects/beyond-agents/web/components/CollapsibleToolCall.tsx` - **New file** for collapsible tool calls

## Verification

**Manual testing:**
1. Start the dev server: `npm run dev` in `/Users/josephtey/Projects/beyond-agents/web/`
2. Open the chat interface in browser
3. Send a message that triggers tool calls (e.g., "Search for AI news")

**Verify:**
- ✅ Scroll stays within chat container, body doesn't scroll
- ✅ Tool calls appear collapsed by default, showing only tool name
- ✅ Clicking a tool call smoothly expands to show details
- ✅ No emojis visible (🛠️, ✅, 💭 all removed)
- ✅ Colors are subtle and follow shadcn aesthetic (grays, borders, no bright blues/greens)
- ✅ After sending a message, cursor returns to input box
- ✅ New messages and events fade in smoothly
- ✅ Multiple tool calls don't make the UI overwhelming (all collapsed initially)

**Edge cases to test:**
- Long tool outputs (should be scrollable within the collapsed component)
- Rapid streaming of many events (should animate smoothly without jank)
- Dark mode (verify colors work in both themes)
- Resizing window (scroll container should adapt)

## Dependencies

- ✅ Radix UI primitives (already installed via shadcn)
- ✅ Tailwind CSS v4 (already configured)
- ✅ lucide-react (already installed for icons)
- ➕ framer-motion (needs to be installed)

## Notes

- Prioritize clean, minimal design over flashy animations
- Use framer-motion's layout animations to handle reflows automatically
- Keep accessibility in mind: collapsible components should be keyboard-navigable (Radix handles this)
- The CollapsibleToolCall component should be reusable and handle both ToolCallEvent and ToolResultEvent
- Consider adding a "Expand all / Collapse all" toggle for power users (future enhancement, not in this task)
