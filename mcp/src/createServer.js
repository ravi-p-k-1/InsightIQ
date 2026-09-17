import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as searchEconomicSeries from './tools/searchEconomicSeries.js'
import * as getSeriesObservations from './tools/getSeriesObservations.js'
import * as getEconomicData from './tools/getEconomicData.js'
import * as listSeriesTags from './tools/listSeriesTags.js'

const tools = [searchEconomicSeries, getSeriesObservations, getEconomicData, listSeriesTags]

export function createServer() {
  const server = new McpServer({
    name: 'insightiq',
    version: '0.0.0',
  })

  for (const tool of tools) {
    server.registerTool(tool.name, tool.config, async (args) => {
      try {
        return await tool.handler(args)
      } catch (error) {
        // Surface failures as tool results rather than crashing the server,
        // so the calling agent can see and react to the error message.
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        }
      }
    })
  }

  return server
}
