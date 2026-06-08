export function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name} in your backend environment.`)
  }

  return value
}
