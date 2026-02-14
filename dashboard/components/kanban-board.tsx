'use client'

import { useState } from 'react'
import { Task } from '@/lib/schemas'
import { TaskCard } from './task-card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  const [layout, setLayout] = useState<'columns' | 'rows'>('rows')

  const columns = [
    { key: 'todo' as const, title: 'To Do', tasks: tasks.todo },
    { key: 'in_progress' as const, title: 'In Progress', tasks: tasks.in_progress },
    { key: 'staging' as const, title: 'Staging', tasks: tasks.staging },
    { key: 'completed' as const, title: 'Completed', tasks: tasks.completed },
    { key: 'failed' as const, title: 'Failed', tasks: tasks.failed },
  ]

  return (
    <div className="space-y-4">
      {/* Layout Toggle */}
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLayout(layout === 'columns' ? 'rows' : 'columns')}
                className="gap-2"
              >
                {layout === 'columns' ? (
                  <>
                    <Rows3 className="h-4 w-4" />
                    <span className="text-xs">Rows</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                    <span className="text-xs">Columns</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch to {layout === 'columns' ? 'row' : 'column'} layout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Rows Layout */}
      {layout === 'rows' && (
        <div className="space-y-4">
          {columns.map((column) => (
            <div key={column.key} className="space-y-2">
              {/* Row Header */}
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                  {column.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({column.tasks.length})
                </span>
              </div>

              {/* Horizontal Scrolling Container */}
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {column.tasks.length === 0 ? (
                    <div className="h-[140px] text-sm text-muted-foreground flex items-center justify-center px-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-card min-w-[200px]">
                      No tasks
                    </div>
                  ) : (
                    column.tasks.map((task) => (
                      <div key={task.id} className="w-80 flex-shrink-0 h-[140px]">
                        <TaskCard
                          task={task}
                          onClick={() => onTaskClick(task)}
                        />
                      </div>
                    ))
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ))}
        </div>
      )}

      {/* Columns Layout */}
      {layout === 'columns' && (
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
      )}
    </div>
  )
}
