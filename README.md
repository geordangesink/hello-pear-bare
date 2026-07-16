# hello-pear-bare

> Pear Hello World for Standalone Bare Processes with `pear-runtime`

End-to-end boilerplate for embedding [pear-runtime] into a Standalone [Bare] Process with peer-to-peer OTA update support.

- Peer-to-Peer deployment with [pear][pear-docs] CLI
- Peer-to-Peer Over-the-Air updates with [`pear-runtime`][pear-runtime] module
- Cross-platform standalone distributables via [`bare-build`][bare-build]

## Variants

- [`main`](https://github.com/holepunchto/hello-pear-bare/tree/main): runs `pear-runtime` inside a Bare worker thread.
- (current) [`single-thread`](https://github.com/holepunchto/hello-pear-bare/tree/variant/single-thread): workerless with `pear-runtime` updates.

## Table of Contents

- [OS Support](#os-support)
- [Requirements](#requirements)
- [Development](#development)
  - [Install Dependencies](#install-dependencies)
  - [Create upgrade links](#create-upgrade-links)
  - [Start](#start)
- [Architecture](#architecture)
  - [Updates](#updates)
- [Peer-to-Peer Deployments](#peer-to-peer-deployments)
- [Installing Distributables](#installing-distributables)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## OS Support

- **macOS** — arm64, x64
- **Linux** — arm64, x64
- **Windows** — arm64, x64

## Requirements

- `npm` via [Node.js][nodejs]
- [pear][pear-docs] - `npx pear`

## Development

### Install Dependencies

```sh
npm install
```

### Create upgrade links

This template keeps separate update links for production, staging and development:

```json
"upgrade": {
  "production": "pear://<YOUR_PRODUCTION_KEY_HERE>",
  "stage": "pear://<YOUR_STAGE_KEY_HERE>",
  "dev": "pear://<YOUR_DEV_KEY_HERE>"
}
```

Create one link per channel with [`pear touch`](https://docs.pears.com/reference/cli.html#pear-touch-flags-channel):

```sh
pear touch
```

Copy each generated `pear://...` link into its matching `upgrade` field in `package.json`.

### Start

Start app in development mode:

```sh
npm start
```

By default this repo starts with `--no-updates` in development to avoid local dev binaries being swapped while you iterate.

Enable updates for local flow testing:

```sh
npm start -- --updates
```

Development uses the `upgrade.dev` link.

## Architecture

### Updates

Updates are managed by the `App` class in `app.js`, which wraps the updater lifecycle as a ready resource and emits update events for `main.mjs` to log.

The selected build channel resolves to `upgrade.production`, `upgrade.stage` or `upgrade.dev` in `package.json`. Production is the default build channel.

Per-run disable updates:

```sh
npm start -- --no-updates
```

## Peer-to-Peer Deployments

Use the [`pear`][pear-docs] CLI to deploy applications.

Set the matching channel in `package.json#upgrade` to its distribution drive link, then follow the default flow from section 4 onward:

[hello-pear-electron: 4. Build Deployment Directory and onward](https://github.com/holepunchto/hello-pear-electron#4-build-deployment-directory-)

## Installing Distributables

Once the `pear://<key>` upgrade link is seeding the build deployment folder the standalone binary can be installed peer-to-peer directly onto the system with Pear:

```sh
npx pear-install pear://<key>
```

## Scripts

- `npm start` - run the Bare Process in dev mode (`bare bin.mjs --no-updates`)
- `npm test` - run `brittle-bare` tests
- `npm run lint` - run prettier check and lunte
- `npm run format` - format repository with prettier
- `npm run make` - build the production channel for the current OS/arch
- `npm run make:stage` - build the staging channel for the current OS/arch
- `npm run make:dev` - build the development channel for the current OS/arch
- `npm run make:darwin-arm64` - build the production channel to `out/darwin-arm64`
- `npm run make:darwin-x64` - build the production channel to `out/darwin-x64`
- `npm run make:linux-arm64` - build the production channel to `out/linux-arm64`
- `npm run make:linux-x64` - build the production channel to `out/linux-x64`
- `npm run make:win32-arm64` - build the production channel to `out/win32-arm64`
- `npm run make:win32-x64` - build the production channel to `out/win32-x64`

The manual GitHub Build workflow accepts a channel. Tag builds always use production.

## Project Structure

- `bin.mjs` - development entrypoint
- `main.mjs` - CLI and runtime wiring shared by all channels
- `app.js` - update resource used by the entrypoint
- `targets/main.*.mjs` - channel-specific build entrypoints
- `scripts/make.js` - channel and platform/arch build selector
- `test/index.js` - brittle-bare tests

## Troubleshooting

- `INVALID_URL` with an `upgrade` placeholder means the selected channel link in `package.json` has not been replaced. Run `pear touch`, then put the generated `pear://...` link in the matching channel.
- If updates do not trigger, verify the selected channel contains a valid `upgrade` Pear link and that peers are seeding the target drive.
- If `npm run make` fails on unsupported hosts, run a specific `make:<platform>-<arch>` script or build on a supported host.
- This template does not implement app-level data persistence; it is a minimal CLI + updater example.

<!-- Reference Links -->

[pear-docs]: https://docs.pears.com
[pear-runtime]: https://github.com/holepunchto/pear-runtime
[Bare]: https://github.com/holepunchto/bare
[nodejs]: https://nodejs.org
[bare-build]: https://github.com/holepunchto/bare-build
