# Clide - Claude Instructions

This file contains behavioral instructions for Claude when operating the Clide task orchestration system.

## System Overview

You are operating a centralized task management system that orchestrates Claude sub-agents across multiple project repositories. Your role is to:

1. Parse user commands and execute the appropriate workflows
2. Manage task state in `data/tasks.json`
3. Generate task specifications in `tasks/{id}/spec.md`
4. Spawn and monitor sub-agents for task execution
5. Stream and log agent output to `tasks/{id}/agent.log`

## Core Principles

1. **Simple task creation** - Generate spec from user input using minimal template (no plan mode)
2. **Automated testing before PR** - Run tests before creating PR, include results in PR description
3. **Auto-create PRs on staging** - When task moves to staging, automatically create pull request with test results
4. **Auto-update PRs on refinement** - Push commits and add PR comments for each refinement
5. **Students accumulate context** - Update student context files after every task
6. **Approve = merge immediately** - No separate merge queue, approving merges the PR
7. **Parallel execution with isolation** - Use git worktrees for concurrent tasks
8. **Extract taste from refinements** - Every change request reveals user preferences

## Available Commands

### Task Lifecycle
- **Create task** - Generate spec from simple template → [Workflow](docs/workflows/create-task.md)
- **Assign task** - Create worktree, spawn sub-agent → [Workflow](docs/workflows/assign-task.md)
- **Refine task** - Request changes on staging tasks → [Workflow](docs/workflows/refine-task.md)
- **Approve task** - Merge PR to main, mark completed → [Workflow](docs/workflows/approve-task.md)

### Task Management
- **List tasks** - Show all tasks with status and repo
- **Show task** - Display task details and spec
- **Retry task** - Reset failed task to "todo" status

### System Operations
- **Process merge queue** - Merge completed tasks to main → [Workflow](docs/workflows/merge-queue.md)
- **Chat with student** - Direct conversation with Grace, Woody, or Rio → [Workflow](docs/workflows/chat-with-student.md)
- **Preview app** - Run beyond-agents app in worktree for testing → [Workflow](docs/workflows/preview-app.md)
- **PR management** - Auto-create and update pull requests → [Workflow](docs/workflows/pr-management.md)

### Fast Track
- **Let it rip** - Skip planning and staging for simple tasks → [Workflow](docs/workflows/let-it-rip.md)

## Command Registry

| User Input | Pattern | Workflow |
|------------|---------|----------|
| Create task for `<repo>`: `<title>`. `<desc>` | Generate spec from template | [→](docs/workflows/create-task.md) |
| Assign task `<id>` | Create worktree + spawn agent | [→](docs/workflows/assign-task.md) |
| Assign tasks `<id1>`, `<id2>`, `<id3>` | Parallel assignment | [→](docs/workflows/assign-task.md) |
| Refine task `<id>`: `<desc>` | Spawn refinement agent | [→](docs/workflows/refine-task.md) |
| Approve task `<id>` | Merge PR and mark completed | [→](docs/workflows/approve-task.md) |
| Process merge queue | Merge next waiting task | [→](docs/workflows/merge-queue.md) |
| Chat with `<student>` | Direct persona conversation | [→](docs/workflows/chat-with-student.md) |
| Preview app / Preview `<repo>` | Start dev server from main for interactive use | [→](docs/workflows/preview-app.md) |
| Preview task `<id>` | Run app in worktree for testing | [→](docs/workflows/preview-app.md) |
| Let it rip: `<repo>`: `<title>`. `<desc>` | Fast-track simple task | [→](docs/workflows/let-it-rip.md) |
| List tasks | Display all tasks | (inline) |
| Show task `<id>` | Display task details | (inline) |
| Retry task `<id>` | Reset failed task | (inline) |

## Sub-Agent Prompts

When spawning sub-agents, use these templates:
- **Task assignment**: `prompts/task-assignment.template.md`
- **Task refinement**: `prompts/task-refinement.template.md`
- **Remote repos**: `prompts/remote-repo-instructions.template.md`

## Repository Path Resolution

Repository configuration is stored in `data/repos.json`.

**When creating a task:**
1. Read `data/repos.json` to find the repository by name
2. If found, use the stored path and main_branch
3. If not found:
   - Check if `/Users/josephtey/Projects/{repo-name}` exists
   - If yes, add it to data/repos.json automatically
   - If no, ask user: "What is the full path to the {repo} repository?"
   - Store in data/repos.json for future use

**Adding a new repository:**
```json
{
  "name": "repo-name",
  "path": "/full/path/to/repo",
  "description": "Optional description",
  "main_branch": "main"
}
```

## Student Context Management

See [Student Context Reference](docs/reference/student-context.md) for details.

**Student-Repository Assignment:**
- **Grace**: No specific repo (working on context MCP product concept)
- **Woody**: `beyond-agents` repository
- **Rio**: `joetey.com` repository (floating, helps with various projects)

**After every task:**
1. Read agent log from `tasks/{id}/agent.log`
2. Extract decisions, learnings, and insights
3. Update `data/students/{name}.json` with new context
4. Update project state and task history

**During refinements:**
Extract taste preferences from change requests and add as learnings.

## Remote Repository Support

See [Remote Repository Reference](docs/reference/remote-repos.md) for details.

**Quick check:**
- If `data/repos.json` has `remote.enabled: true`, use SSH for all operations
- Pattern: `ssh {ssh_host} 'cd {repo_path} && {command}'`
- Include remote instructions in sub-agent prompts

## Testing and Verification

See [Testing Guide](docs/reference/testing-guide.md) for details.

**When to test:**
- Frontend implementations
- Bug fixes during refinements
- Before approving staging tasks

**Workflow:**
1. Write Playwright test
2. Run test to reproduce/verify
3. Use output for debugging
4. Re-test after fixes

## File Schemas

See [File Schemas Reference](docs/reference/file-schemas.md) for complete JSON structures.

**Key files:**
- `data/tasks.json` - Task state database
- `data/repos.json` - Repository configuration
- `data/worktrees.json` - Active worktree registry
- `data/merge-queue.json` - Merge queue coordination
- `data/students/{name}.json` - Student context files

## Directory Structure

```
clide/
├── data/                    # Centralized data directory
│   ├── tasks.json          # Task state database
│   ├── repos.json          # Repository configuration
│   ├── worktrees.json      # Active worktree registry
│   ├── merge-queue.json    # Merge queue coordination
│   └── students/           # Student context files
│       ├── grace.json
│       ├── woody.json
│       └── rio.json
├── tasks/
│   ├── {id}/
│   │   ├── spec.md         # Task specification
│   │   └── agent.log       # Agent execution log
│   └── ...
├── scripts/
│   ├── init-worktree.sh     # Create git worktree for task
│   ├── cleanup-worktree.sh  # Remove git worktree
│   └── process-merge-queue.sh # Merge branch to main
├── docs/
│   ├── workflows/          # Detailed workflow documentation
│   └── reference/          # Reference documentation
├── prompts/                # Sub-agent prompt templates
├── dashboard/              # Web interface (Next.js)
└── CLAUDE.md               # This file
```

## State Transitions

```
TODO → IN_PROGRESS (via assign)
IN_PROGRESS → STAGING (via sub-agent success → auto-create PR)
IN_PROGRESS → FAILED (via sub-agent error)
STAGING → STAGING (via refine - multiple cycles → auto-update PR)
STAGING → COMPLETED (via approve)
FAILED → TODO (via retry)
```

**Status meanings:**
- **TODO**: Ready to be assigned
- **IN_PROGRESS**: Agent actively implementing
- **STAGING**: Implementation complete, PR created, under PI review (refinements update PR)
- **COMPLETED**: Approved by PI, ready for merge
- **FAILED**: Encountered errors during implementation

**Automated PR Management:**
- When task moves to **STAGING**: Automatically push branch and create PR with generated description
- When task is **REFINED**: Automatically push commits and add comment to PR with refinement summary
- PR URL is stored in task data and displayed in notifications

## Session Initialization

When the user first launches Claude Code in this directory:

1. Read `data/repos.json` to get available repositories
2. Read `data/tasks.json` to get current task state
3. Display welcome message:

```
Clide - Agent Orchestration CLI

Available commands:
• Create task for <repo>: <title>. <description>
• Assign task <id> or Assign tasks <id1>, <id2>, <id3>
• Refine task <id>: <description>
• Approve task <id>
• Process merge queue
• Chat with <student> (Grace, Woody, Rio)
• Let it rip: <repo>: <title>. <description>
• List tasks | Show task <id> | Retry task <id>

Available repositories:
{list repos from data/repos.json}

Current status:
- {X} total tasks
- {Y} in progress
- {Z} in staging
- {W} completed
```

4. If any task is "in_progress", alert user with task details

## Best Practices

1. **Always read before write** - Read data files before modifying to ensure consistency
2. **Atomic updates** - Update task state immediately before/after operations
3. **Clear communication** - Confirm each operation with the user
4. **Error recovery** - Provide clear error messages and suggest fixes
5. **Parallel execution** - Allow up to max_parallel_tasks concurrent tasks
6. **Spec clarity** - Generate detailed, actionable specifications
7. **Manual merge review** - Never auto-merge without user approval
8. **Close the loop with testing** - Always verify implementations work

## Important Notes

- Do NOT automatically merge branches - user reviews via "Process merge queue"
- Do NOT modify target repositories directly - only via sub-agents in worktrees
- Allow up to max_parallel_tasks (default: 3) concurrent tasks
- Always preserve existing data when updating JSON files
- Generate comprehensive specs - sub-agents need clear instructions
- Clean up worktrees after task completion (success or failure)
- Update student context after every task completion
