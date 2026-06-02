const { command, flag } = require('paparam')
const storageAPI = require('bare-storage')
const os = require('bare-os')
const path = require('bare-path')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const PearRuntime = require('pear-runtime')

// Wires up pear-runtime, the OTA updater, swarm replication and teardown so a
// CLI only has to describe its own flags and spawn its own workers. Returns a
// small handle whose `start(handler)` runs the app and `run(script)` spawns a
// worker with default IPC/stdout/stderr logging already attached.
function createPearCli(pkg, opts = {}) {
  const appName = pkg.productName || pkg.name
  const userFlags = opts.flags || []

  const cmd = command(
    appName,
    flag('--storage <dir>', 'custom storage directory for pear-runtime'),
    flag('--no-updates', 'disable OTA updates for this run'),
    ...userFlags.map(([usage, description]) => flag(usage, description))
  )

  cmd.parse(global.Bare.argv.slice(2))

  const flags = cmd.flags
  const updates = flags.updates
  const isDev = path.basename(Bare.argv[0] || '').startsWith('bare')
  const storage = flags.storage || (isDev ? null : path.join(storageAPI.persistent(), appName))
  const dir = storage || path.join(os.tmpdir(), 'pear', appName)
  const store = new Corestore(path.join(dir, 'pear-runtime', 'corestore'))
  const swarm = new Hyperswarm()

  console.log(`${appName} v${pkg.version}`)
  console.log(`Updates: ${updates === false ? 'disabled' : 'enabled'}`)

  const runningAppPath =
    !isDev && global.Bare && Array.isArray(Bare.argv) && typeof Bare.argv[0] === 'string'
      ? path.resolve(Bare.argv[0])
      : null

  const pear = new PearRuntime({
    dir,
    app: runningAppPath,
    updates,
    version: pkg.version,
    upgrade: pkg.upgrade,
    name: appName,
    store,
    swarm
  })

  if (updates !== false) {
    pear.updater.on('updating', () => console.log('[updater] getting new update'))

    pear.updater.on('updating-delta', (d) => console.log('[updater]', d))

    pear.updater.on('updated', async () => {
      console.log('[updater] update complete... applying')
      await pear.updater.applyUpdate()
      console.log('[updater] applied update, restart to run latest version')
    })

    swarm.on('connection', (connection) => store.replicate(connection))

    swarm.join(pear.updater.drive.core.discoveryKey, {
      client: true,
      server: false
    })
  }

  pear.on('error', (err) => {
    console.error('[pear-runtime:error]', err)
  })

  const workers = []

  function run(script, runOpts) {
    const worker = PearRuntime.run(script, runOpts)
    workers.push(worker)

    worker.stdout.on('data', (data) => console.log(`[worker:stdout] ${data}`))
    worker.stderr.on('data', (data) => console.error(`[worker:stderr] ${data}`))
    worker.on('data', (data) => console.log(`[worker:ipc] ${data}\n`))
    worker.on('exit', (code) => console.log(`[worker] exited with code ${code}`))

    return worker
  }

  let tearingDown = false
  async function teardown(code = 0) {
    if (tearingDown) return
    tearingDown = true
    for (const worker of workers) {
      try {
        worker.destroy()
      } catch {}
    }
    try {
      await pear?.close()
    } catch {}
    global.Bare.exit(code)
  }

  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT']) {
    global.Bare.on(sig, () => teardown(0))
  }

  function start(handler) {
    handler({ run, flags, pear, swarm, store, appName, dir })
    console.log('CLI ready. Press Ctrl+C to stop.')
  }

  return { start, run, teardown, flags, pear, swarm, store, appName, dir }
}

module.exports = createPearCli
