import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer } from '../src/createServer.js'

// Connects a real MCP Client to a real MCP Server in-process, over the
// SDK's in-memory transport. This exercises the actual protocol path
// (tool registration, schema validation, handler dispatch) that a real
// agent goes through — no subprocess, no stdio framing, so it stays fast
// and reliable enough to run per-eval.
export async function createEvalClient() {
  const server = createServer()
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'insightiq-eval-client', version: '0.0.0' })

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ])

  return {
    client,
    close: () => Promise.all([client.close(), server.close()]),
  }
}

export function parseToolJson(result) {
  const text = result.content?.find((block) => block.type === 'text')?.text

  if (typeof text !== 'string') {
    throw new Error('Tool result did not contain a text content block.')
  }

  return JSON.parse(text)
}
