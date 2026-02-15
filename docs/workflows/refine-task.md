# Refine Task Workflow

## User Input Patterns
- "Refine task `<id>`: `<description>`"
- "Update task `<id>`: `<description>`"
- "Fix `<description>` in task `<id>`"

## Purpose
Allows the PI to request refinements on tasks in "staging" status. The appropriate student agent will execute the refinement with full context from the original implementation.

## Workflow Steps

### 1. Validate
- Task exists
- Task status is "staging"
- Worktree still exists and is active

### 2. Spawn Refinement Sub-Agent
- Use the Task tool with `subagent_type="general-purpose"`
- Run in FOREGROUND
- Provide comprehensive prompt (see `prompts/task-refinement.template.md`)
- Include:
  - Original task specification
  - Refinement description
  - Student context (accumulated learnings and decisions)
  - Repository and worktree paths
  - Previous agent log for context
  - Instruction to commit changes with descriptive message

### 3. After Refinement Completes
- Append refinement summary to `tasks/{id}/agent.log`
- **CRITICAL: Extract taste preferences** from the refinement request:
  - Analyze what the PI asked to change and why
  - Extract underlying preferences (minimalism, color choices, interaction patterns, etc.)
  - Add these as learnings to student context with clear rationale
  - Example: If PI said "remove the intro text", add learning: "PI prefers minimal UI without unnecessary introductory elements"
- Update student context with any new decisions or learnings
- **Update Pull Request:**
  - Push refinement commits: `git push origin feature/task-{id}`
  - Add comment to PR with refinement summary:
    ```bash
    gh pr comment {pr_number} --body "## Refinement: {refinement_title}

    {refinement_description}

    **Changes made:**
    - {summary from agent log}

    Committed and pushed."
    ```
- Task remains in "staging" status
- Notify user: "Refinement completed for task {id}. Changes committed and pushed. PR updated at {pr_url}. Test again or use 'Approve task {id}' when satisfied."

### 4. Multiple Refinement Cycles
- Tasks can be refined multiple times before approval
- Each refinement is a separate commit for traceability
- Worktree remains active throughout all refinements

## Taste Preference Extraction

Every refinement request is a teaching moment. Extract and save:

**Examples:**
- "Remove intro text" → Learning: "PI prefers ultra-minimal UIs without introductory elements"
- "Use blue instead" → Learning: "PI prefers blue accent colors over purple"
- "This is too complex" → Learning: "PI values simplicity over feature richness"

**Format:**
```json
{
  "task_id": X,
  "learning": "PI prefers [preference]",
  "context": "[what was changed and why]",
  "timestamp": "..."
}
```

## Error Handling

- **Task not found**: "Task {id} not found."
- **Invalid status**: "Task {id} is {current_status}. Can only refine tasks in 'staging' status."
- **Worktree missing**: "Worktree not found at {worktree_path}. Cannot refine task."
- **Empty description**: "Please provide a refinement description."
