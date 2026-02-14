'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageCircle } from 'lucide-react'

interface Decision {
  task_id: number
  decision: string
  rationale: string
  timestamp: string
}

interface Learning {
  task_id: number
  learning: string
  context: string
  timestamp: string
}

interface TaskHistory {
  task_id: number
  title: string
  completed_at: string
  outcome: string
}

interface Conversation {
  timestamp: string
  duration_minutes: number
  summary: string
  key_topics: string[]
  action_items: string[]
  new_learnings: string[]
}

interface StudentContext {
  decisions: Decision[]
  learnings: Learning[]
  project_state: string
  last_updated: string | null
  conversations: Conversation[]
}

interface Student {
  name: string
  role: string
  focus: string
  repo: string | null
  context: StudentContext
  task_history: TaskHistory[]
}

interface StudentViewerProps {
  studentName: string
  open: boolean
  onClose: () => void
}

export function StudentViewer({ studentName, open, onClose }: StudentViewerProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && studentName) {
      setLoading(true)
      fetch(`/api/students/${studentName.toLowerCase()}`)
        .then(res => res.json())
        .then(data => {
          setStudent(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch student data:', err)
          setLoading(false)
        })
    }
  }, [studentName, open])

  if (!student && !loading) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{studentName}</DialogTitle>
              <p className="text-sm text-muted-foreground">{student?.role}</p>
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                alert(`To chat with ${studentName}, use the command: "Chat with ${studentName}" in Claude Code CLI`)
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : student ? (
          <Tabs defaultValue="context" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="conversations">Conversations ({student.context.conversations?.length || 0})</TabsTrigger>
              <TabsTrigger value="decisions">Decisions ({student.context.decisions.length})</TabsTrigger>
              <TabsTrigger value="learnings">Learnings ({student.context.learnings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Focus Area</h3>
                <p className="text-sm text-muted-foreground">{student.focus}</p>
              </div>

              {student.repo && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Repository</h3>
                  <Badge variant="secondary" className="font-mono">{student.repo}</Badge>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2">Current Project State</h3>
                <p className="text-sm text-muted-foreground">{student.context.project_state}</p>
              </div>

              {student.task_history.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Task History</h3>
                  <div className="space-y-2">
                    {student.task_history.map((task) => (
                      <div key={task.task_id} className="flex items-start gap-2 text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1">
                        <Badge variant={task.outcome === 'success' ? 'default' : 'destructive'} className="text-xs">
                          #{task.task_id}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(task.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {student.context.last_updated && (
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  Last updated: {new Date(student.context.last_updated).toLocaleString()}
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversations" className="space-y-3 mt-4">
              {(!student.context.conversations || student.context.conversations.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet. Click the "Chat" button to start a conversation with {studentName}.
                </p>
              ) : (
                student.context.conversations.map((conversation, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.timestamp).toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {conversation.duration_minutes} min
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{conversation.summary}</p>
                    {conversation.key_topics.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Topics</p>
                        <div className="flex flex-wrap gap-1">
                          {conversation.key_topics.map((topic, tidx) => (
                            <Badge key={tidx} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {conversation.action_items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Action Items</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {conversation.action_items.map((item, aidx) => (
                            <li key={aidx} className="flex items-start gap-2">
                              <span className="text-xs mt-0.5">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {conversation.new_learnings.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">New Learnings</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {conversation.new_learnings.map((learning, lidx) => (
                            <li key={lidx} className="flex items-start gap-2">
                              <span className="text-xs mt-0.5">•</span>
                              <span>{learning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="decisions" className="space-y-3 mt-4">
              {student.context.decisions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No decisions recorded yet. Decisions will accumulate as {studentName} completes tasks.
                </p>
              ) : (
                student.context.decisions.map((decision, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Task #{decision.task_id}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{decision.decision}</p>
                    <p className="text-sm text-muted-foreground">{decision.rationale}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="learnings" className="space-y-3 mt-4">
              {student.context.learnings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No learnings recorded yet. Learnings will accumulate as {studentName} completes tasks.
                </p>
              ) : (
                student.context.learnings.map((learning, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Task #{learning.task_id}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(learning.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{learning.learning}</p>
                    <p className="text-sm text-muted-foreground">{learning.context}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
