export function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name} in your MCP server environment.`)
  }

  return value
}
