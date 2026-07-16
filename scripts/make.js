#!/usr/bin/env node
'use strict'

const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const pkg = require('../package.json')

const root = path.resolve(__dirname, '..')
const channel = process.env.CHANNEL || process.argv[2] || 'production'
const host = process.argv[3] || `${os.platform()}-${os.arch()}`
const channels = new Set(['production', 'stage', 'dev'])
const hosts = new Set([
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'win32-arm64',
  'win32-x64'
])

if (!channels.has(channel)) {
  console.error(`Unsupported channel: ${channel}`)
  console.error('Supported channels: production, stage, dev')
  process.exit(1)
}

if (!hosts.has(host)) {
  console.error(`Unsupported platform/arch: ${host}`)
  console.error(
    'Supported targets: darwin-arm64, darwin-x64, linux-arm64, linux-x64, win32-arm64, win32-x64'
  )
  process.exit(1)
}

const bareBuild = path.join(path.dirname(require.resolve('bare-build/package')), 'bin.js')
const result = spawnSync(
  process.execPath,
  [
    bareBuild,
    '--name',
    pkg.productName || pkg.name,
    '--standalone',
    '--host',
    host,
    '--out',
    path.join('out', host),
    path.join('targets', `main.${channel}.mjs`)
  ],
  {
    cwd: root,
    stdio: 'inherit'
  }
)

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

if (result.status !== 0) process.exit(result.status || 1)
