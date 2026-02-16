# Task #21: Agentic Eval System for File Search

**Repository:** beyond-agents
**Repository Path:** /Users/josephtey/Projects/beyond-agents
**Status:** TODO
**Created:** 2026-02-15T12:00:00Z

---

## Description

Build a systematic evaluation framework to test and measure the effectiveness of the agentic file search implementation (Task 19). Unlike traditional unit tests, this eval system must assess entire workflows: tool selection, sequencing, reasoning quality, and final answer correctness.

### Why This Is Needed

Now that agentic file search is implemented (task 19), we need to:
- Systematically test file search effectiveness across different scenarios
- Evaluate tool selection and usage patterns
- Measure answer correctness and reasoning quality
- Catch regressions when modifying agent behavior
- Track performance metrics over time

### Core Requirements

**1. Data-Driven Eval Cases**
- Test cases defined in JSON format (`evals/file_search/cases.json`)
- Each case specifies: prompt, expected tools, success criteria, timeout
- Easy to add new test scenarios without code changes

**2. Async Eval Runner**
- Execute agent workflows in isolated sessions
- Capture full event traces (tool calls, results, thinking, final response)
- Run multiple evals in parallel for speed
- Timeout protection to prevent runaway loops
- Save results and traces for debugging

**3. Deterministic Grading**
- Rule-based grading: tool usage validation, keyword presence, file discovery
- Score calculation (0.0 to 1.0) based on criteria met
- Clear failure messages for debugging
- Future: Add LLM-as-judge for nuanced quality assessment

### Initial Test Scenarios

Create 5 core test cases covering:
1. **Pattern search** - "Find all async functions"
2. **Directory exploration** - "What's the structure of this project?"
3. **Specific file lookup** - "How is tool execution implemented?"
4. **Multi-step reasoning** - "Find the file that implements web search"
5. **Code search** - "Search for TODO comments in the codebase"

### File Structure

```
evals/
├── __init__.py
├── types.py              # EvalCase, EvalTrace, EvalResult types (Pydantic)
├── runner.py             # Main eval execution engine
├── graders.py            # Deterministic grading logic
├── __main__.py           # CLI entry point
├── file_search/
│   ├── cases.json       # Test scenarios
│   └── README.md        # Documentation
└── results/             # Saved eval runs (timestamped)
    └── {timestamp}/
        ├── summary.json  # Overall metrics
        ├── traces/       # Full event traces per case
        └── failures.json # Failed cases for analysis
```

### Key Implementation Details

**Types (`evals/types.py`):**
- `EvalCase` - Test case with prompt, expected tools, success criteria
- `EvalTrace` - Full execution trace with tool calls, thinking, response
- `EvalResult` - Grading result with pass/fail, score, failures
- `SuccessCriteria` - Rules for deterministic grading

**Runner (`evals/runner.py`):**
- Load eval cases from JSON
- Execute agent workflows using existing Agent class and tools
- Capture events via agent.chat() async iterator
- Grade results using DeterministicGrader
- Save traces and summary to results directory
- Run cases in parallel with asyncio.gather()

**Grader (`evals/graders.py`):**
- Check if expected tools were used
- Validate tool call count (not too many/few)
- Check for required keywords in response
- Verify expected files were discovered
- Calculate score based on criteria met

**CLI (`evals/__main__.py`):**
- Simple entry point: `python -m evals`
- Print summary with pass/fail status
- Show failures with clear error messages

### Integration Points

Uses existing beyond-agents infrastructure:
- `src/agent.py` - Agent class and chat() method
- `src/tools/` - Tool registry and implementations (read_file, list_directory, grep_search)
- Event system - ToolCallEvent, ToolResultEvent, ThinkingEvent, FinalResponseEvent

No modifications to existing agent code required - evals run in isolation.

### Success Criteria

Phase 1 eval system is successful if:
- ✅ Can run 5+ file search scenarios automatically
- ✅ Deterministic grading catches regressions
- ✅ Full traces saved for debugging failed cases
- ✅ Results output is human-readable and actionable
- ✅ Runs in <30 seconds total
- ✅ Easy to add new test cases (just edit JSON)
- ✅ Integrates cleanly with existing architecture

### Verification

**Running evals:**
```bash
python -m evals
```

**Expected output:**
```
============================================================
EVAL RESULTS: 5/5 passed
============================================================

✅ PASS find-async-functions (score: 1.00)
✅ PASS explore-project-structure (score: 1.00)
✅ PASS find-tool-execution (score: 1.00)
✅ PASS find-web-search-file (score: 1.00)
✅ PASS search-todo-comments (score: 1.00)
```

**Debugging failures:**
When an eval fails, inspect the trace in `evals/results/{timestamp}/traces/{case_id}.json` to see exact tool calls, thinking, and response.

### Future Extensions (Not in Phase 1)

Phase 2:
- LLM-as-judge grader for answer quality
- Regression detection (compare against baseline traces)
- Performance metrics (token usage, latency tracking)

Phase 3:
- Multi-turn conversation evals
- Auto-generated test cases
- Coverage tracking for tool combinations

---

## Notes

Reference: The detailed implementation plan is available in the plan mode transcript. Key research sources:
- LLM Agent Evaluation Complete Guide (Confident AI)
- Demystifying evals for AI agents (Anthropic)
- Building an LLM evaluation framework (Datadog)
- Evaluating LLM Agents in Multi-Step Workflows (CodeAnt)
