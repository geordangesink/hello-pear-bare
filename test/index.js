const { test } = require('brittle')

require('./tea')
require('./commands')
require('./components')
require('./viewport')
require('./list')
require('./style')
require('./mouse')
require('./help')
require('./progress')
require('./paginator')
require('./textarea')

test('works', (t) => {
  t.pass()
})
