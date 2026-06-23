export function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name}. Add it to pipeline/.env.`)
  }

  return value
}

export function getPositiveIntegerEnv(name, fallback) {
  const value = Number(process.env[name] ?? fallback)

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return value
}
