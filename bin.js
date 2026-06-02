const createPearCli = require('./lib/pear-cli')
const pkg = require('./package.json')

const cli = createPearCli(pkg, {
  flags: [['--message <text>', 'message sent to worker IPC stream']]
})

cli.start(({ run, flags }) => {
  const worker = run('./workers/main.js')
  worker.write(Buffer.from(flags.message || 'hello from cli main'))
})
