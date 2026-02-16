# Preview App Workflow

## User Input Patterns
- "Preview app" / "Preview `<repo>`" — run from main branch for interactive use
- "Preview task `<id>`" — run from a task's worktree

## Overview

Starts a web application for the user to **interactively use in their browser**. This is NOT a screenshot — the dev server runs in the background so the user can play with the app.

### Preview App (from main)

When the user says "preview app" or "preview `<repo>`":

1. Resolve the repo path from `data/repos.json`
2. `git pull origin main` to get latest
3. Install dependencies if needed (`npm install`)
4. Start the dev server **in the background** using `run_in_background: true`
5. Tell the user the URL (e.g., http://localhost:3001) and let them know it's running
6. Do NOT take a screenshot — the user wants to interact with it themselves

**Default ports:** Use 3001 for frontend to avoid conflicts with other services.

**Example:**
```
User: Preview app
→ Start dev server at http://localhost:3001 in background
→ "Dev server running at http://localhost:3001 — go play with it!"
```

### Preview Task (from worktree)

When the user says "preview task `<id>`":

Starts the beyond-agents web application in a task's worktree for testing and preview. This kills any existing instances, sets up the environment, and launches both backend and frontend servers on dedicated ports.

---

## Workflow Steps

### 1. Validate Task
- Task exists and is a beyond-agents task
- Task has an active worktree (status "in_progress" or "staging")
- Worktree path exists

### 2. Kill Existing Instances
Kill any running servers on the preview ports to avoid conflicts:
```bash
# Kill backend (port 8000 + task_id)
lsof -ti:80${task_id} | xargs kill -9 2>/dev/null

# Kill frontend (port 3000 + task_id)
lsof -ti:30${task_id} | xargs kill -9 2>/dev/null
```

**Port Assignment:**
- Backend: `8000 + task_id` (e.g., task 5 → port 8005)
- Frontend: `3000 + task_id` (e.g., task 5 → port 3005)

### 3. Setup Environment

**Backend:**
```bash
cd {worktree_path}/backend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" > .env
fi
```

**Frontend:**
```bash
cd {worktree_path}/web

# Install dependencies if needed
if [ ! -d node_modules ]; then
  npm install
fi
```

### 4. Start Backend Server

```bash
cd {worktree_path}/backend
uvicorn main:app --reload --port 80${task_id} \
  > /tmp/beyond-agents-task-${task_id}-backend.log 2>&1 &

# Wait for startup
sleep 3

# Verify health
curl -s http://localhost:80${task_id}/health
```

### 5. Start Frontend Server

```bash
cd {worktree_path}/web
PYTHON_API_URL=http://localhost:80${task_id} \
  npm run dev -- --port 30${task_id} \
  > /tmp/beyond-agents-task-${task_id}-frontend.log 2>&1 &

# Wait for startup
sleep 4
```

### 6. Verify and Notify

Check both servers are responding:
```bash
# Backend health check
curl -s http://localhost:80${task_id}/health | jq .

# Frontend (check HTTP response)
curl -s -o /dev/null -w "%{http_code}" http://localhost:30${task_id}
```

**Success message:**
```
✅ Task {id} preview running!

Backend:  http://localhost:80{task_id}
Frontend: http://localhost:30{task_id}

Backend logs:  tail -f /tmp/beyond-agents-task-{task_id}-backend.log
Frontend logs: tail -f /tmp/beyond-agents-task-{task_id}-frontend.log

To stop:
  lsof -ti:80{task_id} | xargs kill
  lsof -ti:30{task_id} | xargs kill
```

---

## Error Handling

### Missing ANTHROPIC_API_KEY
**Error:** "ANTHROPIC_API_KEY environment variable is required"

**Fix:** Set the environment variable before running:
```bash
export ANTHROPIC_API_KEY="your-api-key"
```

### Port Already in Use
**Error:** "Address already in use"

**Fix:** The workflow automatically kills processes on preview ports. If this persists:
```bash
# Manually kill all uvicorn processes
killall uvicorn

# Manually kill all Next.js processes
killall node
```

### Frontend Dependencies Missing
**Error:** "next: command not found"

**Fix:** The workflow automatically runs `npm install` if `node_modules` is missing. If this persists, manually run:
```bash
cd {worktree_path}/web
npm install
```

### Backend Startup Failure
Check logs:
```bash
tail -50 /tmp/beyond-agents-task-{task_id}-backend.log
```

Common issues:
- Missing `.env` file → create it with ANTHROPIC_API_KEY
- MCP server errors → non-critical, agent will still work
- Python dependencies → `pip install -r requirements.txt`

---

## Testing the Preview

Once servers are running, test the implementation:

### For Parallel Tool Calling (Task 5)
1. Open http://localhost:30{task_id}
2. Send message: "Search for Python best practices and read the file README.md"
3. Observe:
   - All tool call events appear immediately
   - Tools execute in parallel (results appear together)
   - Check browser console for timing logs
   - Verify speedup in Network tab

### For Other Features
Refer to the task's spec.md for specific testing instructions.

---

## Cleanup

**Stop servers:**
```bash
lsof -ti:80{task_id} | xargs kill
lsof -ti:30{task_id} | xargs kill
```

**Remove logs:**
```bash
rm /tmp/beyond-agents-task-{task_id}-*.log
```

---

## Notes

- Each task gets dedicated ports to avoid conflicts with main app or other tasks
- Servers run in background with logs redirected to `/tmp/`
- Frontend automatically points to correct backend via `PYTHON_API_URL`
- `--reload` flag on backend enables hot-reload during testing
- Logs persist until manually deleted for debugging

---

## Quick Reference

**Start preview:**
```bash
# Replace {id} with actual task number
Preview task {id}
```

**View logs:**
```bash
tail -f /tmp/beyond-agents-task-{id}-backend.log
tail -f /tmp/beyond-agents-task-{id}-frontend.log
```

**Stop preview:**
```bash
lsof -ti:80{id} | xargs kill
lsof -ti:30{id} | xargs kill
```
