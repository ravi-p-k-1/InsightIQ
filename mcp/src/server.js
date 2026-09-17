#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './createServer.js'

const server = createServer()
const transport = new StdioServerTransport()
await server.connect(transport)

// stdout is reserved for the MCP protocol stream; log lifecycle info to stderr only.
console.error('InsightIQ MCP server running on stdio.')

async function shutdown() {
  await server.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
