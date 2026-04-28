const pkg = require('./package.json')

module.exports = {
  name: pkg.productName || pkg.name,
  standalone: true
}
