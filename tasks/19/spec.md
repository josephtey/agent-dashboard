# Agentic File Search - Phase 1 MVP

## Context

The user wants to implement agentic file search for the beyond-agents project, enabling the AI agent to autonomously explore codebases and find relevant information. The beyond-agents README already documents extensive research on "Phase 4c: Agentic Code Search" with a 3-phase implementation strategy.

**Why this is needed:**
- Current agent can only read files by explicit path (no exploration capability)
- No way to search code contents or discover file structure
- Limits agent's ability to help with codebase-related tasks

**Phase 1 Goal:** Build MVP with three simple search tools, following existing architecture patterns. Keep execution sequential (simple). Parallel execution and full-text indexing come in Phase 2/3.

**Reference:** https://benanderson.work/blog/agentic-search-for-dummies/ - Key insight: separate search/read operations, let agent drive discovery iteratively

## Implementation Approach

### Three New Tools (Following Existing Pattern)

Implement three focused tools that compose naturally:

1. **`list_directory`** - Explore directory structure
2. **`grep_search`** - Search file contents with regex
3. **`read_file`** - Already exists; reads full file content

**Why three separate tools:**
- Follows existing architecture (`read_file` pattern at `src/tools/implementations/read_file.py`)
- Composable: agent can mix and match (list → grep → read)
- Easy to test individually
- Natural evolution to parallel execution in Phase 2
- Simple: each tool does one thing well

**Agent workflow example:**
```
User: "How is tool execution implemented?"
→ grep_search(pattern="execute.*tool", file_pattern="*.py")
→ read_file(path="src/agent.py")
→ Agent analyzes and responds
```

## Implementation Plan

### 1. Create `list_directory` Tool

**File:** `/Users/josephtey/Projects/beyond-agents/src/tools/implementations/list_directory.py`

**Purpose:** Enable agent to explore directory structure and discover files.

**Input Schema:**
```json
{
  "path": "Directory to list (default: '.')",
  "recursive": "List recursively (default: false)",
  "max_depth": "Max recursion depth (default: 2)"
}
```

**Output:** Tree-formatted directory listing with line counts
```
src/
├── agent.py (170 lines)
├── main.py (95 lines)
└── tools/
    ├── base.py (41 lines)
    └── implementations/
        └── read_file.py (56 lines)
```

**Implementation:**
- Inherit from `Tool` base class (at `src/tools/base.py`)
- Use `asyncio.to_thread()` for file I/O (like existing `read_file`)
- Use `pathlib.Path` for cross-platform support
- Respect `.gitignore` patterns (add `gitignore-parser` to requirements)
- Count lines per file for agent context
- Format as tree structure with box-drawing characters

### 2. Create `grep_search` Tool

**File:** `/Users/josephtey/Projects/beyond-agents/src/tools/implementations/grep_search.py`

**Purpose:** Enable agent to search file contents and find relevant code.

**Input Schema:**
```json
{
  "pattern": "Regex pattern to search (required)",
  "path": "Directory/file to search (default: '.')",
  "file_pattern": "Glob to filter files, e.g., '*.py' (default: '*')",
  "context_lines": "Lines of context around matches (default: 2)",
  "max_results": "Maximum matches to return (default: 50)"
}
```

**Output:** Grouped matches with context
```
Found 3 matches in 2 files:

src/agent.py:
  42: async def _execute_tools(self, response: ModelResponse):
  43:     """Execute tool calls asynchronously."""
  44:     tool_results = []
  ---
  140:     tool = self.tool_registry.get(tool_use.name)
  141:     if tool:
  142:         result = await tool.execute(**tool_use.input)
```

**Implementation:**
- Inherit from `Tool` base class
- Use Python's `re` module for pattern matching (no external deps)
- Use `asyncio.to_thread()` for file operations
- Support glob patterns via `fnmatch` for file filtering
- Skip binary files (detect null bytes)
- Respect `.gitignore` patterns
- Show context lines for each match
- Truncate long lines (>200 chars) to prevent context pollution
- Group results by file for readability

### 3. Update Tool Registry

**File:** `/Users/josephtey/Projects/beyond-agents/src/tools/__init__.py`

Add imports and exports:
```python
from .implementations.list_directory import ListDirectoryTool
from .implementations.grep_search import GrepSearchTool

__all__ = [..., "ListDirectoryTool", "GrepSearchTool"]
```

### 4. Register Tools in Main

**File:** `/Users/josephtey/Projects/beyond-agents/src/main.py`

Register new tools with agent (around line 31):
```python
from .tools import (
    ToolRegistry, ReadFileTool,
    ListDirectoryTool, GrepSearchTool,  # Add these
    WebSearchMCPTool
)

tool_registry = ToolRegistry()
tool_registry.register(ReadFileTool())
tool_registry.register(ListDirectoryTool())      # Add
tool_registry.register(GrepSearchTool())         # Add
tool_registry.register(WebSearchMCPTool(mcp_client=mcp_client))
```

Update system prompt (around line 37):
```python
system_prompt=(
    "You are a helpful assistant. You can read files, list directories, "
    "search for patterns in code, and search the web. "
    "Use these tools to explore codebases and answer questions about code."
)
```

### 5. Add Dependency

**File:** `/Users/josephtey/Projects/beyond-agents/requirements.txt`

Add:
```
gitignore-parser==0.1.11
```

## Critical Files to Modify

1. **New:** `/Users/josephtey/Projects/beyond-agents/src/tools/implementations/list_directory.py` - ~150 lines
2. **New:** `/Users/josephtey/Projects/beyond-agents/src/tools/implementations/grep_search.py` - ~180 lines
3. **Update:** `/Users/josephtey/Projects/beyond-agents/src/tools/__init__.py` - Add 2 imports/exports
4. **Update:** `/Users/josephtey/Projects/beyond-agents/src/main.py` - Register 2 new tools, update system prompt
5. **Update:** `/Users/josephtey/Projects/beyond-agents/requirements.txt` - Add gitignore-parser

**Total code:** ~350 new lines, minimal changes to existing files

## Verification

### Manual Testing

Run the dev server and test with these prompts:

1. **Explore structure:** "What's the structure of this project?"
   - Verify agent uses `list_directory` effectively
   - Check tree output is readable

2. **Find code:** "Find all async functions in the codebase"
   - Verify agent uses `grep_search` with pattern `async def`
   - Check matches include context lines

3. **Deep dive:** "How is tool execution implemented?"
   - Verify agent chains: grep → read → analysis
   - Check workflow feels natural

4. **Edge cases:**
   - "Search for TODO comments" (grep_search)
   - "List all files in src/tools" (list_directory recursive)
   - "Read the agent.py file" (existing read_file)

### Expected Behavior

**Good agent workflow:**
```
User: "How is web search implemented?"

Agent:
1. grep_search(pattern="web.*search", file_pattern="*.py")
   → Finds src/mcp_servers/web_search_server.py
2. read_file(path="src/mcp_servers/web_search_server.py")
   → Reads full implementation
3. Responds with detailed explanation
```

**Performance baseline (Phase 1, sequential execution):**
- Simple query (1-2 tools): ~1-2 seconds
- Complex query (4-6 tools): ~5-10 seconds

This is acceptable for MVP. Phase 2 will add parallel execution for 4x speedup.

## Future Evolution

**Phase 1 (This plan):** ✅ Three simple tools, sequential execution

**Phase 2:** Parallel tool execution
- Modify `src/agent.py` to use `asyncio.gather()` for concurrent tool calls
- Expected: 4x latency reduction (20→5 turns)
- Aligns with README Phase 4c research

**Phase 3:** Full-text search index
- Add Tantivy-based indexing
- Implement `search_index` tool for instant keyword search
- Keep existing tools for dynamic exploration

## Risk Mitigation

**Error handling:**
- Wrap regex compilation in try/catch (invalid patterns)
- Handle permission errors gracefully (unreadable files/dirs)
- Detect and skip binary files (check for null bytes)
- Add `asyncio.wait_for()` timeout protection

**Performance safeguards:**
- Default `max_results=50` prevents overwhelming output
- Default `max_depth=2` prevents deep recursion
- Truncate long lines in grep output
- Skip `.git` and other common noise directories

**Testing strategy:**
- Unit test each tool independently
- Integration test agent workflows
- Manual testing with diverse prompts
- Verify .gitignore patterns work correctly

## Success Criteria

Phase 1 MVP is successful if:
- ✅ Agent can explore directory structure
- ✅ Agent can search code contents with patterns
- ✅ Agent can read full files
- ✅ Tools compose naturally in workflows
- ✅ Performance is acceptable for typical codebases (<1000 files)
- ✅ Manual testing reveals intuitive agent UX
