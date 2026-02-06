# Clide

**Your Personal Research Lab** - A learning environment where you orchestrate AI student agents across multiple projects. Not just for shipping faster—for becoming a better builder, faster.

## Philosophy

**The best learning environment is a scientific lab—and the person who benefits most is the PI.** Think of Clide as your personal research lab. You're the principal investigator, orchestrating experiments across multiple projects. Each agent is running a hypothesis you want to test.

The best engineers have sharp product instinct and architectural taste. But that traditionally took *years* of building to develop. Now, every task you delegate is a learning opportunity compressed into minutes instead of weeks.

PIs develop exceptional judgment through constant conversation—dozens of discussions daily about problems, approaches, and tradeoffs. They get incredibly good at "grokking" hard ideas quickly. **What if your learning came from conversations with student agents?** Each planning session, each architectural discussion, each iteration—compressed learning at scale.

**The workflow:** Trust your gut. Spin up agents to explore different approaches. See what works. Build intuition faster than ever before.

This isn't just about shipping faster — it's about becoming a better builder, faster. Your agents do the grunt work. You accumulate the wisdom. **Now everyone can become a professor.**

## Overview

Clide allows you to:
- Create and manage feature development tasks across different repos
- Spawn student agents (Grace, Woody, Rio) who learn your taste over time
- Review and refine work through staging cycles
- Build product intuition through rapid experimentation
- Track task status with a real-time dashboard

## Setup

1. Clone this repository
2. Ensure Claude Code CLI is installed and authenticated
3. Open this directory in Claude Code: `cd /path/to/clide && claude`

## Web Interface

A real-time dashboard for monitoring your research lab.

### Quick Start
```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Features
- Kanban board with staging column for review cycles
- Student profiles showing active work
- Real-time task status updates
- Live log streaming for running agents
- Active worktree monitoring

## Architecture

```
clide/
├── data/            # Centralized data storage
│   ├── tasks.json       # Task state and metadata
│   ├── repos.json       # Repository configuration
│   ├── worktrees.json   # Active worktree registry
│   ├── merge-queue.json # Merge queue coordination
│   └── students/        # Student context and memory
├── tasks/           # Task specifications and logs
├── scripts/         # Automation scripts
├── dashboard/       # Web interface (Next.js)
├── CLAUDE.md        # Agent behavioral instructions
└── README.md        # This file
```

## Student Agents

Clide operates as a research lab with three student agents:

- **Grace** - Product Builder focusing on shared context layers for teams
- **Woody** - Systems Architect mastering agent harness design
- **Rio** - Floating Researcher helping across projects while finding their focus

Each student accumulates context through their work:
- **Decisions**: Architectural choices and rationale
- **Learnings**: Technical discoveries and gotchas
- **Taste**: Your preferences learned through refinements
- **Project state**: Current understanding and trajectory

Students apply this accumulated knowledge to future tasks, developing intuition about your codebase and preferences.

## CLI Reference

### Creating Tasks

Create a new task for a project repository:

```
Create task for <repo-name>: <title>. <description>
```

**Example:**
```
Create task for joetey.com: Add dark mode toggle. Should be in the header using a sun/moon icon.
```

**What happens:**
1. Claude enters plan mode for a collaborative planning conversation
2. Claude explores the target repository to understand patterns
3. You discuss requirements, approach, and tradeoffs together
4. The plan becomes the spec file at `tasks/{id}/spec.md`
5. Task is registered in `tasks.json` with status "todo"

**This is a learning moment** - the planning conversation builds your product intuition as you discuss implementation approaches with Claude.

### Listing Tasks

View all tasks:

```
List tasks
```

**Output format:**
```
Tasks:
#1 [TODO] joetey.com - Add dark mode toggle
#2 [IN_PROGRESS] joetey.com - Add contact form (branch: feature/task-2)
#3 [STAGING] joetey.com - Stream page (branch: feature/task-3)
#4 [COMPLETED] joetey.com - Fix mobile nav
#5 [FAILED] joetey.com - Add animations (error: dependency conflict)
```

### Viewing Task Details

Show full details for a specific task:

```
Show task <id>
```

Displays task metadata and the complete specification.

### Assigning Tasks

Execute a task by spawning a student agent:

```
Assign task <id>
```

**Example:**
```
Assign task 1
```

The system will:
1. Determine which student should own the task (based on repository)
2. Create a git worktree for isolated development
3. Spawn the student agent with full context (past decisions, learnings, preferences)
4. Student implements the feature according to spec
5. Student commits changes
6. Task moves to **staging** for your review

### Refining Tasks (Staging)

After a task completes, it enters staging for review and refinement:

```
Refine task <id>: <description>
```

**Example:**
```
Refine task 3: Remove the intro text, I prefer a more minimal aesthetic
```

**This is a learning moment** - refinements teach students your taste. When you say "remove the intro", they learn you prefer minimalism. This preference gets stored and applied to future work.

The student agent makes the changes, commits them, and the task remains in staging for further refinement or approval.

### Approving Tasks

When satisfied with a task in staging:

```
Approve task <id>
```

This moves the task to completed status and adds it to the merge queue.

### Processing Merge Queue

Merge completed tasks to main:

```
Process merge queue
```

Merges the next task in the queue. On success, the branch is merged and the feature is live.

### Chatting with Students

Have direct conversations with your students:

```
Chat with <student-name>
```

**Example:**
```
Chat with Grace
```

You'll adopt the student's persona directly - discussing ideas, approaches, and tradeoffs. After the conversation, key learnings and decisions are extracted and added to their context.

**This is a learning moment** - daily check-ins with students help you think through problems and build compressed understanding of your projects.

## Task Lifecycle

```
TODO → IN_PROGRESS → STAGING → COMPLETED → MERGED
                          ↓
                    (refinement cycles)
```

- **TODO**: Task created, ready to be assigned
- **IN_PROGRESS**: Student agent is actively implementing
- **STAGING**: Initial implementation complete, ready for review and refinement
- **COMPLETED**: Task approved by you, ready to merge
- **MERGED**: Changes merged to main branch

## Student Context & Memory

Each student maintains persistent memory in `data/students/{name}.json`:

```json
{
  "name": "Rio",
  "role": "Floating Researcher",
  "context": {
    "decisions": [
      {
        "task_id": 8,
        "decision": "Used marked library for markdown parsing",
        "rationale": "Lightweight, simple API",
        "timestamp": "2026-02-05T15:05:00Z"
      }
    ],
    "learnings": [
      {
        "task_id": 8,
        "learning": "PI prefers ultra-minimal UIs without intro text",
        "context": "Refinement removed stream header",
        "timestamp": "2026-02-05T15:35:00Z"
      }
    ],
    "project_state": "Built stream page, exploring personal site patterns"
  },
  "task_history": [...]
}
```

This accumulated context makes students more effective over time - they learn your taste, remember past decisions, and apply patterns that worked before.

## Tips for Maximum Learning

- **Trust your gut** - If something feels off, refine it. Each refinement teaches taste.
- **Talk to students daily** - Conversations compress learning. Discuss tradeoffs, not just tasks.
- **Experiment freely** - Spin up tasks to test approaches. Failed experiments teach as much as successes.
- **Review staging carefully** - The review cycle is where you build product intuition.
- **Let students own decisions** - When they make choices you like, that becomes their taste.

## Supported Repositories

Clide can manage tasks for any git repository. Repositories are configured in `data/repos.json`.

When you create a task for a new repo, the system will automatically detect it at `/Users/josephtey/Projects/{repo-name}` or prompt for the path.

## The Vision

The roadmap for Clide is about evolving from a task orchestrator to a true learning environment:

- **Daily conversations, not just tasks** - Wake up and talk to students about ideas, not execution. 15 minutes with each student daily.
- **Students propose their own ideas** - They develop intuition and suggest experiments. You evaluate at a high level.
- **Accountability through expectation** - Set learning intentions. Students expect progress and keep you engaged.
- **Persistent memory and decision logs** - Each student maintains context across weeks—a living record of how they think and evolve.

**Now everyone can become a professor.**
