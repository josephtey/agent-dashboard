# Pull Request Management

## Overview

Pull requests are automatically created when tasks move to staging and updated when tasks are refined. This provides seamless integration between task orchestration and GitHub workflow.

---

## Auto-Create PR (On Staging)

**Trigger:** Task moves to "staging" status after successful implementation

**Steps:**

1. **Push branch to remote:**
   ```bash
   cd {worktree_path}
   git push -u origin feature/task-{id}
   ```

2. **Generate PR description from spec and commits:**
   ```bash
   # Read the spec
   spec=$(cat tasks/{id}/spec.md)

   # Get commit log since diverging from main
   commits=$(git log origin/main..HEAD --oneline)

   # Extract key sections from spec
   title=$(grep "^# " tasks/{id}/spec.md | head -1 | sed 's/# //')
   summary=$(awk '/## Overview/,/##/' tasks/{id}/spec.md | grep -v "^##")
   ```

3. **Create PR with generated description:**
   ```bash
   gh pr create --title "{task_title}" --body "$(cat <<EOF
## Summary
{summary from spec}

## Implementation
{commits summary}

## Key Changes
{extracted from agent log}

## Test Plan
{from spec testing section}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
   ```

4. **Store PR URL:**
   ```bash
   # Capture PR URL
   pr_url=$(gh pr view --json url -q .url)

   # Update task data
   jq --arg url "$pr_url" \
     '.tasks = [.tasks[] | if .id == {id} then . + {"pr_url": $url} else . end]' \
     data/tasks.json > data/tasks.json.tmp
   mv data/tasks.json.tmp data/tasks.json

   # Also save to file for easy reference
   echo "$pr_url" > tasks/{id}/pr_url.txt
   ```

5. **Notify user:**
   ```
   Task {id} moved to staging. PR created at {pr_url}.
   Test and request refinements with 'Refine task {id}: <description>'.
   ```

---

## Auto-Update PR (On Refinement)

**Trigger:** Task refinement completes (task remains in "staging")

**Steps:**

1. **Push refinement commits:**
   ```bash
   cd {worktree_path}
   git push origin feature/task-{id}
   ```

2. **Extract refinement summary from agent log:**
   ```bash
   # Get the latest refinement section from agent log
   refinement_summary=$(tail -100 tasks/{id}/agent.log | grep -A 20 "Refinement:")
   ```

3. **Add comment to PR:**
   ```bash
   # Get PR number from URL
   pr_number=$(echo $pr_url | grep -o '[0-9]*$')

   gh pr comment $pr_number --body "$(cat <<EOF
## Refinement: {refinement_title}

{refinement_description}

**Changes made:**
{summary from agent log}

**Files modified:**
$(git diff HEAD~1 --name-only)

Committed and pushed.
EOF
)"
   ```

4. **Notify user:**
   ```
   Refinement completed for task {id}.
   Changes committed and pushed. PR updated at {pr_url}.
   ```

---

## PR Description Template

```markdown
## Summary
[1-3 sentence overview from spec]

## Implementation Details

[Key architectural decisions and approach]

### Backend Changes
- [List of backend changes]

### Frontend Changes
- [List of frontend changes]

### Testing
- [Test coverage summary]

## Key Files Changed
- `path/to/file` - [description]
- `path/to/another` - [description]

## Performance Impact
[If applicable, performance metrics]

## Breaking Changes
[None, or list of breaking changes]

## Test Plan
- [x] Unit tests passing
- [x] Integration tests passing
- [x] Manual testing completed
- [x] [Any specific test scenarios]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Error Handling

### PR Creation Fails
- Log error to task
- Set task status to "failed" with error message
- User can retry with "Retry task {id}"

### PR Update Fails
- Log error but don't fail the refinement
- User can manually push and comment

### gh CLI Not Authenticated
- Check `gh auth status` before operations
- Provide clear error: "GitHub CLI not authenticated. Run: gh auth login"

---

## Best Practices

1. **Always include test plan** - Users appreciate seeing what was tested
2. **Link to related issues** - If spec mentions issues, include them in PR
3. **Keep descriptions concise** - Summary should be 1-3 sentences, details in sections
4. **Update PR on every refinement** - Maintains clear history of iteration
5. **Include performance metrics** - When relevant, show before/after
6. **Auto-close on merge** - GitHub automatically closes PRs when merged

---

## Example Flow

```
1. User: "Assign task 5"
   → Agent implements
   → Moves to staging
   → Auto-creates PR #1
   → User notified: "PR created at github.com/repo/pull/1"

2. User: "Refine task 5: make text blue"
   → Agent refines
   → Auto-pushes commits
   → Auto-comments on PR #1: "Refinement: Changed text color to blue"
   → User notified: "PR updated at github.com/repo/pull/1"

3. User: "Refine task 5: add animation"
   → Agent refines
   → Auto-pushes commits
   → Auto-comments on PR #1: "Refinement: Added fade-in animation"
   → User notified: "PR updated at github.com/repo/pull/1"

4. User: "Approve task 5"
   → Task marked completed
   → PR remains open for manual review/merge
```

---

## Integration with Merge Queue

- Approved tasks are added to merge queue
- PR URL is available in merge queue data
- User can review PR before merging via "Process merge queue"
- PRs are NOT auto-merged (manual review required)
