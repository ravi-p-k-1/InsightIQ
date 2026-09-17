# InsightIQ MCP Server

A local [MCP](https://modelcontextprotocol.io) server that lets an agent (Claude
Code, Claude Desktop, or any other MCP client) look up real FRED economic
data series directly.

It's a single self-contained process: FRED search, data fetching, and the MCP
stdio transport all live here. There is no database and no LLM call anywhere
in this server — it returns raw retrieved data only, and the calling agent is
responsible for analyzing that data and writing any explanation.

## Setup

```bash
npm.cmd install
```

Create `.env` from `.env.template`:

```bash
FRED_API_KEY=your_fred_api_key_here
FRED_REQUESTS_PER_MINUTE=120
```

Run it directly to confirm it starts:

```bash
npm.cmd start
```

## Registering with Claude Code

The repository root already has a project-scoped `.mcp.json` that points at
this server:

```json
{
  "mcpServers": {
    "insightiq": {
      "command": "node",
      "args": ["--env-file=mcp/.env", "mcp/src/server.js"]
    }
  }
}
```

Claude Code picks this up automatically when opened at the repository root
(with your approval on first use). To register it manually or in another MCP
client, run the same command with a working `.env` in place.

## Tools

### `search_economic_series`

Searches FRED's live series catalog. Takes `queries`: 1-3 concise, FRED-style
keyword phrases (e.g. `["inflation", "consumer price index"]`) rather than a
full question — FRED's full-text search effectively requires every word in a
phrase to match, so short specific phrases work far better than sentences.
Returns real FRED series IDs and titles only; it never invents series IDs.

Optional `limit` (1-10, default 4) caps how many series come back. Optional
`tags`/`excludeTags` filter by FRED's tag vocabulary (e.g.
`tags: ["usa", "state"]` to force state-level series, `excludeTags: ["nsa"]`
to drop seasonally-unadjusted ones) — use `list_series_tags` first to find
valid tag names, since a wrong guess silently returns zero results.

### `get_series_observations`

Takes `series` (FRED series IDs, typically from `search_economic_series`) and
fetches their historical annual observations and units. Returns raw data
only — no summary or explanation is generated.

### `get_economic_data`

Convenience tool that chains the two above: searches for relevant series using
`searchQueries` if given (falling back to the raw `question` otherwise), then
fetches their observations. Still returns raw data only — the calling agent
should analyze it and write the answer. Use the two tools separately when you
want to inspect or filter the candidate series before fetching observations.
Also accepts `limit`, `tags`, and `excludeTags`, same as `search_economic_series`.

### `list_series_tags`

Given a topic phrase, returns the FRED tags that actually exist among
matching series, each with how many series it covers (e.g. `usa` — 41,962
series, `nsa` — 44,932 series). FRED's tag names are a controlled vocabulary
that usually can't be guessed reliably, so this is the discovery step meant
to precede filtering `search_economic_series`/`get_economic_data` with
`tags`/`excludeTags`.

## Environment variables

- `FRED_API_KEY` (required): your FRED API key.
- `FRED_REQUESTS_PER_MINUTE` (optional): caps outgoing FRED request rate.
  Defaults to 120, matching FRED's documented limit. All FRED calls from this
  server (search, metadata, observations) share one rate limiter.

## Error handling

Tool failures (invalid input, no matching series, FRED unavailable, etc.) are
returned as MCP tool results with `isError: true` and a human-readable
message, rather than crashing the server, so the calling agent can see and
react to them.

## Evals

There is no separate unit-test suite — this server is verified entirely
through MCP-level evals in `evals/`, which connect a real `Client` to the
real `createServer()` over the SDK's in-memory transport (no subprocess, no
mocking) and drive it exactly the way an agent would: by calling tools by
name with real arguments.

```bash
npm.cmd run eval:contract          # tool inventory, schema/error-path, happy-path checks
npm.cmd run eval:retrieval         # retrieval recall floor (single raw question)
npm.cmd run eval:retrieval:smart   # retrieval recall ceiling (curated query plans)
npm.cmd run eval                    # all three
```

### `eval:contract`

Asserts the server's actual protocol-level behavior: it exposes exactly the
four tools above, unknown tool names and schema-invalid arguments (empty
arrays, missing required fields, an out-of-range `limit`) come back as
`isError: true` instead of throwing, a schema-valid but semantically invalid
series ID is rejected by the handler, `limit` and the `tags`/`excludeTags`
filter actually change what comes back, and each tool succeeds on a real,
known-good call against live FRED.

### `eval:retrieval`

Runs `evals/questions.json` (natural-language questions with known-relevant
FRED series) through the real `search_economic_series` tool with each
question passed as a single raw `queries` entry (`limit: 5`), and reports
Recall@5 and response time. This deliberately evaluates the floor: no phrase
splitting, no tags, exactly what the plain `question` field gets with zero
query intelligence applied.

### `eval:retrieval:smart`

Runs the same questions and scoring, but through `evals/queryPlans.json` — a
checked-in, per-question set of concise search phrases (and `tags` where they
help) chosen the way a competent agent actually would, replayed deterministically
with no LLM call needed at eval time. This measures the ceiling the `queries`/
`tags` parameters enable: splitting compound questions into per-topic phrases
and using real economic terminology instead of the raw sentence took this from
45.3% (floor) to 62.4% (ceiling) on the same question set. If `queryPlans.json`
gets out of sync with `questions.json` (wrong length, or a question at the same
index doesn't match), the eval fails loudly with a diff rather than silently
scoring against the wrong plan.

All three evals hit the live FRED API, so they need a real `FRED_API_KEY` and
are run manually/locally rather than in CI.
