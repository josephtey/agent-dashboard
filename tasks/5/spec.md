# Task #5: Implement Parallel Tool Calling

**Repository:** beyond-agents
**Status:** TODO
**Created:** 2026-02-01T08:00:00Z
**Updated:** 2026-02-14T13:30:00Z

---

## Overview

Add concurrent tool execution to improve performance when the LLM returns multiple independent tool calls. Currently tools execute sequentially in `src/agent.py:129-159` - this should use `asyncio.gather()` for parallel execution.

**Performance Impact:** 2-10x faster for multi-tool operations (300ms vs 650ms for 3 tools)

**Architecture Context:** beyond-agents now uses FastAPI backend with SSE streaming to Next.js frontend. Events flow from agent → FastAPI → Next.js via Server-Sent Events. Parallel execution must maintain proper event ordering for clean UI display.

---

## Requirements

### Core Features
- Execute multiple tool calls concurrently using `asyncio.gather()`
- Preserve result ordering for correct API formatting
- Continue execution if one tool fails (return partial results)
- Maintain event streaming with logical order
- Zero breaking changes to agent API

### Success Metrics
- Multiple tools execute in parallel (verified via timing tests)
- Execution time ≈ slowest tool (not sum of all tools)
- Results correctly formatted and ordered
- Event streaming maintains UI flow

---

## Implementation

### Files to Modify
- `src/agent.py` - Agent loop with tool execution (lines 129-159)

### Current Code (Sequential)
```python
# Lines 129-159 in src/agent.py
# Execute tools and yield events
tool_results = []
for tool_use in response.tool_uses:
    # Yield tool call event
    yield ToolCallEvent(
        tool_name=tool_use.name,
        tool_id=tool_use.id,
        inputs=tool_use.input
    )

    # Execute the tool
    tool = self.tool_registry.get(tool_use.name) if self.tool_registry else None
    if tool:
        result = await tool.execute(**tool_use.input)
    else:
        result = f"Error: Unknown tool: {tool_use.name}"

    # Yield tool result event
    yield ToolResultEvent(
        tool_name=tool_use.name,
        tool_id=tool_use.id,
        result=result
    )

    # Collect for conversation history
    tool_results.append({
        "type": "tool_result",
        "tool_use_id": tool_use.id,
        "content": result
    })

self._messages.append(Message(role="user", content=tool_results))
```

**Problem:** Each tool waits for the previous to complete. Total time = sum of all tool execution times.

---

## Architecture Context

### SSE Streaming Flow

```
┌─────────────────────────────────────────────────────────┐
│  Agent.chat() yields events                             │
│  - ThinkingEvent                                        │
│  - ToolCallEvent (for each tool)                        │
│  - ToolResultEvent (for each tool)                      │
│  - FinalResponseEvent                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI Backend (backend/main.py)                      │
│  async def event_generator():                           │
│    async for event in agent.chat(message):              │
│      yield f"data: {json.dumps(event)}\n\n"             │
│  return StreamingResponse(...)                          │
└────────────────┬────────────────────────────────────────┘
                 │ SSE stream
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend (web/app/page.tsx)                    │
│  - Reads SSE stream chunk by chunk                      │
│  - Parses "data: {...}\n\n" format                      │
│  - Updates UI state for each event                      │
│  - Displays thinking, tool calls, results in real-time  │
└─────────────────────────────────────────────────────────┘
```

**Key Constraint:** Events must arrive in logical order for clean UI display. Users see tool calls → execution → results.

---

## Performance Diagrams

### Current Sequential Flow

```
┌─────────────────────────────────────────────────────────────┐
│ LLM Response: [tool1, tool2, tool3]                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  for tool in tools:            │
         │    emit ToolCallEvent          │  ◄── Emit + Execute interleaved
         │    result = execute(tool)      │
         │    emit ToolResultEvent        │
         └────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │  Tool 1: 200ms  │     │  Tool 2: 150ms  │
    └─────────────────┘     └─────────────────┘
              │                       │
              │ (wait 200ms)          │
              ▼                       │
         emit result                  │
                          │           │
                          │ (wait 150ms)
                          ▼           ▼
                     emit result
                                      │
                          ┌───────────┴───────────┐
                          ▼
                ┌─────────────────┐
                │  Tool 3: 300ms  │
                └─────────────────┘
                          │
                          │ (wait 300ms)
                          ▼
                     emit result

Total Time: 200 + 150 + 300 = 650ms
```

### New Parallel Flow

```
┌─────────────────────────────────────────────────────────────┐
│ LLM Response: [tool1, tool2, tool3]                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Phase 1: Emit ALL calls       │
         │    for tool in tools:          │
         │      emit ToolCallEvent(tool)  │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Phase 2: Execute in parallel  │
         │    results = gather(           │
         │      execute(tool1),           │
         │      execute(tool2),           │
         │      execute(tool3)            │
         │    )                           │
         └────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Tool 1      │ │ Tool 2      │ │ Tool 3      │
    │ 200ms       │ │ 150ms       │ │ 300ms       │
    └─────────────┘ └─────────────┘ └─────────────┘
              │           │           │
              └───────────┼───────────┘
                          │ (wait max(200, 150, 300) = 300ms)
                          ▼
         ┌────────────────────────────────┐
         │  Phase 3: Emit ALL results     │
         │    for result in results:      │
         │      emit ToolResultEvent      │
         └────────────────────────────────┘

Total Time: 300ms (max, not sum)
Speedup: 2.2x
```

### Event Timeline Comparison

**Sequential (650ms total):**
```
0ms     200ms   350ms   650ms
│───────│───────│───────│
Call1   Result1
        │───────│───────│
        Call2   Result2
                │───────│
                Call3   Result3
```

**Parallel (300ms total):**
```
0ms               300ms
│─────────────────│
Call1, Call2, Call3
│─────────────────│
(all execute)
│─────────────────│
Result1, Result2, Result3
```

### Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ asyncio.gather(*tasks, return_exceptions=True)              │
└─────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Tool 1      │ │ Tool 2      │ │ Tool 3      │
    │ ✅ Success  │ │ ❌ Error    │ │ ✅ Success  │
    │ "result"    │ │ Exception   │ │ "result"    │
    └─────────────┘ └─────────────┘ └─────────────┘
              │           │           │
              └───────────┼───────────┘
                          ▼
         ┌────────────────────────────────┐
         │  Format results:               │
         │    [                           │
         │      (tool1, "result"),        │
         │      (tool2, "Error: ..."),    │  ◄── Exception → Error string
         │      (tool3, "result")         │
         │    ]                           │
         └────────────────────────────────┘
                          │
                          ▼
              All results returned (no crash)
```

---

## Proposed Changes

### 1. Add Parallel Tool Execution Helper

Add this new method to the `Agent` class after `_execute_tools()`:

```python
async def _execute_single_tool(self, tool_use) -> str:
    """Execute a single tool and return the result string."""
    tool = self.tool_registry.get(tool_use.name) if self.tool_registry else None
    if tool:
        return await tool.execute(**tool_use.input)
    else:
        return f"Error: Unknown tool: {tool_use.name}"
```

### 2. Replace Sequential Loop with Parallel Execution

Replace lines 129-160 in `src/agent.py` with:

```python
# Phase 1: Emit all tool call events (shows intent to user)
for tool_use in response.tool_uses:
    yield ToolCallEvent(
        tool_name=tool_use.name,
        tool_id=tool_use.id,
        inputs=tool_use.input
    )

# Phase 2: Execute all tools in parallel (no events during execution)
tasks = [self._execute_single_tool(tool_use) for tool_use in response.tool_uses]
results = await asyncio.gather(*tasks, return_exceptions=True)

# Phase 3: Emit all results in order
tool_results = []
for tool_use, result in zip(response.tool_uses, results):
    # Convert exceptions to error strings
    if isinstance(result, Exception):
        result = f"Error executing tool: {str(result)}"

    # Yield result event
    yield ToolResultEvent(
        tool_name=tool_use.name,
        tool_id=tool_use.id,
        result=result
    )

    # Collect for conversation history
    tool_results.append({
        "type": "tool_result",
        "tool_use_id": tool_use.id,
        "content": result
    })

self._messages.append(Message(role="user", content=tool_results))
```

### 3. Add asyncio import

At the top of `src/agent.py`, add:
```python
import asyncio
```

---

## Event Flow & UI Impact

**New Pattern:** Plan → Execute → Report

1. **Planning Phase (immediate):** Emit all `ToolCallEvent` events
   - User sees all tool calls at once
   - Clear intent display in UI
   - FastAPI streams: `data: {"type":"ToolCallEvent",...}\n\n` (x3)

2. **Execution Phase (parallel, ~300ms):** Run all tools concurrently
   - No events during execution
   - UI shows "executing..." state
   - Backend is awaiting `asyncio.gather()`

3. **Results Phase (immediate):** Emit all `ToolResultEvent` events in order
   - User sees all results at once
   - Maintains tool_use ordering (API requirement)
   - FastAPI streams: `data: {"type":"ToolResultEvent",...}\n\n` (x3)

**Frontend Display Timeline:**

```
User message appears
  ↓
[Thinking: "I should search..."] (if present)
  ↓
[Tool Call: web_search - "Python best practices"]
[Tool Call: read_file - "/docs/guide.md"]
[Tool Call: web_search - "async patterns"]
  ↓
... 300ms execution time (parallel) ...
  ↓
[Result: web_search - "Found 5 articles..."]
[Result: read_file - "File contents..."]
[Result: web_search - "Async guide..."]
  ↓
[Final Response: "Based on the results..."]
```

This provides clear mental model and maintains chronological consistency for both API and UI.

---

## Performance Analysis

| Scenario | Sequential | Parallel | Speedup |
|----------|-----------|----------|---------|
| 3 tools (200ms, 150ms, 300ms) | 650ms | 300ms | 2.2x |
| Multiple file reads | ~1000ms | ~200ms | 5x |
| Mixed file + web search | ~800ms | ~250ms | 3.2x |
| Large batches (5+ tools) | Variable | Variable | 5-10x |

---

## Testing Strategy

### Unit Test (Create `tests/test_parallel_tools.py`)

```python
import asyncio
import time
import pytest
from src.agent import Agent
from src.tools.base import Tool
from src.tools.registry import ToolRegistry

class SlowTool(Tool):
    """Mock tool with artificial delay for testing."""

    def __init__(self, name: str, delay: float):
        self.name = name
        self.delay = delay
        self.description = f"Test tool with {delay}s delay"
        self.parameters = {}

    async def execute(self, **kwargs) -> str:
        await asyncio.sleep(self.delay)
        return f"Result from {self.name} after {self.delay}s"

@pytest.mark.asyncio
async def test_parallel_tool_execution_timing():
    """Verify parallel execution is faster than sequential."""
    # Setup agent with slow tools
    registry = ToolRegistry()
    registry.register(SlowTool("slow1", 0.2))
    registry.register(SlowTool("slow2", 0.3))
    registry.register(SlowTool("slow3", 0.1))

    agent = Agent(tool_registry=registry)

    # Simulate tool uses
    from src.models.base import ToolUse
    tool_uses = [
        ToolUse(id="1", name="slow1", input={}),
        ToolUse(id="2", name="slow2", input={}),
        ToolUse(id="3", name="slow3", input={}),
    ]

    # Execute and time
    start = time.time()
    tasks = [agent._execute_single_tool(tu) for tu in tool_uses]
    results = await asyncio.gather(*tasks)
    elapsed = time.time() - start

    # Should complete in ~300ms (max), not 600ms (sum)
    assert elapsed < 0.4, f"Expected <400ms, got {elapsed*1000:.0f}ms"
    assert elapsed > 0.25, f"Should take at least 300ms (slowest tool)"
    assert len(results) == 3

    print(f"✅ Parallel execution: {elapsed*1000:.0f}ms (expected ~300ms)")
    print(f"   Sequential would be: 600ms")
    print(f"   Speedup: {600/(elapsed*1000):.1f}x")
```

### Manual E2E Test (via Web UI)

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd web && npm run dev`
3. Send message: "Search for Python best practices and read the file /README.md"
4. Observe:
   - All tool calls appear immediately
   - Results appear together after ~max(tool_times)
   - Console logs show parallel execution timing

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Single tool | Works normally (parallel of 1 item) |
| All tools fail | All error messages returned, loop continues |
| Mixed success/failure | Partial results + error messages |
| Tool dependency | Both execute (LLM shouldn't do this) |

---

## Success Criteria

- [ ] Multiple tool calls execute in parallel (timing test validates speedup)
- [ ] Results correctly ordered and formatted (matches tool_uses order)
- [ ] SSE event streaming maintains logical flow (call→call→call→result→result→result)
- [ ] Error handling preserves partial results (one tool fails, others succeed)
- [ ] No breaking changes to agent API (agent.chat() signature unchanged)
- [ ] Web UI displays events correctly (tool calls, then results)
- [ ] Backend logs show parallel execution timing
- [ ] New unit test validates parallel timing (<400ms for 600ms of work)
- [ ] Manual E2E test confirms UI flow

---

## Testing Checklist

### Code Verification
- [ ] Add `import asyncio` to agent.py
- [ ] Add `_execute_single_tool()` helper method
- [ ] Replace sequential loop (lines 129-160) with parallel implementation
- [ ] Verify three phases: emit calls → gather → emit results

### Unit Testing
- [ ] Create `tests/test_parallel_tools.py`
- [ ] Implement SlowTool mock with delays
- [ ] Verify timing: <400ms for 600ms of sequential work
- [ ] Test error handling: one tool fails, others succeed
- [ ] Test single tool case (parallel of 1)
- [ ] Test empty tool list (no tools to execute)

### Integration Testing
- [ ] Run existing tests: `pytest tests/`
- [ ] Verify no regressions in agent behavior
- [ ] Check event order matches expected pattern

### E2E Testing (Web UI)
- [ ] Start backend and frontend
- [ ] Send multi-tool query
- [ ] Verify all tool calls display immediately
- [ ] Verify results appear together
- [ ] Check browser console for timing logs
- [ ] Test with web_search + read_file combination
- [ ] Test with error scenario (invalid file path)

---

## Technical Notes

**Stack:**
- `asyncio.gather()` - Core Python async primitive for concurrent execution
- `return_exceptions=True` - Prevents one tool failure from canceling others
- FastAPI `StreamingResponse` - Already handles async iteration properly
- SSE format - `data: {json}\n\n` - Works seamlessly with parallel execution

**Architecture Impact:**
- Agent yields events (generator pattern unchanged)
- FastAPI awaits agent.chat() and streams events (unchanged)
- Next.js parses SSE stream (unchanged)
- **Only change:** Tools execute concurrently instead of sequentially

**Quality Standards:**
- Follow existing async/await patterns in agent.py
- Add docstring for `_execute_single_tool()` method
- Maintain clean three-phase event flow
- Preserve error messages with context

**No Breaking Changes:**
- Agent API unchanged (`agent.chat()` signature same)
- Event types unchanged (ToolCallEvent, ToolResultEvent models)
- Message format unchanged (Anthropic tool_result format)
- SSE streaming unchanged (FastAPI backend unmodified)
- Frontend unchanged (page.tsx, route.ts unmodified)
