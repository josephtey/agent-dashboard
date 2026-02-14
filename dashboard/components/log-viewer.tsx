'use client'

import { useEffect, useState, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Terminal, Loader2 } from 'lucide-react'
import { Task } from '@/lib/schemas'

interface LogViewerProps {
  task: Task
  open: boolean
  onClose: () => void
}

export function LogViewer({ task, open, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<string>('')
  const [spec, setSpec] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'spec' | 'logs'>('spec')
  const [viewMode, setViewMode] = useState<'conversation' | 'raw'>('raw')
  const [isLoadingSpec, setIsLoadingSpec] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasJsonLogs, setHasJsonLogs] = useState(false)

  // Fetch spec file
  useEffect(() => {
    if (!open) return

    setIsLoadingSpec(true)
    fetch(`/api/tasks/${task.id}/spec`)
      .then(res => res.text())
      .then(data => {
        setSpec(data)
        setIsLoadingSpec(false)
      })
      .catch(() => {
        setSpec('')
        setIsLoadingSpec(false)
      })
  }, [task.id, open])

  const copyToClipboard = () => {
    const content = activeTab === 'spec' ? spec : logs
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderMarkdown = (text: string) => {
    // Enhanced markdown rendering with proper code block support
    if (!text || typeof text !== 'string') return null

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let codeBlockLanguage = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle code block start/end
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start code block
          inCodeBlock = true
          codeBlockLanguage = line.slice(3).trim()
          codeBlockContent = []
        } else {
          // End code block
          inCodeBlock = false
          elements.push(
            <div key={i} className="my-4">
              {codeBlockLanguage && (
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700 rounded-t-md">
                  {codeBlockLanguage}
                </div>
              )}
              <pre className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 overflow-x-auto font-mono text-xs leading-relaxed ${codeBlockLanguage ? 'rounded-b-md' : 'rounded-md'}`}>
                <code className="text-slate-800 dark:text-slate-200">{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          )
          codeBlockContent = []
          codeBlockLanguage = ''
        }
        continue
      }

      // Inside code block
      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-2xl font-bold mb-3 mt-6 text-slate-900 dark:text-slate-100">{line.slice(2)}</h1>)
        continue
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-xl font-bold mb-2 mt-5 text-slate-800 dark:text-slate-200">{line.slice(3)}</h2>)
        continue
      }
      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-lg font-semibold mb-2 mt-4 text-slate-700 dark:text-slate-300">{line.slice(4)}</h3>)
        continue
      }
      if (line.startsWith('#### ')) {
        elements.push(<h4 key={i} className="text-base font-semibold mb-1 mt-3 text-slate-700 dark:text-slate-300">{line.slice(5)}</h4>)
        continue
      }

      // Horizontal rule
      if (line.trim() === '---') {
        elements.push(<hr key={i} className="my-6 border-slate-200 dark:border-slate-700" />)
        continue
      }

      // Lists
      if (line.match(/^[\s]*[-*]\s/)) {
        const content = line.replace(/^[\s]*[-*]\s/, '')
        const formatted = content
          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
          .replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-slate-700 dark:text-slate-200">$1</code>')
        elements.push(<li key={i} className="ml-6 mb-1 list-disc text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formatted }} />)
        continue
      }
      if (line.match(/^[\s]*\d+\.\s/)) {
        const content = line.replace(/^[\s]*\d+\.\s/, '')
        const formatted = content
          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
          .replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-slate-700 dark:text-slate-200">$1</code>')
        elements.push(<li key={i} className="ml-6 mb-1 list-decimal text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formatted }} />)
        continue
      }

      // Checkboxes
      if (line.match(/^[\s]*-\s\[\s?\]/)) {
        const checked = line.includes('[x]') || line.includes('[X]')
        const content = line.replace(/^[\s]*-\s\[.\]\s/, '')
        elements.push(
          <div key={i} className="flex items-start gap-2 ml-6 mb-1">
            <input type="checkbox" checked={checked} readOnly className="mt-1" />
            <span className="text-slate-700 dark:text-slate-300">{content}</span>
          </div>
        )
        continue
      }

      // Inline formatting
      let formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-slate-700 dark:text-slate-200">$1</code>')

      // Empty lines
      if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />)
        continue
      }

      // Regular paragraph
      elements.push(<p key={i} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />)
    }

    return <div className="space-y-1">{elements}</div>
  }

  const parseConversationView = () => {
    if (!logs) return null

    const lines = logs.split('\n').filter(line => line.trim())
    const entries: any[] = []

    lines.forEach((line) => {
      try {
        const entry = JSON.parse(line)
        // Filter out progress entries
        if (entry.type !== 'progress') {
          entries.push(entry)
        }
      } catch {
        // Skip malformed lines
      }
    })

    if (entries.length === 0) {
      return <div className="text-slate-400 italic text-center py-8">No log entries yet...</div>
    }

    return entries.map((entry, idx) => {
      const messageType = entry.type || 'log'
      const isUser = entry.message?.role === 'user'
      const isAssistant = entry.message?.role === 'assistant'

      // Extract message content
      let messageContent = ''
      let contentBlocks: any[] = []

      if (entry.message) {
        if (typeof entry.message === 'string') {
          messageContent = entry.message
        } else if (entry.message.content) {
          // Content can be a string or an array of blocks
          if (typeof entry.message.content === 'string') {
            messageContent = entry.message.content
          } else if (Array.isArray(entry.message.content)) {
            contentBlocks = entry.message.content
            // Extract text content from text blocks
            const textBlocks = contentBlocks.filter(block => block.type === 'text')
            messageContent = textBlocks.map(block => block.text).join('\n\n')
          }
        }
      }

      // Extract all metadata fields (excluding message and type)
      const metadata = { ...entry }
      delete metadata.message
      delete metadata.type
      const hasMetadata = Object.keys(metadata).length > 0

      return (
        <div key={idx} className="mb-4 pb-4 border-b border-slate-800 last:border-0 last:mb-0">
          {/* Header with role badge */}
          <div className="flex items-start justify-between mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
              isUser ? 'bg-blue-500/20 text-blue-300' :
              isAssistant ? 'bg-purple-500/20 text-purple-300' :
              'bg-slate-700 text-slate-400'
            }`}>
              {entry.message?.role || messageType}
            </span>
          </div>

          {/* Message content */}
          {messageContent && (
            <div className="text-sm leading-relaxed text-slate-200 pl-1 mb-3">
              {renderMarkdown(messageContent)}
            </div>
          )}

          {/* Content blocks (tool uses, etc.) */}
          {contentBlocks.length > 0 && (
            <div className="mt-3 space-y-2">
              {contentBlocks.map((block, blockIdx) => {
                if (block.type === 'text') {
                  // Already handled above
                  return null
                }

                if (block.type === 'tool_use') {
                  return (
                    <details key={blockIdx} className="group">
                      <summary className="cursor-pointer text-xs font-mono select-none list-none flex items-center gap-2 px-3 py-2 bg-slate-900 rounded border border-slate-700 hover:border-slate-600">
                        <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                        <span className="text-amber-400 font-semibold">{block.name}</span>
                        <span className="text-slate-500">#{block.id?.slice(-8)}</span>
                      </summary>
                      <div className="mt-2 ml-4">
                        <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto font-mono">
{JSON.stringify(block.input, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )
                }

                if (block.type === 'tool_result') {
                  return (
                    <details key={blockIdx} className="group">
                      <summary className="cursor-pointer text-xs font-mono select-none list-none flex items-center gap-2 px-3 py-2 bg-slate-900 rounded border border-slate-700 hover:border-slate-600">
                        <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                        <span className="text-green-400 font-semibold">Result</span>
                        <span className="text-slate-500">#{block.tool_use_id?.slice(-8)}</span>
                        {block.is_error && <span className="text-red-400 text-[10px]">ERROR</span>}
                      </summary>
                      <div className="mt-2 ml-4">
                        <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto font-mono max-h-96 overflow-y-auto">
{typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )
                }

                // Other block types
                return (
                  <details key={blockIdx} className="group">
                    <summary className="cursor-pointer text-xs font-mono select-none list-none flex items-center gap-2 px-3 py-2 bg-slate-900 rounded border border-slate-700 hover:border-slate-600">
                      <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                      <span className="text-slate-400">{block.type}</span>
                    </summary>
                    <div className="mt-2 ml-4">
                      <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto font-mono">
{JSON.stringify(block, null, 2)}
                      </pre>
                    </div>
                  </details>
                )
              })}
            </div>
          )}

          {/* JSON Metadata */}
          {hasMetadata && (
            <details className="mt-2 group">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400 font-mono select-none list-none flex items-center gap-2">
                <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                Metadata
              </summary>
              <pre className="mt-2 p-3 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto font-mono">
{JSON.stringify(metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )
    })
  }

  const parseRawView = () => {
    if (!logs) return null
    // If logs look like markdown, render them nicely
    if (logs.includes('##') || logs.includes('###') || logs.includes('```')) {
      return (
        <div className="prose prose-sm prose-invert max-w-none">
          {renderMarkdown(logs)}
        </div>
      )
    }
    // Otherwise show as plain text
    return (
      <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
        {logs}
      </pre>
    )
  }

  useEffect(() => {
    if (!open) return

    setIsLoadingLogs(true)
    const eventSource = new EventSource(`/api/logs/${task.id}/stream`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLogs(data.content)
      setIsLoadingLogs(false)

      // Detect if logs are in JSON-lines format
      if (data.content) {
        const firstLine = data.content.split('\n').find(line => line.trim())
        try {
          if (firstLine) {
            JSON.parse(firstLine)
            setHasJsonLogs(true)
            setViewMode('conversation')
          }
        } catch {
          // Not JSON, markdown logs
          setHasJsonLogs(false)
          setViewMode('raw')
        }
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      setIsLoadingLogs(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [task.id, open])

  const getStatusVariant = (status: Task['status']) => {
    if (status === 'in_progress') return 'default'
    if (status === 'staging') return 'default'
    if (status === 'completed') return 'secondary'
    if (status === 'failed') return 'destructive'
    return 'outline'
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[900px] sm:max-w-[900px]">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <SheetTitle>Task #{task.id} - {task.title}</SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(task.status)}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {activeTab === 'logs' && hasJsonLogs && (
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewMode === 'conversation' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('conversation')}
                    className="h-8 rounded-r-none"
                  >
                    Conversation
                  </Button>
                  <Button
                    variant={viewMode === 'raw' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('raw')}
                    className="h-8 rounded-l-none"
                  >
                    Raw
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={activeTab === 'spec' ? !spec : !logs}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          <SheetDescription className="text-left">
            {task.repo} • {task.branch || 'No branch'}
          </SheetDescription>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-700 pt-4">
            <Button
              variant={activeTab === 'spec' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('spec')}
              className="rounded-b-none"
            >
              Specification
            </Button>
            <Button
              variant={activeTab === 'logs' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('logs')}
              className="rounded-b-none"
            >
              Agent Logs
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="h-[calc(100vh-200px)] mt-6">
          {activeTab === 'spec' ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-6">
              {isLoadingSpec ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-6 w-1/2 mt-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : spec ? (
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(spec)}
                </div>
              ) : (
                <div className="text-slate-400 italic text-center py-8">No specification available</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 dark:border-slate-700 bg-slate-950 dark:bg-slate-900/50 text-slate-50 p-6">
              {isLoadingLogs ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <p className="text-sm text-slate-400">Loading agent logs...</p>
                </div>
              ) : logs ? (
                viewMode === 'conversation' ? parseConversationView() : parseRawView()
              ) : (
                <div className="text-slate-400 italic text-center py-8">No logs yet...</div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
