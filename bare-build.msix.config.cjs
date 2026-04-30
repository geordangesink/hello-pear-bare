const base = require('./bare-build.config.cjs')

module.exports = {
  ...base,
  manifest: './manifests/win32-msix.appxmanifest',
  subject: process.env.MSIX_CERT_SUBJECT,
  standalone: false
}
