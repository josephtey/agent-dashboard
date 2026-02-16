'use client'

import { useEffect, useState } from 'react'
import { Task, TasksFile, Repository } from '@/lib/schemas'
import { KanbanBoard } from '@/components/kanban-board'
import { LogViewer } from '@/components/log-viewer'
import { StudentViewer } from '@/components/student-viewer'
import { ThemeToggle } from '@/components/theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info } from 'lucide-react'

interface Worktree {
  task_id: number
  repo: string
  repo_path: string
  worktree_path: string
  branch: string
  created_at: string
  status: string
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [config, setConfig] = useState({ max_parallel_tasks: 3 })
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch repositories
  useEffect(() => {
    fetch('/api/repos')
      .then((res) => res.json())
      .then((data) => setRepositories(data.repositories))
      .catch((err) => console.error('Failed to fetch repos:', err))
  }, [])

  // Fetch worktrees
  useEffect(() => {
    fetch('/api/worktrees')
      .then((res) => res.json())
      .then((data) => setWorktrees(data.worktrees))
      .catch((err) => console.error('Failed to fetch worktrees:', err))
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/stream')

    eventSource.onmessage = (event) => {
      const data: TasksFile = JSON.parse(event.data)
      setTasks(data.tasks)
      setConfig(data.config)
      setIsLoading(false)
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      setIsLoading(false)
      // Try to reconnect after a delay
      setTimeout(() => {
        eventSource.close()
      }, 1000)
    }

    return () => eventSource.close()
  }, [])

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo').sort((a, b) => b.id - a.id),
    in_progress: tasks.filter(t => t.status === 'in_progress').sort((a, b) => b.id - a.id),
    staging: tasks.filter(t => t.status === 'staging').sort((a, b) => b.id - a.id),
    completed: tasks.filter(t => t.status === 'completed').sort((a, b) => b.id - a.id),
    failed: tasks.filter(t => t.status === 'failed').sort((a, b) => b.id - a.id),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 pt-12">
          <header className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold text-slate-300">Clide</span>
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="flex flex-col gap-4">
                <Skeleton className="h-8 w-32" />
                <div className="flex flex-col gap-3">
                  {[1, 2].map((card) => (
                    <Skeleton key={card} className="h-32 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 pt-12 pb-16">
        <div className="absolute top-6 right-6 flex gap-2">
          <ThemeToggle />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>About Clide</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="philosophy" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="philosophy">Philosophy</TabsTrigger>
                  <TabsTrigger value="structure">How It Works</TabsTrigger>
                  <TabsTrigger value="vision">Future Vision</TabsTrigger>
                </TabsList>
                <TabsContent value="philosophy" className="space-y-4 text-left mt-4">
                  <p className="text-base text-foreground leading-relaxed">
                    <strong>The best learning environment is a scientific lab—and the person who benefits most is the PI.</strong> Think of Clide as your personal research lab. You're the principal investigator, orchestrating experiments across multiple projects. Each agent is running a hypothesis you want to test.
                  </p>
                  <p className="text-base text-foreground leading-relaxed">
                    The best engineers have sharp product instinct and architectural taste. But that traditionally took <em>years</em> of building to develop. Now, every task you delegate is a learning opportunity compressed into minutes instead of weeks.
                  </p>
                  <p className="text-base text-foreground leading-relaxed">
                    PIs develop exceptional judgment through constant conversation—dozens of discussions daily about problems, approaches, and tradeoffs. They get incredibly good at "grokking" hard ideas quickly. <strong>What if your learning came from conversations with student agents?</strong> Each planning session, each architectural discussion, each iteration—compressed learning at scale.
                  </p>
                  <p className="text-base text-foreground leading-relaxed">
                    <strong>The workflow:</strong> Trust your gut. Spin up agents to explore different approaches. See what works. Build intuition faster than ever before.
                  </p>
                  <p className="text-base text-foreground leading-relaxed">
                    This isn't just about shipping faster — it's about becoming a better builder, faster. Your agents do the grunt work. You accumulate the wisdom. <strong>Now everyone can become a professor.</strong>
                  </p>
                </TabsContent>
                <TabsContent value="structure" className="space-y-4 text-left mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Task Lifecycle</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Tasks move through five stages. Each stage has specific actions you can take.
                      </p>
                    </div>

                    <div className="space-y-3 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                          <span className="text-sm font-medium">TODO</span>
                          <span className="text-xs text-muted-foreground">→ Ready to assign</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Task created with minimal spec. Contains description and repo.
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          Command: <span className="text-foreground">Assign task {'{id}'}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </div>
                          <span className="text-sm font-medium">IN PROGRESS</span>
                          <span className="text-xs text-muted-foreground">→ Agent implementing</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Student agent has created worktree and is actively coding. Watch the log viewer for real-time updates.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          • Worktree isolated on branch feature/task-{'{id}'}
                          <br />
                          • Agent writes to tasks/{'{id}'}/agent.log
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                          <span className="text-sm font-medium">STAGING</span>
                          <span className="text-xs text-muted-foreground">→ Ready for review</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Implementation complete. PR automatically created. Time to review code and test.
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          Commands:
                          <br />
                          • <span className="text-foreground">Refine task {'{id}'}: {'{description}'}</span> — Request changes
                          <br />
                          • <span className="text-foreground">Approve task {'{id}'}</span> — Merge to main
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">COMPLETED</span>
                          <span className="text-xs text-muted-foreground">→ Merged to main</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          PR merged via squash commit. Branch deleted. Worktree cleaned up. Changes live in main.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          <span className="text-sm font-medium">FAILED</span>
                          <span className="text-xs text-muted-foreground">→ Encountered errors</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Agent hit an error during implementation. Check logs for details.
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          Command: <span className="text-foreground">Retry task {'{id}'}</span> — Reset to TODO
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Key Points</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>PRs are automatically created when tasks reach staging</li>
                        <li>Approving a task merges it immediately (no separate merge step)</li>
                        <li>You can refine tasks multiple times before approving</li>
                        <li>Each refinement adds a commit and updates the PR</li>
                        <li>Worktrees stay active during staging for refinements</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="vision" className="space-y-4 text-left mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    The roadmap for Clide is about evolving from a task orchestrator to a true learning environment—where students aren't just executing tasks, but becoming collaborators in your growth as a builder.
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input type="checkbox" disabled className="mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Daily conversations, not just tasks</p>
                        <p className="text-sm text-muted-foreground">Wake up and talk to students. Not about executing—about ideas, approaches, tradeoffs. 15 minutes with each student daily.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input type="checkbox" disabled className="mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Students propose their own ideas</p>
                        <p className="text-sm text-muted-foreground">They develop intuition and suggest experiments. You evaluate at a high level. True collaboration, not just delegation.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input type="checkbox" disabled className="mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Accountability through expectation</p>
                        <p className="text-sm text-muted-foreground">Set learning intentions and project goals. Students expect progress. They keep you engaged, grounded in reality while they build.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input type="checkbox" disabled className="mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Persistent memory and decision logs</p>
                        <p className="text-sm text-muted-foreground">Each student maintains context across weeks—project end states, decision rationale, accumulated learnings. A living record of how they think and evolve.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Clide</h1>
              <p className="text-muted-foreground">
                Your personal research lab
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {tasks.length} total tasks • {groupedTasks.in_progress.length} running • {groupedTasks.staging.length} staging •{' '}
                {config.max_parallel_tasks - groupedTasks.in_progress.length} slots available
              </p>
            </div>

            {repositories.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Repositories</p>
                <div className="flex gap-2">
                  {repositories.map((repo) => {
                    // Generate consistent color for each repo using better hash
                    let hash = 0
                    for (let i = 0; i < repo.name.length; i++) {
                      hash = ((hash << 5) - hash) + repo.name.charCodeAt(i)
                      hash = hash & hash // Convert to 32bit integer
                    }
                    const colors = [
                      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
                      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50',
                      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
                      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50',
                      'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700/50',
                      'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50',
                      'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50',
                      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/50',
                    ]
                    const colorClass = colors[Math.abs(hash) % colors.length]

                    return (
                      <Badge
                        key={repo.name}
                        variant="outline"
                        className={`font-mono ${colorClass} hover:opacity-80`}
                      >
                        {repo.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </header>

        {worktrees.filter(w => w.status === 'active').length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">Active Worktrees</h2>
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="space-y-3">
                {worktrees.filter(w => w.status === 'active').map((worktree) => (
                  <div key={worktree.task_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        Task #{worktree.task_id}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{worktree.branch}</p>
                        <p className="text-xs text-muted-foreground">{worktree.repo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-mono">{worktree.worktree_path}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(worktree.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">Lab Students</h2>
          <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-3 -m-3 transition-colors" onClick={() => setSelectedStudent('Grace')}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Grace</h3>
                  <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">At rest</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Product Builder</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Building a shared context layer for teams. Exploring how headless MCP tools can create a shared notebook where everyone's AI agents contribute and learn together.
                </p>
              </div>
              <div className="flex flex-col cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-3 -m-3 transition-colors" onClick={() => setSelectedStudent('Woody')}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Woody</h3>
                  {groupedTasks.in_progress.filter(t => t.repo === 'beyond-agents').length > 0 ? (
                    <>
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 dark:bg-green-400"></span>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Working</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">At rest</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Systems Architect</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Mastering agent harness design and infrastructure. Building out <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">beyond-agents</span> with cutting-edge harness features.
                </p>
              </div>
              <div className="flex flex-col cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-3 -m-3 transition-colors" onClick={() => setSelectedStudent('Rio')}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Rio</h3>
                  {groupedTasks.in_progress.filter(t => t.repo === 'rosalind').length > 0 ? (
                    <>
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 dark:bg-green-400"></span>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Working</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">At rest</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Bio-AI Researcher</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Building <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Rosalind</span> - LLM agents for protein design and biological discovery. Using mechanistic interpretability to ground agent reasoning in real biology, not just pattern matching.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TODO List */}
        {(groupedTasks.todo.length > 0 || groupedTasks.staging.length > 0) && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">To Do</h2>
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-slate-700 p-5">
              <div className="space-y-2">
                {groupedTasks.todo.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors group"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                      onChange={() => setSelectedTask(task)}
                    />
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <p className="text-sm text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                        Plan task #{task.id}: {task.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {task.repo}
                      </p>
                    </div>
                  </div>
                ))}

                {groupedTasks.todo.length > 5 && (
                  <div className="flex items-start gap-3 py-2 -mx-2 px-2">
                    <div className="h-4 w-4" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      +{groupedTasks.todo.length - 5} more tasks to plan
                    </p>
                  </div>
                )}

                {groupedTasks.staging.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors group"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                      onChange={() => {
                        if (task.pr_url) {
                          window.open(task.pr_url, '_blank', 'noopener,noreferrer')
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                        Review PR for task #{task.id}: {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.repo}
                        </p>
                        {task.pr_url && (
                          <>
                            <span className="text-xs text-slate-400 dark:text-slate-600">•</span>
                            <a
                              href={task.pr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View PR
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <KanbanBoard
          tasks={groupedTasks}
          onTaskClick={setSelectedTask}
        />

        {selectedTask && (
          <LogViewer
            task={selectedTask}
            open={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}

        {selectedStudent && (
          <StudentViewer
            studentName={selectedStudent}
            open={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>
    </div>
  )
}
