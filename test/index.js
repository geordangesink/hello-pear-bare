const { test } = require('brittle')

require('./tea')
require('./commands')

test('works', (t) => {
  t.pass()
})
