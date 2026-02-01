# Task #6: Convert CLI to Full-Stack Next.js App (V1)

**Repository:** beyond-agents
**Status:** TODO
**Created:** 2026-02-01T08:00:00Z

---

## Overview

Create a V1 web interface that wraps the existing Python CLI in a modern Next.js app. The goal is to maintain all CLI functionality while providing a browser-based chat UI.

**Approach:** Wrap, don't rewrite. Zero changes to existing agent code.

---

## V1 Scope

### In Scope
- Next.js frontend with real-time streaming
- Server-Sent Events (SSE) for agent responses
- Clean chat UI (thinking, tool calls, responses)
- Python subprocess bridge
- Single-user, local deployment

### Out of Scope
- User authentication
- Persistent storage / database
- Multi-session support
- Advanced UI features
- Mobile optimization

---

## Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- EventSource API (SSE)

**Backend:**
- Next.js API Routes
- Python subprocess (existing agent)
- SSE streaming

**Bridge:**
- Spawn Python CLI as subprocess
- JSON event streaming via stdout
- Parse and forward to frontend

---

## Project Structure

```
beyond-agents/
├── src/                           # Existing Python CLI (no changes)
│   ├── main.py
│   ├── agent.py
│   └── ...
│
└── web/                           # New Next.js app
    ├── app/
    │   ├── page.tsx               # Chat interface
    │   └── api/chat/route.ts      # SSE endpoint
    ├── components/
    │   ├── ChatMessage.tsx
    │   ├── ChatInput.tsx
    │   └── ChatContainer.tsx
    ├── lib/
    │   └── agent-client.ts        # Python subprocess manager
    └── package.json
```

---

## Implementation Steps

### Phase 1: Setup Next.js

Initialize project:
```bash
cd beyond-agents
npx create-next-app@latest web --typescript --tailwind --app
cd web
npm install
```

---

### Phase 2: Python Bridge

#### Create JSON Wrapper (`src/web_main.py`)

Web-friendly entry point that outputs JSON instead of terminal colors:

```python
import asyncio
import json
import sys
from src.agent import Agent
from src.models.anthropic import AnthropicModel
from src.tools.registry import ToolRegistry
from src.tools.implementations.read_file import ReadFileTool
from src.tools.mcp.web_search import WebSearchMCPTool
from src.mcp_client import MCPClient

async def main():
    mcp_client = await MCPClient.create()

    registry = ToolRegistry()
    registry.register(ReadFileTool())
    registry.register(WebSearchMCPTool(mcp_client))

    model = AnthropicModel()
    agent = Agent(
        model=model,
        tools=registry.get_all_tools(),
        system_prompt="You are a helpful AI assistant.",
    )

    # Signal ready
    print(json.dumps({"type": "ready"}), flush=True)

    # Process queries from stdin
    for line in sys.stdin:
        query = line.strip()
        if not query:
            continue

        # Stream events as JSON
        async for event in agent.chat(query):
            output = {
                "type": event.__class__.__name__,
                "data": event.model_dump(),
            }
            print(json.dumps(output), flush=True)

        print(json.dumps({"type": "complete"}), flush=True)

    await mcp_client.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
```

---

### Phase 3: Node.js Client

#### Agent Client (`web/lib/agent-client.ts`)

Manages Python subprocess lifecycle:

```typescript
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';

export interface AgentEvent {
  type: string;
  data: any;
}

export class AgentClient {
  private process: ChildProcess | null = null;
  private ready: boolean = false;

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn('python', ['-m', 'src.web_main'], {
        cwd: process.cwd() + '/../',
        env: process.env,
      });

      const rl = readline.createInterface({
        input: this.process.stdout!,
      });

      rl.once('line', (line) => {
        const event = JSON.parse(line);
        if (event.type === 'ready') {
          this.ready = true;
          resolve();
        }
      });

      this.process.on('error', reject);
    });
  }

  async *chat(query: string): AsyncGenerator<AgentEvent> {
    if (!this.process || !this.ready) {
      throw new Error('Agent not ready');
    }

    this.process.stdin?.write(query + '\n');

    const rl = readline.createInterface({
      input: this.process.stdout!,
    });

    for await (const line of rl) {
      const event: AgentEvent = JSON.parse(line);
      if (event.type === 'complete') break;
      yield event;
    }
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.ready = false;
    }
  }
}
```

---

### Phase 4: API Route

#### SSE Endpoint (`web/app/api/chat/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { AgentClient } from '@/lib/agent-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const agent = new AgentClient();

      try {
        await agent.start();

        for await (const event of agent.chat(message)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Agent error:', error);
        const errorData = `data: ${JSON.stringify({
          type: 'error',
          error: String(error)
        })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
      } finally {
        agent.stop();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### Phase 5: Frontend Components

#### Main Page (`web/app/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    const agentMessage = { role: 'assistant', events: [] as any[] };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            const event = JSON.parse(data);
            agentMessage.events.push(event);
            setMessages((prev) => [...prev.slice(0, -1), { ...agentMessage }]);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setMessages((prev) => [...prev.slice(0, -1), { ...agentMessage }]);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <ChatContainer messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </main>
  );
}
```

#### Chat Message (`web/components/ChatMessage.tsx`)

```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content?: string;
  events?: any[];
}

export default function ChatMessage({ role, content, events }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
        {events?.map((event, i) => <EventDisplay key={i} event={event} />)}
      </div>
    </div>
  );
}

function EventDisplay({ event }: { event: any }) {
  switch (event.type) {
    case 'ThinkingEvent':
      return <div className="text-gray-600 italic">{event.data.text}</div>;
    case 'ToolCallEvent':
      return (
        <div className="text-blue-600 text-sm">
          🛠️ {event.data.tool_name}({JSON.stringify(event.data.tool_input)})
        </div>
      );
    case 'ToolResultEvent':
      return (
        <div className="text-green-600 text-sm">
          ✅ Result: {event.data.result}
        </div>
      );
    case 'FinalResponseEvent':
      return <div className="text-black">{event.data.text}</div>;
    default:
      return null;
  }
}
```

#### Chat Input (`web/components/ChatInput.tsx`)

```typescript
import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Ask me anything..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={disabled}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}
```

#### Chat Container (`web/components/ChatContainer.tsx`)

```typescript
import ChatMessage from './ChatMessage';

interface ChatContainerProps {
  messages: any[];
}

export default function ChatContainer({ messages }: ChatContainerProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-12">
          <h2 className="text-2xl font-bold mb-2">Beyond Agents</h2>
          <p>Ask me anything to get started</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatMessage key={i} {...msg} />
      ))}
    </div>
  );
}
```

---

## Development

### Running the App

```bash
cd web
npm run dev
# Visit http://localhost:3000
```

### Environment Setup

Create `web/.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Files Summary

### New Files
- `src/web_main.py` - JSON wrapper for agent
- `web/app/page.tsx` - Chat UI
- `web/app/api/chat/route.ts` - SSE endpoint
- `web/components/ChatMessage.tsx`
- `web/components/ChatInput.tsx`
- `web/components/ChatContainer.tsx`
- `web/lib/agent-client.ts` - Subprocess manager
- `web/package.json`, `tsconfig.json`, `tailwind.config.js`

### Modified Files
- `README.md` - Add web app instructions

### Preserved Files
- All `src/` files remain unchanged
- CLI still works: `python -m src.main`

---

## Success Criteria

- [ ] Next.js app runs on localhost:3000
- [ ] Chat interface accepts user input
- [ ] Messages stream to Python agent
- [ ] Events stream back via SSE in real-time
- [ ] UI shows thinking, tool calls, responses
- [ ] Multiple messages work in conversation
- [ ] Existing CLI unchanged and functional
- [ ] No changes to core agent logic

---

## Testing Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Run dev server (`npm run dev`)
- [ ] Open http://localhost:3000
- [ ] Send message requiring tool (e.g., "Read README")
- [ ] Verify events display correctly
- [ ] Send multiple messages
- [ ] Test error handling
- [ ] Verify CLI still works: `python -m src.main`
- [ ] Test on Chrome, Firefox, Safari

---

## Future Enhancements (V2+)

- User authentication
- Database for persistent conversations
- Multiple chat sessions
- Copy/regenerate buttons
- Markdown + code syntax highlighting
- Mobile responsive design
- WebSocket upgrade
- Conversation export

---

## Technical Notes

**Design Principles:**
- Minimal changes to core agent
- Wrap existing functionality, don't rewrite
- Simple V1: in-memory state, single user
- Each request spawns fresh Python process

**Performance:**
- V1 spawns process per request (simple, not optimized)
- V2 could use persistent process pool
- No database = conversations lost on refresh

**Deployment:**
- Ready for local development
- Can deploy to Vercel/Railway with Python runtime
- Single user, no auth (fine for personal use)
