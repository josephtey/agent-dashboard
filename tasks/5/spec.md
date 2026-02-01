# Task #5: Implement Parallel Tool Calling

**Repository:** beyond-agents
**Status:** TODO
**Created:** 2026-02-01T08:00:00Z

---

## Overview

Add concurrent tool execution to improve performance when the LLM returns multiple independent tool calls. Currently tools execute sequentially - this should use `asyncio.gather()` for parallel execution.

**Performance Impact:** 2-10x faster for multi-tool operations (300ms vs 650ms for 3 tools)

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

### File to Modify
- `src/agent.py` - Agent loop with tool execution

### Current Code
Sequential execution loop (agent.py ~line 60-80):
```python
for tool_use in response.tool_uses:
    yield ToolCallEvent(...)
    result = await self._execute_tool(tool_use)
    yield ToolResultEvent(...)
```

---

## Architecture Diagrams

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

### 1. Add Parallel Execution Method

```python
async def _execute_tools_parallel(
    self,
    tool_uses: List[ToolUse]
) -> List[Tuple[ToolUse, str]]:
    """Execute multiple tools in parallel using asyncio.gather()."""

    tasks = [self._execute_tool(tool_use) for tool_use in tool_uses]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Format exceptions as error strings
    formatted_results = []
    for tool_use, result in zip(tool_uses, results):
        if isinstance(result, Exception):
            formatted_results.append(
                (tool_use, f"Error executing tool: {str(result)}")
            )
        else:
            formatted_results.append((tool_use, result))

    return formatted_results
```

### 2. Update Agent Loop

```python
if response.tool_uses:
    # Phase 1: Emit all tool call events
    for tool_use in response.tool_uses:
        yield ToolCallEvent(
            tool_name=tool_use.name,
            tool_input=tool_use.input,
        )

    # Phase 2: Execute all tools in parallel
    tool_results = await self._execute_tools_parallel(response.tool_uses)

    # Phase 3: Emit all results in order
    for tool_use, result in tool_results:
        yield ToolResultEvent(
            tool_name=tool_use.name,
            result=result[:500],
        )

        self._messages.append({
            "role": "user",
            "content": [{
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": result,
            }],
        })
```

---

## Event Flow

**New Pattern:** Plan → Execute → Report

1. **Planning:** Emit all `ToolCallEvent` events (shows intent)
2. **Execution:** Run tools in parallel (no events)
3. **Results:** Emit all `ToolResultEvent` events in order (shows outcomes)

This provides clear mental model and maintains chronological consistency.

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

```python
async def test_parallel_tool_execution():
    """Verify parallel execution is faster than sequential."""
    tool1 = SlowTool(delay=0.2)  # 200ms
    tool2 = SlowTool(delay=0.3)  # 300ms
    tool3 = SlowTool(delay=0.1)  # 100ms

    start = time.time()
    results = await agent._execute_tools_parallel([tool1, tool2, tool3])
    elapsed = time.time() - start

    # Should complete in ~300ms (slowest), not 600ms (sum)
    assert elapsed < 0.4
    assert len(results) == 3
```

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

- [ ] Multiple tool calls execute in parallel (timing test validates)
- [ ] Results correctly ordered and formatted
- [ ] Event streaming maintains logical flow
- [ ] Error handling preserves partial results
- [ ] No breaking changes to agent API
- [ ] Existing tests still pass
- [ ] New test validates parallel timing

---

## Testing Checklist

- [ ] Run existing tests (no regressions)
- [ ] Create mock tools with delays
- [ ] Verify parallel > sequential performance
- [ ] Test error handling (one fails, others succeed)
- [ ] Test single tool case
- [ ] Test event order
- [ ] Manual test with multi-tool queries

---

## Technical Notes

**Stack:**
- `asyncio.gather()` - Core Python async primitive
- `return_exceptions=True` - Prevents cascading failures
- Type hints: `List[ToolUse]`, `List[Tuple[ToolUse, str]]`

**Quality Standards:**
- Follow existing async/await patterns
- Add docstrings for new methods
- Maintain clean event streaming

**No Breaking Changes:**
- Agent API unchanged (`agent.chat()` signature same)
- Event types unchanged (same AgentEvent models)
- Message format unchanged (Anthropic tool_result format)
