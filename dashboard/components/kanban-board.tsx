'use client'

import { Task } from '@/lib/schemas'
import { TaskCard } from './task-card'

interface KanbanBoardProps {
  tasks: {
    todo: Task[]
    in_progress: Task[]
    staging: Task[]
    completed: Task[]
    failed: Task[]
  }
  onTaskClick: (task: Task) => void
}

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  const columns = [
    { key: 'todo' as const, title: 'To Do', tasks: tasks.todo },
    { key: 'in_progress' as const, title: 'In Progress', tasks: tasks.in_progress },
    { key: 'staging' as const, title: 'Staging', tasks: tasks.staging },
    { key: 'completed' as const, title: 'Completed', tasks: tasks.completed },
    { key: 'failed' as const, title: 'Failed', tasks: tasks.failed },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {columns.map((column) => (
        <div key={column.key} className="flex flex-col gap-4">
          <div className="py-3 bg-background">
            <h2 className="text-lg font-semibold">
              {column.title}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({column.tasks.length})
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {column.tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-card">
                No tasks
              </div>
            ) : (
              column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
