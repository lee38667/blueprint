# Context Engine & Strategy

Blueprint uses **Graphify** as its long-term context/knowledge-graph engine. The
graph lets an AI agent (or a developer) pull *only the most relevant* slice of the
codebase per task instead of re-reading everything — high-value context at low
token cost.

## The graph

Built from the whole source tree (code + docs), excluding `node_modules`/`.next`.

| Metric | Value |
|---|---|
| Nodes | 999 (951 from AST, 48 from doc semantics) |
| Edges | 2,184 |
| Communities | 58 (labeled) |
| Source | `graphify-out/graph.json` (GraphRAG data), `graphify-out/graph.html` (interactive), `graphify-out/GRAPH_REPORT.md` (audit) |

**Core abstractions (god nodes — highest connectivity):**
`useToastStore` (53 edges), `authGuard()` (33), `supabase` (33), `useAIBrain()`
(20), `handleError()` (20), `Layout()` (19), `supabaseWithRetry()` (19),
`useConfirm()` (17), `useGoals()` (17). Touch these carefully — they ripple.

## Context layers

The agent should assemble context in four layers, narrowing each time so the prompt
stays small but sufficient:

1. **Global / system** — invariants that always apply. Source: the root
   `CLAUDE.md` + `MEMORY.md` (security model, RLS `user_id` default rule, upgrade
   state). Pull this once per session.
2. **Project** — architecture-level shape. Source: [`ARCHITECTURE.md`](ARCHITECTURE.md),
   this file, and `graphify-out/GRAPH_REPORT.md` (god nodes + community map).
   Pull when starting work in an unfamiliar area.
3. **Feature** — the subgraph for the thing you're touching. Source: a Graphify
   query scoped to the feature (e.g. `graphify query "goal planning flow"`). It
   returns just the connected nodes + file/line locations — far cheaper than
   grepping and reading whole files.
4. **Session** — what changed this conversation. Source: git diff + the task list.
   Persist durable facts to `~/.claude/.../memory/` so they graduate to layer 1.

> Rule of thumb: answer "where does X live / what connects to X" from **layer 3**
> (a graph query) before reading files. Only open the files the query points at.

## Usage

```bash
# Ask the graph a question (BFS = broad context, --dfs = trace one path)
graphify query "how does API auth and rate limiting work?"
graphify query "what does the daily scripture flow touch?" --budget 1500

# Shortest path between two concepts / explain a node
graphify path "useGoals" "supabase"
graphify explain "authGuard()"

# Rebuild after significant changes (incremental — only changed files)
graphify . --update
```

npm shortcuts are wired in `package.json`: `npm run graph:query -- "..."`,
`npm run graph:explain -- "..."`, `npm run graph:update`.

## Token-efficiency notes

- The graph is **rebuilt incrementally** (`--update`) so re-indexing is cheap.
- Doc semantic extraction is the only LLM cost; code uses free AST extraction.
- Query results carry `source_location` (file:line) so the agent reads the exact
  span, not the whole file.
- Regenerate after merging a feature branch; commit `graph.json` +
  `GRAPH_REPORT.md` so the context engine travels with the repo. `graph.html` and
  `cache/` are git-ignored (large / machine-local).
