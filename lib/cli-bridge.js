// Glue between the pear-cli wrapper and a tea TUI. Kept dependency-free (no
// pear-runtime / swarm) so it can be unit-tested in isolation.

// A redirectable logger. The wrapper logs through this instead of console.* so
// the destination can be chosen *after* construction:
//   - classic mode: logger.toConsole() — prints as before
//   - TUI mode: logger.attach((level, line) => program.send(...)) — routes log
//     lines into the model so they never corrupt the alt-screen
// Until a sink is attached, lines buffer, so nothing printed during setup leaks
// onto a TUI that's about to take over the screen.
function createLogger() {
  const buffer = []
  let sink = null

  function emit(level, parts) {
    const line = parts.map((p) => (typeof p === 'string' ? p : inspect(p))).join(' ')
    if (sink) sink(level, line)
    else buffer.push([level, line])
  }

  function inspect(value) {
    if (value instanceof Error) return value.stack || value.message
    try {
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    } catch {
      return String(value)
    }
  }

  return {
    log: (...args) => emit('info', args),
    error: (...args) => emit('error', args),

    // Send all buffered and future lines to `fn(level, line)`.
    attach(fn) {
      sink = fn
      const pending = buffer.splice(0)
      for (const [level, line] of pending) fn(level, line)
    },

    // Convenience sink that writes to the real console.
    toConsole() {
      this.attach((level, line) => {
        if (level === 'error') console.error(line)
        else console.log(line)
      })
    }
  }
}

// Wrap a `run(script, opts)` so a worker's streams arrive as tea Msgs via
// `send`. Each becomes { type: 'worker', stream, script, ... }:
//   stdout/stderr/ipc -> { data }   exit -> { code }
// Caller-supplied handlers in `runOpts` still win (spread last), so a model can
// override any single stream while the rest stay bridged.
function bridgeWorkerRun(run, send) {
  return (script, runOpts = {}) =>
    run(script, {
      onStdout: (data) => send({ type: 'worker', stream: 'stdout', script, data }),
      onStderr: (data) => send({ type: 'worker', stream: 'stderr', script, data }),
      onData: (data) => send({ type: 'worker', stream: 'ipc', script, data }),
      onExit: (code) => send({ type: 'worker', stream: 'exit', script, code }),
      ...runOpts
    })
}

module.exports = { createLogger, bridgeWorkerRun }
