# Assign Task Workflow

## User Input Patterns
- "Assign task `<id>`"
- "Start task `<id>`"
- "Execute task `<id>`"

## Workflow Steps

### 1. Validate
- Task exists
- Task status is "todo"
- Current in_progress tasks < max_parallel_tasks (from data/tasks.json config, default: 3)

### 2. Create Git Worktree
- Run `scripts/init-worktree.sh` with repo_path, task_id, and branch name
- Capture worktree_path from script output
- Add entry to `data/worktrees.json`:
  ```json
  {
    "task_id": {id},
    "repo": "{repo}",
    "repo_path": "{repo_path}",
    "worktree_path": "{captured_path}",
    "branch": "feature/task-{id}",
    "created_at": "{timestamp}",
    "status": "active"
  }
  ```

### 3. Update Task State
- Set status to "in_progress"
- Set `assigned_at` timestamp
- Set `branch` to `feature/task-{id}`
- Set `worktree_path` to the captured path from script
- Save `data/tasks.json`

### 4. Spawn Sub-Agent
- Use the Task tool with `subagent_type="general-purpose"`
- **Run in FOREGROUND** (do NOT use `run_in_background=true`)
- Provide comprehensive prompt (see `prompts/task-assignment.template.md`)
- Include:
  - Task specification (read from spec file)
  - Repository path
  - Branch name
  - Git workflow instructions
  - Implementation expectations
  - Student context
  - `dangerouslyDisableSandbox=true` for all Bash commands

### 5. Save Agent Output
- After the agent completes (foreground execution), write work summary to `tasks/{id}/agent.log`
- Include key actions taken, files modified, and final status

### 6. Monitor Completion
Since agent runs in foreground, it blocks until complete.

**On Success:**
- Update task status to "staging"
- Set `staging_at` timestamp
- Keep worktree active (do NOT cleanup)
- Keep data/worktrees.json entry status as "active"
- Update student context with decisions and learnings from agent log
- **Create Pull Request:**
  - Push branch to remote: `git push -u origin feature/task-{id}`
  - Generate PR description from spec and commits
  - Create PR: `gh pr create --title "{task_title}" --body "{generated_description}"`
  - Store PR URL in task data: `tasks/{id}/pr_url.txt`
  - Update `data/tasks.json` with `pr_url` field
- Notify user: "Task {id} moved to staging. PR created at {pr_url}. You can now test and request refinements using 'Refine task {id}: <description>'. When satisfied, use 'Approve task {id}' to complete."

**On Failure:**
- Update task status to "failed"
- Capture error message
- Run `scripts/cleanup-worktree.sh` to remove worktree
- Update data/worktrees.json entry status to "removed"
- Save `data/tasks.json`

## Assigning Multiple Tasks

**User patterns:**
- "Assign tasks `<id1>`, `<id2>`, `<id3>`"
- "Start tasks `<id1>` and `<id2>`"

**Process:**
1. Validate all tasks (exist, status "todo", won't exceed max_parallel_tasks)
2. For each task, execute standard assignment workflow sequentially
3. Notify user with all assigned tasks, worktree paths, and log viewing commands

## Error Handling

- **Max parallel tasks reached**: "Already running {count} tasks (max: {max_parallel_tasks}). Wait for a task to complete or increase max_parallel_tasks in data/tasks.json config."
- **Task not found**: "Task {id} not found."
- **Invalid status**: "Task {id} is {current_status}. Can only assign tasks with 'todo' status."
- **Worktree creation failed**: "Failed to create worktree for task {id}. Check that branch doesn't already exist."
- **Batch validation failed**: Reject entire batch if any task is invalid
- **Batch would exceed limit**: Error with current count and limit
- **Worktree creation fails in batch**: Clean up already-created worktrees and error
