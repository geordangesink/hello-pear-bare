// Tests for the CLI↔TUI glue: the redirectable logger and the worker→Msg
// bridge. Both are dependency-free so they run without the pear runtime.
const { test } = require('brittle')
const { createLogger, bridgeWorkerRun } = require('../lib/cli-bridge')

test('logger: buffers until attached, then flushes in order', (t) => {
  const logger = createLogger()
  logger.log('one')
  logger.error('two')

  const seen = []
  logger.attach((level, line) => seen.push([level, line]))

  t.alike(
    seen,
    [
      ['info', 'one'],
      ['error', 'two']
    ],
    'buffered lines flush to the sink in order, with levels'
  )

  logger.log('three')
  t.alike(seen[2], ['info', 'three'], 'subsequent lines go straight to the sink')
})

test('logger: joins args and stringifies non-strings', (t) => {
  const logger = createLogger()
  const seen = []
  logger.attach((level, line) => seen.push(line))

  logger.log('[updater]', { delta: 3 })
  logger.error('boom', new Error('nope'))

  t.is(seen[0], '[updater] {"delta":3}', 'objects are JSON-stringified')
  t.ok(seen[1].startsWith('boom '), 'error is appended')
  t.ok(seen[1].includes('nope'), 'error message preserved')
})

test('bridgeWorkerRun: streams become worker Msgs', (t) => {
  let captured = null
  const fakeRun = (script, opts) => {
    captured = { script, opts }
    return { id: 'worker' }
  }
  const sent = []
  const run = bridgeWorkerRun(fakeRun, (msg) => sent.push(msg))

  const handle = run('./workers/main.js')
  t.is(handle.id, 'worker', 'returns whatever the underlying run returns')
  t.is(captured.script, './workers/main.js', 'passes the script through')

  captured.opts.onStdout(Buffer.from('out'))
  captured.opts.onStderr(Buffer.from('err'))
  captured.opts.onData(Buffer.from('ipc'))
  captured.opts.onExit(0)

  t.is(sent.length, 4, 'one Msg per stream event')
  t.alike(
    sent.map((m) => [m.type, m.stream]),
    [
      ['worker', 'stdout'],
      ['worker', 'stderr'],
      ['worker', 'ipc'],
      ['worker', 'exit']
    ],
    'each event tagged with its stream'
  )
  t.is(String(sent[2].data), 'ipc', 'data payload forwarded')
  t.is(sent[3].code, 0, 'exit carries the code')
  t.is(sent[0].script, './workers/main.js', 'msgs carry the originating script')
})

test('bridgeWorkerRun: caller handlers override the bridge', (t) => {
  let opts = null
  const run = bridgeWorkerRun(
    (_s, o) => (opts = o),
    () => t.fail('should not reach the bridge for an overridden stream')
  )

  let got = null
  run('./w.js', { onData: (data) => (got = String(data)) })
  opts.onData(Buffer.from('custom'))

  t.is(got, 'custom', 'a provided handler wins over the default bridge')
})
