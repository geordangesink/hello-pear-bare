const { test } = require('brittle')

require('./tea')
require('./commands')
require('./components')
require('./viewport')
require('./list')
require('./style')
require('./cli-bridge')

test('works', (t) => {
  t.pass()
})
