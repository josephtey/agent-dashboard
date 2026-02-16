# Let It Rip Mode (Fast Track)

## User Input Patterns
- "Let it rip: `<repo-name>`: `<title>`. `<description>`"
- "Fast track: `<repo-name>`: `<title>`. `<description>`"
- "Quick task: `<repo-name>`: `<title>`. `<description>`"

## Purpose
Fast-track mode for simple, straightforward tasks that don't require planning or staging. Creates, executes, and merges the task in one go.

## When to Use

**✅ Use for:**
- Simple bug fixes (typos, small corrections)
- Uncomment/comment code
- Add simple logging or debug statements
- Update documentation
- Rename files or variables
- Add simple configuration
- Any task that's obvious and low-risk

**❌ Do NOT use for:**
- New features requiring design decisions
- Refactoring or architectural changes
- Tasks affecting multiple components
- Anything requiring user input or clarification
- Complex bug fixes
- Tasks where multiple approaches exist

## Workflow Steps

### 1. Validate
- Repository exists
- Description is clear and actionable
- Task is simple enough for fast-track (use judgment)
- Current in_progress tasks < max_parallel_tasks

### 2. Create Minimal Spec
- Get next task ID from data/tasks.json
- Create directory `tasks/{id}/`
- Write minimal spec to `tasks/{id}/spec.md` based directly on user's description
- No plan mode, no conversation - just translate the user's prompt into a structured spec

**Minimal spec format:**
```markdown
# Task #{id}: {title}

**Repository:** {repo}
**Mode:** Fast Track
**Created:** {timestamp}

## Description

{user's description expanded slightly}

## Implementation

{brief bullet points of what needs to be done}

## Success Criteria

- Task completed as described
- No breaking changes
- Code follows repository conventions
```

### 3. Register Task
- Add task to data/tasks.json with status "in_progress" (skip "todo")
- Increment next_id
- Set created_at and assigned_at to same timestamp

### 4. Create Worktree and Assign Immediately
- Run scripts/init-worktree.sh
- Add entry to data/worktrees.json
- Update task with worktree_path and branch

### 5. Spawn Sub-Agent
- Use Task tool with subagent_type="general-purpose"
- Run in FOREGROUND
- Provide straightforward prompt:
  - Task description
  - Repository and worktree paths
  - Student context (assigned student for repo)
  - Instruction to implement, test, commit, and push
  - Note that this is a fast-track task (simple and straightforward)

### 6. Run Automated Tests
**After agent completes implementation:**

1. **Check for repo eval suite** (`tests/eval.spec.ts` or `tests/test_eval.py`)
2. **Add test for current feature** to suite (or create suite if first task)
3. **Run full eval suite** - all accumulated tests
4. **Capture results** - pass/fail counts, screenshots, errors

**Fast-track philosophy:**
- Smoke test + minimal feature test (5 minutes max to write)
- Don't aim for perfection - aim for "catches obvious breakage"
- Add to cumulative suite for future regression catching

### 7. Auto-Progression Based on Test Results

**If tests pass:**
- Push branch to remote
- Create PR with test results in description
- Merge PR immediately: `gh pr merge {pr_number} --squash --delete-branch`
- Update status to "completed"
- Set merge_status to "merged"
- Cleanup worktree
- Notify user: "Task {id} completed and merged via fast-track! Tests passed. Merged to main."

**If tests fail:**
- Push branch to remote
- Create PR with failed test results
- Move to "staging" status (do NOT auto-merge)
- Keep worktree active
- Notify user: "Task {id} moved to staging. ⚠️ Automated tests failed - review needed. PR at {pr_url}. Use 'Refine task {id}' to fix."

**If implementation fails:**
- Update status to "failed"
- Cleanup worktree
- Report error to user

### 8. Update Student Context
- Extract learnings and decisions from agent log
- Update student's context file even for fast-track tasks
- Keep context accumulation consistent

## Example

```
User: Let it rip: joetey.com: Fix typo in README. Change "teh" to "the" in line 42.

Claude:
1. Creates task #15 with minimal spec
2. Assigns to Rio (joetey.com owner)
3. Spawns agent to fix typo
4. Agent commits changes
5. Runs automated tests (if applicable)
6. Tests pass → Creates PR → Auto-merges
7. "Task 15 completed and merged via fast-track! Tests passed. Merged to main."

Total time: ~45 seconds instead of ~5 minutes with full workflow
```

```
User: Let it rip: beyond-agents: Add loading spinner to search button

Claude:
1. Creates task #20
2. Assigns to Woody (beyond-agents owner)
3. Agent implements spinner
4. Starts dev server and runs Playwright tests
5. Tests fail (spinner not visible) → Moves to staging instead of merging
6. "Task 20 moved to staging. ⚠️ Tests failed - review needed. PR at {url}"
7. User can refine or check the PR to see what went wrong
```

## Important Notes

- Skip plan mode entirely - trust the user's description
- **Automated tests are run before merging** - ensures quality even in fast-track
- Merge directly only if tests pass - otherwise moves to staging for review
- Only for tasks where you're confident of the approach
- If in doubt, use regular "Create task" with planning instead
- Update student context even for fast-track tasks
- PR is always created (with test results) even for successful fast-track merges

## Error Handling

- **Too complex**: "This task seems complex. Use 'Create task' with planning instead."
- **Unclear description**: "Please provide more details. Fast-track requires clear, specific instructions."
- **Repository not found**: "Repository {repo} not found."
- **Max parallel tasks**: "Already running {count} tasks. Wait for completion or use regular workflow."
