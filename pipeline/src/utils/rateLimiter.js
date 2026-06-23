function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

export function createRateLimiter(requestsPerMinute) {
  const interval = Math.ceil(60_000 / requestsPerMinute)
  let nextRequestAt = 0

  return async function waitForRequestSlot() {
    const now = Date.now()
    const delay = Math.max(0, nextRequestAt - now)

    if (delay > 0) {
      await wait(delay)
    }

    nextRequestAt = Math.max(Date.now(), nextRequestAt) + interval
  }
}

export { wait }
