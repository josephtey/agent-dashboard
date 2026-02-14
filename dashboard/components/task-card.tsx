'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format, formatDistanceToNow } from 'date-fns'
import { Loader2, Copy, Check } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyBranch = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.branch) {
      navigator.clipboard.writeText(task.branch)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getDuration = () => {
    if (!task.assigned_at) return null

    const startTime = new Date(task.assigned_at)
    const endTime = task.completed_at ? new Date(task.completed_at) : new Date()
    const diffMs = endTime.getTime() - startTime.getTime()

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const getRepoColor = (repo: string) => {
    // Generate consistent color for each repo using better hash
    let hash = 0
    for (let i = 0; i < repo.length; i++) {
      hash = ((hash << 5) - hash) + repo.charCodeAt(i)
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
    return colors[Math.abs(hash) % colors.length]
  }

  const repoColor = getRepoColor(task.repo)

  return (
    <TooltipProvider>
      <Card
        className="cursor-pointer hover:shadow-lg transition-all hover:border-slate-300 dark:hover:border-slate-600 overflow-hidden h-full flex flex-col"
        onClick={onClick}
        data-task-id={task.id}
      >
        {/* Colored repo header */}
        <div className={`${repoColor} px-3 py-1 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0`}>
          {task.repo}
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
          {/* Timestamp and duration */}
          {task.assigned_at && mounted && (
            <div className="text-[10px] text-muted-foreground flex-shrink-0">
              {format(new Date(task.assigned_at), 'MMM d, h:mm a')} • {getDuration()}
            </div>
          )}

          {/* Title with status indicator */}
          <div className="flex items-start gap-2 flex-1 min-h-0">
            {task.status === 'in_progress' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            {task.status === 'staging' && (
              <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0 mt-1" title="Ready for review" />
            )}
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              #{task.id} {task.title}
            </h3>
          </div>

          {/* Branch info */}
          {task.branch && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
              <span className="font-mono truncate flex-1">{task.branch}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 flex-shrink-0"
                    onClick={handleCopyBranch}
                  >
                    {copied ? (
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{copied ? 'Copied!' : 'Copy'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Error */}
          {task.error && (
            <div className="text-[10px] p-2 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300 flex-shrink-0">
              <span className="font-medium">Error:</span> {task.error}
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}
