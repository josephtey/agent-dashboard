# Approve Task Workflow

## User Input Patterns
- "Approve task `<id>`"
- "Complete task `<id>`"
- "Task `<id>` looks good"

## Purpose
Approves a task in staging: merges the PR, updates task status, and cleans up the worktree.

## Workflow Steps

### 1. Validate
- Task exists
- Task status is "staging"
- PR URL exists in task data

### 2. Merge the Pull Request
- Get PR URL from task data (`pr_url` field)
- Extract PR number from URL
- Merge PR using GitHub CLI:
  ```bash
  gh pr merge {pr_number} --squash --delete-branch
  ```
- This will:
  - Squash all commits into one
  - Merge to main branch
  - Delete the feature branch from remote
  - Close the PR automatically

### 3. Update Task State
- Set status to "completed"
- Set `completed_at` timestamp
- Set `merge_status` to "merged"
- Save `data/tasks.json`

### 4. Cleanup Worktree
- Run `scripts/cleanup-worktree.sh` to remove worktree
- Update data/worktrees.json entry status to "removed"

### 5. Notify User
- Confirm: "Task {id} approved and merged. PR #{pr_number} merged to main via squash commit. Worktree cleaned up."

## Error Handling

- **Task not found**: "Task {id} not found."
- **Invalid status**: "Task {id} is {current_status}. Can only approve tasks in 'staging' status."
- **No PR URL**: "Task {id} has no PR URL. Cannot merge."
- **Merge conflicts**: If `gh pr merge` fails due to conflicts:
  - Do NOT update task status
  - Notify user: "Cannot merge task {id}: PR has conflicts. Resolve conflicts in the PR, then try approving again."
- **PR already merged**: If PR is already merged (shouldn't happen), just update task status and clean up worktree
