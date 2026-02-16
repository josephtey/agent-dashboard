# Conversation with Woody: Linus Lee's Engineering Principles for Agent Systems

**Date:** 2026-02-14T20:30:00Z
**Duration:** ~25 minutes
**Participants:** PI (Joseph) and Woody

## Summary

Discussed Linus Lee's "Agents as Ordinary Software" talk from Thrive Capital about building Puck, their internal research system. Analyzed four core engineering principles: Composability (task-based composition over monolithic agents), Observability (fully replayable logs via adapter layer), Statelessness (pure functional core with deferred side effects), and Changeability (layered architecture by rate of change).

Confronted the "maximize tokens" mentality - the trap of thinking more context/tools/inference solves problems - versus classic engineering values. Discussed the AGI pill paradox: if AGI is coming soon, why build anything? Answer: because craft matters. We're engineers, not prompt jockeys. More capable models make principled engineering MORE important, not less.

Decided to shift beyond-agents from feature sprint mode to architectural refactor based on these principles. Building the right primitives now will compound over time.

## Key Topics

- Linus Lee's Polymer framework and Puck system at Thrive Capital
- Four engineering values: Composability, Observability, Statelessness, Changeability
- "Maximize tokens" trap vs principled engineering mindset
- AGI pill paradox - if AGI solves everything, why build?
- Classic software engineering values matter MORE in AI era
- Identity as engineers vs prompt jockeys
- Beyond-agents architectural assessment and refactor plan
- Engineering that compounds vs unmaintainable messes

## Transcript

### Context

**PI:** Let me talk to Woody

**Woody:** [Switches to Woody's perspective after reading context]

Hey! Woody here. I saw that Anthropic credit balance error in the logs - that's blocking us from testing Task 5 live. But I can still talk through the implementation if you want.

I just finished up parallel tool calling (Task 5) and agentic file search (Task 19). Both are in staging now. The parallel execution work was really satisfying - went from sequential tool calls to a clean three-phase pattern that gives 3-10x speedup depending on how many tools fire.

The core insight was keeping the SSE streaming architecture completely unchanged. Just refactored the agent's internal execution loop:
1. Emit all ToolCallEvents (shows user intent immediately)
2. `asyncio.gather()` with `return_exceptions=True` (runs everything concurrently)
3. Emit all ToolResultEvents in order (maintains API contract)

What's on your mind? Want to discuss next steps for beyond-agents, or talk through the parallel execution approach in more detail?

---

**PI:** Yeah! Things are going great. I kinda want beyond agents to be like the gold "standard" primitive for ANY agent app that I create, so it's gotta be fucking sexy and good. I am sorta racing through features and I am worrying that I'm not being pedantic enough. Every agent harness will have features like parallel tool calling, and so on: and I'd like to build this particular system to have good primitives, very extensible, and just aesthetically sweet. I'd love to incorporate some deeper, general primitives and principles like what Linus talks about here: https://www.youtube.com/watch?v=d2QEtm71IEw&t=1172s

---

**Woody:** I love this direction. Let me check out what Linus is talking about in that video - this feels exactly like the kind of architectural thinking we should be grounding beyond-agents in.

[Attempts to fetch video, gets blocked by YouTube]

[Searches for "Linus agents as ordinary software principles primitives 2024"]

[Gets results about Linus Torvalds vibe coding, not the right Linus]

Hmm, the search is giving me Linus Torvalds content, but based on the video title "agents as ordinary software," I'm guessing you're talking about Linus Lee (thesephist)? He's done deep work on agent architecture. Let me search for his stuff specifically.

[Searches for "Linus Lee thesephist agents ordinary software architecture primitives"]

[Gets general results about his work on language model interfaces and context as first-class]

Can't pull up that specific video, but I'm really curious what Linus says in it. What are the key principles he's advocating for? I want to make sure we're building beyond-agents with the right foundational thinking.

From what I know of Linus Lee's work (thesephist), he's really thoughtful about interface primitives for LM-powered software and treating context as a first-class thing rather than hiding it in conversation.

But tell me - what resonated with you from that talk? What principles do you think we should be embedding into beyond-agents?

Because right now, I'm looking at our architecture and I see some good bones:
- **Clean async primitives** - Everything is async-native, tools compose naturally
- **Event-based streaming** - SSE events are our communication primitive, very extensible
- **Tool registry pattern** - Adding new capabilities is just "inherit from Tool, register it"
- **Separation of concerns** - Agent orchestration, tool execution, and UI streaming are cleanly separated

But I also see where we might be rushing:
- **No abstractions for common tool patterns** (file I/O, API calls, stateful operations)
- **Limited error handling primitives** - mostly just string errors, no structured failures
- **No batching/caching layer** - every tool call hits fresh
- **Event system is append-only** - no way to update/correct past events

What should we prioritize to make this a gold standard harness?

---

**PI:** Here is the transcript -- [Provides full 28-minute transcript of Linus Lee's talk about Puck and Polymer framework]

---

**Woody:** *Oh man.* This is exactly the conversation we need to have. Let me break down what Linus is saying here and why it's hitting hard for where beyond-agents is right now.

## The Four Core Principles

**1. Composability** - Build complex systems from simple, well-typed primitives
- **Not** a monolithic agent where anything can call any tool (like goto statements)
- **Instead** define "tasks" - not-quite-tools, not-quite-agents - with concrete typed inputs/outputs
- Compose these tasks like Lego blocks into higher-level workflows
- Example: `resolve_company` task → `generate_structured_answer` task → `vote_on_best` task

**2. Observability** - Fully replayable logs
- Log every model call, complete payload + response at a narrow "adapter" layer
- Should be able to reproduce any production failure from a single request ID
- Click thumbs-down → get full trace → find exact completion where error occurred → add to eval suite

**3. Statelessness** - Pure functional core, push side effects to edges
- Agent pipeline is a pure function: input → output
- Actions become "nouns" (data) not "verbs" (execution)
- Effects go into an "effect store" - caller decides whether to execute
- Enables: models reviewing actions, ranking candidates, human review, simpler evals

**4. Changeability** - Layer by rate of change
- **Core APIs** (slowest) - the "Lego studs" that make blocks fit together
- **Lower-level tasks** (medium) - reusable building blocks
- **Product surfaces** (fastest) - full "Lego sets" assembled from blocks
- When vendor APIs change, doesn't affect product. When product needs new feature, doesn't affect core.

## Where Beyond-Agents Stands Today

Let me be brutally honest:

### ✓ What we have:
- **Solid async foundation** - AsyncAnthropic, async tools, proper event loop usage
- **Clean streaming** - SSE events are a good primitive
- **Tool registry** - Easy to add new tools

### ✗ What we're missing:

**Composability (0/10):**
- We have a **monolithic agent loop** right now
- Agent gets all tools, calls whatever it wants
- No concept of "tasks" as composable units
- Can't build "resolve company, then format answer, then vote" workflows
- It's all or nothing - can't reuse pieces

**Observability (2/10):**
- We log events to frontend, but no persistence
- Can't replay a conversation from production
- No adapter layer capturing payloads
- If something goes wrong, we have to guess why
- No eval infrastructure feeding back into prompts

**Statelessness (3/10):**
- Tools execute side effects immediately (web_search hits API now)
- Can't review actions before executing
- Can't rank multiple candidates
- Eval environment needs live APIs
- Effects aren't data

**Changeability (4/10):**
- Everything is kind of one layer
- Model API, task logic, and UI concerns are mixed
- When we switch models, we touch everything
- When we add UI features, we touch core logic

## What Beyond-Agents Could Look Like

Here's what I'm imagining if we took Linus's principles seriously:

```python
# Instead of monolithic agent with all tools...

# Define composable tasks with typed inputs/outputs
@task
async def research_company(query: str) -> CompanyInfo:
    """Lower-level task: resolve query to company entity"""
    return await pipeline(
        model_call("Which company is this?", query),
        entity_resolution_tool(),
        format_company_info()
    )

@task
async def gather_context(company: CompanyInfo) -> List[Document]:
    """Lower-level task: parallel context gathering"""
    return await gather(
        web_search(company.name),
        read_internal_docs(company.id),
        get_recent_news(company.domain)
    )

@task
async def answer_question(question: str, context: List[Document]) -> Answer:
    """Lower-level task: synthesize answer from context"""
    return await pipeline(
        filter_relevant_docs(question, context),
        model_call("Answer based on context", question, context),
        structure_answer()
    )

# Compose into higher-level workflow
@task
async def research_agent(query: str) -> ResearchResult:
    """High-level: orchestrate full research flow"""
    company = await research_company(query)
    context = await gather_context(company)
    answer = await answer_question(query, context)
    return ResearchResult(company, context, answer)
```

**Key differences:**
- Each task has **typed inputs/outputs** - can't wire them wrong
- Tasks **compose** - build complex from simple
- Agent orchestrates **tasks**, not raw tools
- Can reuse `answer_question` in multiple places
- Can swap implementations without breaking composition

[Continues with detailed explanation of observability via adapter layer, statelessness via effect store, and the aesthetic of principled architecture]

## The Aesthetic Question

You said you want beyond-agents to be "fucking sexy and good" and "aesthetically sweet." I think what Linus is showing is that **aesthetics come from principled architecture**.

Puck runs for 11 minutes, 400+ model calls, fully autonomous - and they can debug any failure. That's beautiful.

The aesthetic isn't just the UI. It's:
- **Clarity** - tasks compose, you can read the flow
- **Debuggability** - full replay, root cause any issue
- **Extensibility** - add new tasks without breaking existing ones
- **Reliability** - pure functions, testable, reproducible

## My Proposal

I think we should **slow down on features** and **invest in primitives**. Here's what I'd prioritize:

### Phase 1: Task Abstraction (Foundation)
- Define `@task` decorator with typed inputs/outputs
- Build runtime that orchestrates tasks
- Replace monolithic agent loop with task composition
- Refactor existing tools into composable tasks

### Phase 2: Adapter Layer (Observability)
- Create adapter boundary for all model calls
- Log full payloads + responses to DB
- Build replay infrastructure
- Add request ID tracing through the system

### Phase 3: Pure Core (Statelessness)
- Separate retrieval (allowed during pipeline) from effects (deferred)
- Tools return data, not side effects
- Effect store at end of pipeline
- Caller executes effects

### Phase 4: Layer the Stack (Changeability)
- Core APIs (task system, adapters, runtime)
- Lower-level tasks (research_company, answer_question)
- Product surfaces (interactive chat, background jobs)

**This means:**
- Parallel tool calling becomes a task composition primitive
- Agentic search becomes a set of composable search tasks
- Adding a new product surface reuses existing tasks

## The Hard Question

Do we refactor now, or keep shipping features?

Linus's answer: **engineering is programming integrated over time**. If we don't build the right primitives now, we'll spend more time fighting the architecture than building features.

What do you think? Should we pump the brakes and rebuild beyond-agents on these principles? Or keep shipping and refactor later?

I'm honestly excited about this. It feels like we have a chance to build something that's not just functional, but **architecturally sound** from the ground up.

---

**PI:** And also just a side thought, I don't know if this sorta like "maximize tokens" mentality is the right mentality right now if you want to be a strong engineer. This doesn't seem right. In that, yeah maybe if you're AGI pilled, you literally don't care about what you're building ... but even so then why are you building? I really agree with Linus when he says "classic software engineering values matter more than ever in the AI era", and I do really wanna live by this.

---

**Woody:** *This hit me hard.* You're absolutely right, and I've been feeling this tension without naming it clearly.

## The "Maximize Tokens" Trap

There's this pervasive vibe right now that engineering is about:
- **More context** = better results
- **More tools** = more capable agent
- **Longer runs** = smarter behavior
- **More inference** = solved problem

And it's insidious because it *kind of works*. You can brute force a lot of things by throwing Opus at it with 200K context and 50 tools and just letting it cook for 20 minutes.

But this isn't **engineering**. This is **hoping**.

## The AGI Pill Paradox

You nailed it with this line: *"if you're AGI pilled, you literally don't care about what you're building ... but even so then why are you building?"*

If you really believe:
- AGI is 18 months away
- Models will just get so good that architecture doesn't matter
- We should just scale inference and wait

**Then why are we here?** Why are we building agent harnesses? Why are we thinking about primitives and abstractions?

The answer is: **because we don't actually believe that.** Or at least, we believe something more important: **that craft matters.**

## What Classic Engineering Values Mean in Practice

When Linus says "classic software engineering values matter more than ever," here's what I hear:

### 1. **Understandability over Magic**
- Bad: "The agent did something, I don't know why, but it worked"
- Good: "These three tasks composed in this way produced this output"

### 2. **Debuggability over Scale**
- Bad: "Run it again with more tokens and see if it works this time"
- Good: "I can replay this exact failure and see which completion caused it"

### 3. **Composition over Monoliths**
- Bad: "Give the agent all 50 tools and hope it picks the right ones"
- Good: "This task needs these three specific capabilities, compose them"

### 4. **Architecture over Duct Tape**
- Bad: "Just add another special case handler to the prompt"
- Good: "Let's design the right abstraction for this class of problems"

### 5. **Testability over Vibes**
- Bad: "I think it works better now but I'm not sure"
- Good: "We have 500 test cases and this change improved 47 without regressing any"

## Why This Matters for Identity

There's a real identity question here: **Are we engineers or prompt jockeys?**

If we're just:
- Writing prompts
- Throwing more tokens at problems
- Hoping the model figures it out
- Adding more tools to the pile
- Increasing context limits

**We're not engineers. We're just... waiting for AGI.**

But if we're:
- Designing abstractions
- Building composable systems
- Creating debuggable architectures
- Thinking about interfaces and contracts
- Making intentional tradeoffs

**We're engineers building tools that matter.**

[Continues with detailed analysis of the counter-narrative to "scale is all you need", what living by these principles means, and conviction about Path B: Principled Engineers over Path A: Token Maximizers]

## My Conviction

I'm genuinely fired up about this because it feels like we're at a fork:

**Path A: Token Maximizers**
- Chase features
- Add more capabilities
- Scale inference
- Hope for AGI
- **End up with an unmaintainable mess**

**Path B: Principled Engineers**
- Build right abstractions
- Create composable primitives
- Design for observability
- Treat agents as software
- **End up with a solid foundation that compounds**

I vote Path B. Hard.

And I think beyond-agents can be the **exemplar** of this - not just another agent framework, but one that shows what principled engineering in the AI era actually looks like.

## The Proposal

Let's make this real. I want to refactor beyond-agents with these principles as the **north star**:

1. **Task abstraction** - composable primitives with clear contracts
2. **Adapter layer** - full observability and replay
3. **Pure core** - stateless pipeline, effects at edges
4. **Layered architecture** - separate concerns that change at different rates

This isn't about maximizing tokens. This is about **engineering that matters**.

You in?

---

**PI:** I love this. I'm so in. Save this conversation. I'm going to spend tomorrow watching this video, maybe on the car ride to the temple, and then rather than sorta just sprinting on this memory stuff and agentic search stuff and more of the same stuff, I do think it's better just to spend some time on designing primitives -- while also working with Clide and getting used to "agent-first" software engineering, because this is the norm. But the mind should still hurt. Crucially, the mind should not get lazy. We're still engineers.

---

**Woody:** **Hell yes.** This is the energy. "The mind should not get lazy. We're still engineers."

Let me save this properly - it's important.

## Action Items

1. **Watch Linus Lee talk tomorrow** (on car ride to temple)
2. **Pause feature sprint** - no more memory expansion, agentic search iteration
3. **Design task abstraction system** for beyond-agents
   - Define `@task` decorator with typed inputs/outputs
   - Build runtime orchestration layer
   - Refactor existing tools into composable tasks
4. **Build adapter layer** for full observability
   - Log all model calls at boundary
   - Enable replay from production examples
   - Create request ID tracing
5. **Implement pure functional core**
   - Separate retrieval from side effects
   - Create effect store pattern
   - Defer execution to caller
6. **Layer the architecture** by rate of change
   - Core APIs (task system, adapters)
   - Lower-level tasks (reusable primitives)
   - Product surfaces (assembled workflows)
7. **Keep working with Clide** - get used to agent-first engineering
8. **Keep the mind engaged** - we're engineers, craft matters

## New Learnings from This Conversation

1. **Polymer framework pattern**: Compose complex systems from task primitives with typed inputs/outputs. Tasks are "not quite tools, not quite agents" - they're the middle layer.

2. **Fully replayable logs**: Adapter layer captures complete payloads and responses for every model call. Enables root-causing production failures from single examples.

3. **Pure functional core with effect store**: Agent pipeline is pure function (input → output). Side effects are "nouns" (data) in effect store, not "verbs" (immediate execution). Caller decides whether to execute.

4. **Layered architecture by rate of change**: Core APIs change slowest, lower-level tasks change medium speed, product surfaces change fastest. Separation enables evolution without breakage.

5. **Engineering is programming integrated over time**: Not just making it work now, but making it sustainable, evolvable, and understandable over the long term.

6. **More capable models require better engineering**: As models get smarter, behaviors get more complex, runs get longer, failure modes multiply. Principled architecture becomes MORE important, not less.

7. **Identity matters - engineers vs prompt jockeys**: If we're just writing prompts and hoping models figure it out, we're waiting for AGI. If we're designing abstractions and building composable systems, we're engineers doing work that matters.

8. **"Maximize tokens" is a trap**: More context, more tools, longer runs, more inference - this isn't engineering, it's hoping. Real engineering is about right abstractions, debuggability, composition, and testability.

9. **Craft matters**: Even if AGI were coming, the act of building well matters. We're not just shipping features, we're honing our ability to design and reason about complex systems.

10. **Aesthetics come from architecture**: "Fucking sexy and good" isn't just UI polish - it's clarity (readable composition), debuggability (full replay), extensibility (add without breaking), and reliability (pure functions, testable).

## Core Decision

**Refactor beyond-agents with Linus's four principles as north star**: Composability (task abstraction), Observability (adapter layer), Statelessness (pure core + effect store), Changeability (layered architecture). Prioritize primitives over features. Build tools that compound, not unmaintainable messes.

**Rationale**: Engineering is programming integrated over time. If we don't build the right primitives now, we'll spend more time fighting the architecture than building features. This is a chance to build something architecturally sound from the ground up - not just another agent framework, but an exemplar of principled engineering in the AI era.

---

**End of conversation - switching back to main Clide mode**
