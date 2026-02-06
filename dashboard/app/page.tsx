'use client'

import { useEffect, useState } from 'react'
import { Task, TasksFile, Repository } from '@/lib/schemas'
import { KanbanBoard } from '@/components/kanban-board'
import { LogViewer } from '@/components/log-viewer'
import { StudentViewer } from '@/components/student-viewer'
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
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    staging: tasks.filter(t => t.status === 'staging'),
    completed: tasks.filter(t => t.status === 'completed'),
    failed: tasks.filter(t => t.status === 'failed'),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-6 pt-12 pb-16">
        <div className="absolute top-6 right-6">
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="philosophy">Philosophy</TabsTrigger>
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
                      'bg-blue-100 text-blue-700 border-blue-200',
                      'bg-purple-100 text-purple-700 border-purple-200',
                      'bg-green-100 text-green-700 border-green-200',
                      'bg-orange-100 text-orange-700 border-orange-200',
                      'bg-pink-100 text-pink-700 border-pink-200',
                      'bg-indigo-100 text-indigo-700 border-indigo-200',
                      'bg-teal-100 text-teal-700 border-teal-200',
                      'bg-rose-100 text-rose-700 border-rose-200',
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
            <h2 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Active Worktrees</h2>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="space-y-3">
                {worktrees.filter(w => w.status === 'active').map((worktree) => (
                  <div key={worktree.task_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        Task #{worktree.task_id}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{worktree.branch}</p>
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
          <h2 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Lab Students</h2>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col cursor-pointer hover:bg-slate-50 rounded-lg p-3 -m-3 transition-colors" onClick={() => setSelectedStudent('Grace')}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">Grace</h3>
                  <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                  <span className="text-xs text-slate-500">At rest</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Product Builder</p>
                <p className="text-sm text-slate-600">
                  Building a shared context layer for teams. Exploring how headless MCP tools can create a shared notebook where everyone's AI agents contribute and learn together.
                </p>
              </div>
              <div className="flex flex-col cursor-pointer hover:bg-slate-50 rounded-lg p-3 -m-3 transition-colors" onClick={() => setSelectedStudent('Woody')}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">Woody</h3>
                  {groupedTasks.in_progress.filter(t => t.repo === 'beyond-agents').length > 0 ? (
                    <>
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Working</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                      <span className="text-xs text-slate-500">At rest</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2">Systems Architect</p>
                <p className="text-sm text-slate-600">
                  Mastering agent harness design and infrastructure. Building out <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">beyond-agents</span> with cutting-edge harness features.
                </p>
              </div>
              <div className="flex flex-col cursor-pointer hover:bg-slate-50 rounded-lg p-3 -m-3 transition-colors" onClick={() => setSelectedStudent('Rio')}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">Rio</h3>
                  {groupedTasks.in_progress.filter(t => t.repo === 'joetey.com').length > 0 ? (
                    <>
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Working</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                      <span className="text-xs text-slate-500">At rest</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2">Floating Researcher</p>
                <p className="text-sm text-slate-600">
                  Still exploring research directions. Occasionally helps with <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">joetey.com</span> and other lab needs while finding their focus area.
                </p>
              </div>
            </div>
          </div>
        </div>

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
