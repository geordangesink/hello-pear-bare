# hello-pear-bare

Pear Runtime hello world boilerplate for a CLI project using [**Bare**](https://github.com/holepunchto/bare) with OTA updates and standalone binary builds via [`bare-build`](https://github.com/holepunchto/bare-build).

## Install

```sh
npm install
```

## Development

```sh
npm start
```

Disable updates:

```sh
npm start -- --no-updates
```

Use custom storage:

```sh
npm start -- --storage ./storageDir
```

## Build

Build a standalone for a given arch (output at `out/<arch>`).

```sh
npm run build:<arch>
```

Pass `/out/<arch>` dirs to the [`pear-build`](https://github.com/holepunchto/pear-build) command to create a Deployment Folder for the updater to use.

## Updater Flow

Set the `upgrade` field in the package.json to your distribution drive link and follow the [default update flow](https://github.com/holepunchto/hello-pear-electron#4-build-deployment-directory-)

## Project Structure

- `bin.js`: CLI entrypoint — your app logic lives here
- `lib/pear-cli.js`: pear-runtime setup, updater/swarm wiring, worker logging and teardown (the boilerplate — you usually don't need to touch this)
- `workers/main.js`: example embedded bare worker via `run(...)`

### Writing your CLI

`bin.js` is the happy path. `createPearCli(pkg, opts)` handles storage, the OTA
updater, swarm replication, signal handling and teardown for you. You describe
your own flags and spawn your own workers:

```js
const createPearCli = require('./lib/pear-cli')
const pkg = require('./package.json')

const cli = createPearCli(pkg, {
  flags: [['--message <text>', 'message sent to worker IPC stream']]
})

cli.start(({ run, flags }) => {
  const worker = run('./workers/main.js')
  worker.write(Buffer.from(flags.message || 'hello from cli main'))
})
```

`start(handler)` calls your handler with `{ run, flags, pear, swarm, store, appName, dir }`.
`run(script)` spawns a worker with default stdout/stderr/IPC/exit logging
already attached. The `--storage` and `--no-updates` flags are provided for free.
