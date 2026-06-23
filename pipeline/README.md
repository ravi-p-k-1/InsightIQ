# InsightIQ Data Pipeline

This folder contains offline ingestion and indexing jobs. These scripts are
separate from the backend API because catalog generation can be long-running.

## Structure

- `scripts/`: Thin command-line entry points.
- `src/clients/`: External API clients, retries, and request throttling.
- `src/services/`: Catalog retrieval and transformation workflows.
- `src/config/`: FRED scopes and pipeline constants.
- `src/utils/`: Environment, paths, rate limiting, and file output helpers.
- `data/`: Generated pipeline output, excluded from Git.

## Setup

Create `pipeline/.env` from `pipeline/.env.template`:

```bash
FRED_API_KEY=your_fred_api_key_here
FRED_REQUESTS_PER_MINUTE=60
```

`FRED_REQUESTS_PER_MINUTE` controls the maximum request start rate. Requests
are evenly spaced to avoid bursts, and retries use the same scheduler. The
default of 60 is intentionally conservative because FRED does not document one
universal public RPM quota.

## FRED National and State Catalog

The FRED catalog script retrieves all series matching these tag combinations:

- `usa;nation`
- `usa;state`

It verifies that FRED currently exposes the `nation` and `state` geography-type
tags, follows FRED's 1,000-record pagination limit, retries transient failures,
deduplicates series IDs, and stores complete series metadata as JSON Lines.

Check the counts without downloading all records:

```bash
cd pipeline
npm run count:fred
```

Fetch and store the catalog:

```bash
cd pipeline
npm run fetch:fred
```

Both commands load configuration from `pipeline/.env`.

Generated files:

- `data/fred/national-state-series.jsonl`
- `data/fred/national-state-summary.json`

The summary distinguishes counts advertised by FRED from rows actually
returned through pagination. These can differ if FRED's result count changes or
the endpoint stops returning rows before the advertised offset.

The generated `pipeline/data/` directory is intentionally excluded from Git.
