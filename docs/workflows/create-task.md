# Create Task Workflow

## User Input Patterns
- "Create task for `<repo-name>`: `<title>`. `<description>`"
- "Add task for `<repo-name>`: `<title>`. `<description>`"
- "New task for `<repo-name>`: `<title>`. `<description>`"

## Workflow Steps

### 1. Get Next Task ID
- Read `data/tasks.json` to get the next available task ID
- Create directory `tasks/{id}/`

### 2. Resolve Repository Path
- Read `data/repos.json` to find repository by name
- If not found:
  - Check if `/Users/josephtey/Projects/{repo-name}` exists
  - If yes, add it to data/repos.json automatically
  - If no, ask user: "What is the full path to the {repo} repository?"
  - Store in data/repos.json for future use

### 3. Create Spec File
- Write spec to `tasks/{id}/spec.md` using the template below
- Fill in all placeholders with:
  - Task ID and title from user input
  - Repository name and path
  - Description from user input (can be multi-paragraph)
  - Current timestamp

### 4. Register Task
- Update `data/tasks.json`:
  - Add new task object with status "todo"
  - Set all required fields (see file-schemas.md)
  - Increment `next_id`
- Confirm task creation: "Task {id} created: {title}. Spec at tasks/{id}/spec.md. Use 'Assign task {id}' when ready."

## Validation Rules
- Repository name must be provided
- Title must be non-empty
- Repository path must exist (or be confirmed by user)

## Spec File Template

```markdown
# Task #{id}: {title}

**Repository:** {repo}
**Repository Path:** {repo_path}
**Status:** TODO
**Created:** {timestamp}

---

## Description

{description from user input - preserve formatting, can be multiple paragraphs}

---

## Notes

{Leave empty - student agents will add implementation notes here during execution}
```

## Example

```markdown
# Task #15: Add dark mode toggle to settings page

**Repository:** joetey.com
**Repository Path:** /Users/josephtey/Projects/joetey.com
**Status:** TODO
**Created:** 2026-02-15T10:30:00Z

---

## Description

Add a dark mode toggle switch to the settings page. The toggle should:
- Be located in the appearance section
- Save preference to localStorage
- Apply dark mode styles globally using CSS variables
- Include smooth transition between modes

The dark mode palette should use:
- Background: #1a1a1a
- Text: #e5e5e5
- Accent: #3b82f6

---

## Notes

{Empty - will be filled during implementation}
```

## Important Notes
- **Simple and direct** - Just create the spec from user input, no plan mode
- The student agent will explore the codebase during implementation
- Keep specs minimal - detailed planning happens during assignment, not creation
