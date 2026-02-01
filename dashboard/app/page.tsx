'use client'

import { useEffect, useState } from 'react'
import { Task, TasksFile, Repository } from '@/lib/schemas'
import { KanbanBoard } from '@/components/kanban-board'
import { LogViewer } from '@/components/log-viewer'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [config, setConfig] = useState({ max_parallel_tasks: 3 })
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch repositories
  useEffect(() => {
    fetch('/api/repos')
      .then((res) => res.json())
      .then((data) => setRepositories(data.repositories))
      .catch((err) => console.error('Failed to fetch repos:', err))
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
      <div className="container mx-auto p-6 pt-12">
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Clide</h1>
                <div className="flex items-center gap-2">
                  {groupedTasks.in_progress.length > 0 ? (
                    <>
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </div>
                      <p className="text-sm font-medium">
                        LIVE • {groupedTasks.in_progress.length} {groupedTasks.in_progress.length === 1 ? 'AGENT' : 'AGENTS'} RUNNING
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                      <p className="text-sm font-medium text-muted-foreground">AT REST</p>
                    </>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">
                someone to help you manage your agents
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {tasks.length} total tasks • {groupedTasks.in_progress.length} running •{' '}
                {config.max_parallel_tasks - groupedTasks.in_progress.length} slots available
              </p>
            </div>

            {repositories.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Repositories</p>
                <div className="flex gap-2">
                  {repositories.map((repo) => (
                    <Badge key={repo.name} variant="secondary" className="font-mono">
                      {repo.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

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
      </div>
    </div>
  )
}
