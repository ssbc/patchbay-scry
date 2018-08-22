// run:
// $ npx electro views/new.test.js

const NewScry = require('./new')
require('../lib/styles-inject')()

const newScry = NewScry({
})

document.body.appendChild(newScry)

