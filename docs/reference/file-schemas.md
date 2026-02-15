# File Schemas Reference

## data/tasks.json

```json
{
  "config": {
    "max_parallel_tasks": 3
  },
  "next_id": 1,
  "tasks": [
    {
      "id": 1,
      "repo": "joetey.com",
      "repo_path": "/Users/josephtey/Projects/joetey.com",
      "spec_file": "tasks/1/spec.md",
      "log_file": "tasks/1/agent.log",
      "title": "Add dark mode toggle",
      "status": "todo",
      "branch": null,
      "agent_id": null,
      "worktree_path": null,
      "pr_url": null,
      "merge_status": null,
      "created_at": "2026-01-31T10:30:00Z",
      "assigned_at": null,
      "staging_at": null,
      "completed_at": null,
      "error": null
    }
  ]
}
```

## data/worktrees.json

```json
{
  "worktrees": [
    {
      "task_id": 3,
      "repo": "joetey.com",
      "repo_path": "/Users/josephtey/Projects/joetey.com",
      "worktree_path": "/Users/josephtey/Projects/joetey.com-task-3",
      "branch": "feature/task-3",
      "created_at": "2026-02-01T10:00:00Z",
      "status": "active"
    }
  ]
}
```

## data/merge-queue.json

```json
{
  "config": {
    "auto_merge": false,
    "run_tests_before_merge": false
  },
  "queue": [
    {
      "task_id": 1,
      "branch": "feature/task-1",
      "status": "waiting",
      "queued_at": "2026-02-01T10:05:00Z",
      "error": null
    }
  ]
}
```

## data/repos.json

```json
{
  "repos": [
    {
      "name": "joetey.com",
      "path": "/Users/josephtey/Projects/joetey.com",
      "description": "Personal website",
      "main_branch": "main"
    },
    {
      "name": "rosalind",
      "path": "/home/joetey/rosalind",
      "description": "DNA language model research",
      "main_branch": "main",
      "remote": {
        "enabled": true,
        "ssh_host": "chimera-gpu-agent",
        "type": "cluster"
      }
    }
  ]
}
```

## data/students/{name}.json

```json
{
  "name": "Grace",
  "role": "Product Builder",
  "focus": "Building a shared context layer for teams",
  "repo": null,
  "context": {
    "decisions": [
      {
        "task_id": 1,
        "decision": "Use Tailwind for styling",
        "rationale": "Consistency with existing codebase",
        "timestamp": "2026-02-01T10:30:00Z"
      }
    ],
    "learnings": [
      {
        "task_id": 1,
        "learning": "Next.js 14 server actions require 'use server'",
        "context": "Bug fix during form submission",
        "timestamp": "2026-02-01T10:45:00Z"
      }
    ],
    "project_state": "Current status and next steps",
    "last_updated": "2026-02-01T11:00:00Z",
    "conversations": [
      {
        "timestamp": "2026-02-01T14:30:00Z",
        "duration_minutes": 15,
        "summary": "Discussed MCP architecture approach",
        "key_topics": ["MCP", "event sourcing"],
        "action_items": ["Research MCP SDK"],
        "new_learnings": ["MCP servers can share state"]
      }
    ]
  },
  "task_history": [
    {
      "task_id": 1,
      "title": "Add real-time updates",
      "completed_at": "2026-02-01T11:00:00Z",
      "outcome": "success"
    }
  ]
}
```

## Task Fields

- **id**: Unique task identifier
- **repo**: Repository name (from data/repos.json)
- **repo_path**: Full path to repository
- **spec_file**: Path to task specification markdown
- **log_file**: Path to agent execution log
- **title**: Human-readable task title
- **status**: Current task status (see Status Descriptions below)
- **branch**: Git branch name (null if not assigned)
- **agent_id**: Sub-agent execution ID (for tracking/resuming)
- **worktree_path**: Path to git worktree (null if not assigned)
- **pr_url**: Pull request URL (auto-created when task moves to staging, null before staging)
- **merge_status**: Status in merge queue (null, "waiting", "merged")
- **created_at**: ISO timestamp when task was created
- **assigned_at**: ISO timestamp when task was assigned (null if not assigned)
- **staging_at**: ISO timestamp when task moved to staging (null if not staged)
- **completed_at**: ISO timestamp when task was approved (null if not completed)
- **error**: Error message if task failed (null if no error)

## State Transitions

```
TODO → IN_PROGRESS (via assign command)
IN_PROGRESS → STAGING (via sub-agent success + auto PR creation)
IN_PROGRESS → FAILED (via sub-agent error)
STAGING → STAGING (via refine command - multiple refinement cycles, auto PR updates)
STAGING → COMPLETED (via approve command)
FAILED → TODO (via retry command)
```

**Status Descriptions:**
- **TODO**: Task is ready to be assigned to a student agent
- **IN_PROGRESS**: Student agent is actively implementing the task
- **STAGING**: Initial implementation complete, PR auto-created, worktree active for PI review and refinements
- **COMPLETED**: Task approved by PI, ready for merge
- **FAILED**: Task encountered errors during implementation
