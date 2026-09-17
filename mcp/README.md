# InsightIQ MCP Server

A local [MCP](https://modelcontextprotocol.io) server that gives an AI agent
(Claude Code, Claude Desktop, or any other MCP client) the ability to look up
real FRED (Federal Reserve Economic Data) series and their historical
observations, so it can answer economic questions grounded in real data.

It returns raw retrieved data only — series, units, observations — never a
pre-written summary. The agent you're talking to does the analysis and writes
the answer itself, using this server purely to fetch real numbers instead of
guessing them.

## Install

You'll need a free FRED API key first: [get one here](https://fred.stlouisfed.org/docs/api/api_key.html)
(a couple of minutes, no cost).

Add this to your MCP client's configuration:

```json
{
  "mcpServers": {
    "insightiq": {
      "command": "npx",
      "args": ["-y", "insightiq-mcp"],
      "env": {
        "FRED_API_KEY": "your_fred_api_key_here"
      }
    }
  }
}
```

- **Claude Code**: add this to a `.mcp.json` file in your project (or your
  user-level MCP config).
- **Claude Desktop**: Settings → Developer → Edit Config, add this under
  `mcpServers` in the config file it opens.
- **Other clients**: any MCP client that supports launching a local server via
  a command accepts the same shape — check your client's docs for where its
  config file lives.

No installation step needed beyond that — `npx` downloads and runs the
package the first time it's launched.

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
fetches their observations. Still returns raw data only — the agent using this
tool analyzes it and writes the answer. Use the two tools separately when you
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

All FRED calls from this server (search, metadata, observations) share one
rate limiter capped at 120 requests/minute, matching FRED's documented limit
— fixed, not user-configurable, since there's no reason to want a different
value for FRED's own API.

## Error handling

Tool failures (invalid input, no matching series, FRED unavailable, etc.) are
returned as MCP tool results with `isError: true` and a human-readable
message, rather than crashing the server, so the agent using it can see and
react to them.

---

## Development

The following is only relevant if you want to modify this server or
contribute to it — not needed to use it.

Clone [the repository](https://github.com/ravi-p-k-1/InsightIQ) and install:

```bash
cd mcp
npm install
```

Create `.env` from `.env.template`:

```bash
FRED_API_KEY=your_fred_api_key_here
```

Run it directly to confirm it starts:

```bash
npm start
```

To point an MCP client at your local checkout instead of the published
package (useful while testing changes):

```json
{
  "mcpServers": {
    "insightiq": {
      "command": "node",
      "args": ["--env-file=/absolute/path/to/InsightIQ/mcp/.env", "/absolute/path/to/InsightIQ/mcp/src/server.js"]
    }
  }
}
```

### Evals

There is no separate unit-test suite — this server is verified entirely
through MCP-level evals in `evals/`, which connect a real `Client` to the
real `createServer()` over the SDK's in-memory transport (no subprocess, no
mocking) and drive it exactly the way an agent would: by calling tools by
name with real arguments.

```bash
npm run eval:contract          # tool inventory, schema/error-path, happy-path checks
npm run eval:retrieval         # retrieval recall floor (single raw question)
npm run eval:retrieval:smart   # retrieval recall ceiling (curated query plans)
npm run eval                    # all three
```

#### `eval:contract`

Asserts the server's actual protocol-level behavior: it exposes exactly the
four tools above, unknown tool names and schema-invalid arguments (empty
arrays, missing required fields, an out-of-range `limit`) come back as
`isError: true` instead of throwing, a schema-valid but semantically invalid
series ID is rejected by the handler, `limit` and the `tags`/`excludeTags`
filter actually change what comes back, and each tool succeeds on a real,
known-good call against live FRED.

#### `eval:retrieval`

Runs `evals/questions.json` (natural-language questions with known-relevant
FRED series) through the real `search_economic_series` tool with each
question passed as a single raw `queries` entry (`limit: 5`), and reports
Recall@5 and response time. This deliberately evaluates the floor: no phrase
splitting, no tags, exactly what the plain `question` field gets with zero
query intelligence applied.

#### `eval:retrieval:smart`

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
